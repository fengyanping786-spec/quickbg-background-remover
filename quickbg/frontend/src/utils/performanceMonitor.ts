/**
 * 性能监控工具
 * 用于监控应用性能指标和用户体验
 */

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

interface PerformanceConfig {
  enabled: boolean
  sampleRate: number
  maxMetrics: number
  reportUrl?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private config: PerformanceConfig = {
    enabled: true,
    sampleRate: 1.0, // 100%采样率
    maxMetrics: 100,
    reportUrl: undefined
  }

  constructor(config?: Partial<PerformanceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }

    // 初始化性能监控
    if (this.config.enabled && typeof window !== 'undefined') {
      this.setupPerformanceObserver()
      this.setupResourceTiming()
      this.setupLongTaskObserver()
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    }

    this.metrics.push(metric)

    // 限制存储的指标数量
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics)
    }

    // 可以在这里发送到监控服务
    this.reportMetric(metric)
  }

  /**
   * 获取性能指标
   */
  getMetrics(filter?: string): PerformanceMetric[] {
    if (filter) {
      return this.metrics.filter(metric => metric.name.includes(filter))
    }
    return [...this.metrics]
  }

  /**
   * 清除性能指标
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * 获取关键性能指标
   */
  getCoreWebVitals(): {
    fcp?: number
    lcp?: number
    fid?: number
    cls?: number
    ttfb?: number
  } {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return {}
    }

    const perf = window.performance
    const navEntry = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paintEntries = perf.getEntriesByType('paint')

    return {
      fcp: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      lcp: this.getLCP(),
      fid: this.getFID(),
      cls: this.getCLS(),
      ttfb: navEntry?.responseStart - navEntry?.requestStart
    }
  }

  /**
   * 获取最大内容绘制时间 (LCP)
   */
  private getLCP(): number | undefined {
    if ('PerformanceObserver' in window) {
      const entries = performance.getEntriesByType('largest-contentful-paint') as any[]
      return entries[entries.length - 1]?.renderTime || entries[entries.length - 1]?.loadTime
    }
    return undefined
  }

  /**
   * 获取首次输入延迟 (FID)
   */
  private getFID(): number | undefined {
    if ('PerformanceObserver' in window) {
      const entries = performance.getEntriesByType('first-input') as any[]
      return entries[0]?.processingStart - entries[0]?.startTime
    }
    return undefined
  }

  /**
   * 获取累积布局偏移 (CLS)
   */
  private getCLS(): number | undefined {
    if ('PerformanceObserver' in window) {
      let cls = 0
      const entries = performance.getEntriesByType('layout-shift')
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value
        }
      })
      return cls
    }
    return undefined
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      return
    }

    // 观察LCP
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as any[]
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime)
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (e) {
      console.warn('LCP观察器初始化失败:', e)
    }

    // 观察FID
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as any[]
        const firstEntry = entries[0]
        const fid = firstEntry.processingStart - firstEntry.startTime
        this.recordMetric('FID', fid)
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
    } catch (e) {
      console.warn('FID观察器初始化失败:', e)
    }

    // 观察CLS
    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        let cls = 0
        entryList.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value
          }
        })
        this.recordMetric('CLS', cls)
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch (e) {
      console.warn('CLS观察器初始化失败:', e)
    }
  }

  /**
   * 设置资源计时
   */
  private setupResourceTiming(): void {
    if ('performance' in window && performance.getEntriesByType) {
      // 记录已有的资源加载时间
      const resources = performance.getEntriesByType('resource')
      resources.forEach(resource => {
        this.recordMetric(
          `resource_${resource.name}`,
          resource.duration,
          'ms'
        )
      })

      // 观察新的资源加载
      if ('PerformanceObserver' in window) {
        const resourceObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            this.recordMetric(
              `resource_${entry.name}`,
              entry.duration,
              'ms'
            )
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
      }
    }
  }

  /**
   * 设置长任务观察器
   */
  private setupLongTaskObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            this.recordMetric('long_task', entry.duration, 'ms')
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        console.warn('长任务观察器初始化失败:', e)
      }
    }
  }

  /**
   * 报告性能指标
   */
  private reportMetric(metric: PerformanceMetric): void {
    // 这里可以发送到监控服务
    if (this.config.reportUrl) {
      // 实际项目中这里会发送到监控服务
      console.debug('Performance metric:', metric)
    }
  }

  /**
   * 开始计时
   */
  startTimer(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(`timer_${name}`, duration)
    }
  }

  /**
   * 测量函数执行时间
   */
  measure<T>(name: string, fn: () => T): T {
    const endTimer = this.startTimer(name)
    try {
      return fn()
    } finally {
      endTimer()
    }
  }

  /**
   * 获取性能报告
   */
  getReport(): {
    metrics: PerformanceMetric[]
    coreWebVitals: { fcp?: number; lcp?: number; fid?: number; cls?: number; ttfb?: number }
    summary: {
      totalMetrics: number
      averageLoadTime?: number
      maxLoadTime?: number
    }
  } {
    const loadTimes = this.metrics
      .filter(m => m.name.startsWith('resource_'))
      .map(m => m.value)

    return {
      metrics: this.metrics,
      coreWebVitals: this.getCoreWebVitals(),
      summary: {
        totalMetrics: this.metrics.length,
        averageLoadTime: loadTimes.length > 0 
          ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length 
          : undefined,
        maxLoadTime: loadTimes.length > 0 ? Math.max(...loadTimes) : undefined
      }
    }
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor({
  enabled: import.meta.env.MODE === 'development',
  sampleRate: 0.1 // 10%采样率
})

export default performanceMonitor

// 工具函数
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  return performanceMonitor.measure(name, fn)
}

export const startPerformanceTimer = (name: string) => {
  return performanceMonitor.startTimer(name)
}

export const getPerformanceReport = () => {
  return performanceMonitor.getReport()
}

export const recordPerformanceMetric = (name: string, value: number, unit?: string) => {
  performanceMonitor.recordMetric(name, value, unit)
}