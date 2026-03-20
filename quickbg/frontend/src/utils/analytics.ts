/**
 * 分析监控工具
 * 用于跟踪用户行为和业务指标
 */

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
}

interface AnalyticsConfig {
  enabled: boolean
  googleAnalyticsId?: string
  amplitudeApiKey?: string
  mixpanelToken?: string
  environment: 'development' | 'production' | 'staging'
  sampleRate: number
  debug: boolean
}

class Analytics {
  private config: AnalyticsConfig
  private sessionId: string
  private userId?: string
  private events: AnalyticsEvent[] = []

  constructor(config?: Partial<AnalyticsConfig>) {
    this.sessionId = this.generateSessionId()
    
    this.config = {
      enabled: true,
      environment: process.env.NODE_ENV as any || 'development',
      sampleRate: 1.0,
      debug: false,
      ...config
    }

    this.setupAutoTracking()
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return 'analytics_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 设置自动跟踪
   */
  private setupAutoTracking(): void {
    if (!this.config.enabled || typeof window === 'undefined') {
      return
    }

    // 跟踪页面访问
    this.trackPageView()

    // 跟踪用户互动
    this.setupInteractionTracking()

    // 跟踪性能指标
    this.setupPerformanceTracking()
  }

  /**
   * 跟踪页面访问
   */
  private trackPageView(): void {
    this.track('page_view', {
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title
    })

    // 监听路由变化（如果是SPA）
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState
      const originalReplaceState = history.replaceState

      history.pushState = function(...args) {
        originalPushState.apply(this, args)
        window.dispatchEvent(new Event('locationchange'))
      }

      history.replaceState = function(...args) {
        originalReplaceState.apply(this, args)
        window.dispatchEvent(new Event('locationchange'))
      }

      window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'))
      })

      window.addEventListener('locationchange', () => {
        this.track('page_view', {
          path: window.location.pathname,
          title: document.title
        })
      })
    }
  }

  /**
   * 设置交互跟踪
   */
  private setupInteractionTracking(): void {
    // 可以在这里添加自动交互跟踪
    // 例如：点击跟踪、表单提交跟踪等
  }

  /**
   * 设置性能跟踪
   */
  private setupPerformanceTracking(): void {
    if ('performance' in window) {
      // 跟踪核心Web指标
      this.trackPerformanceMetrics()
    }
  }

  /**
   * 跟踪性能指标
   */
  private trackPerformanceMetrics(): void {
    // 使用PerformanceObserver跟踪LCP、FID、CLS等
    if ('PerformanceObserver' in window) {
      try {
        // LCP
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.track('web_vital_lcp', {
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: this.getRating('lcp', lastEntry.renderTime || lastEntry.loadTime)
          })
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      } catch (e) {
        console.warn('LCP tracking failed:', e)
      }
    }
  }

  /**
   * 获取性能评分
   */
  private getRating(type: string, value: number): string {
    switch (type) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
      default:
        return 'unknown'
    }
  }

  /**
   * 跟踪事件
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) {
      return
    }

    // 采样率控制
    if (Math.random() > this.config.sampleRate) {
      return
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    }

    // 存储事件
    this.events.push(event)

    // 限制存储的事件数量
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }

    // 发送到分析服务
    this.sendToAnalyticsServices(event)

    // 调试输出
    if (this.config.debug) {
      console.group('Analytics Event')
      console.log('Event:', eventName)
      console.log('Properties:', properties)
      console.groupEnd()
    }
  }

  /**
   * 发送到分析服务
   */
  private sendToAnalyticsServices(event: AnalyticsEvent): void {
    // Google Analytics
    if (this.config.googleAnalyticsId && typeof gtag !== 'undefined') {
      gtag('event', event.name, event.properties)
    }

    // Amplitude
    if (this.config.amplitudeApiKey && typeof amplitude !== 'undefined') {
      amplitude.getInstance().logEvent(event.name, event.properties)
    }

    // Mixpanel
    if (this.config.mixpanelToken && typeof mixpanel !== 'undefined') {
      mixpanel.track(event.name, event.properties)
    }

    // 自定义端点
    this.sendToCustomEndpoint(event)
  }

  /**
   * 发送到自定义端点
   */
  private sendToCustomEndpoint(event: AnalyticsEvent): void {
    // 这里可以发送到自己的分析服务
    // 例如: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })
    
    if (this.config.debug) {
      console.debug('Analytics event sent to custom endpoint:', event)
    }
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId
    this.track('user_identified', { userId })
  }

  /**
   * 设置用户属性
   */
  setUserProperties(properties: Record<string, any>): void {
    this.track('user_properties', properties)
  }

  /**
   * 跟踪转化
   */
  trackConversion(value?: number, currency: string = 'USD'): void {
    this.track('conversion', { value, currency })
  }

  /**
   * 跟踪错误
   */
  trackError(error: Error | string, context?: Record<string, any>): void {
    this.track('error', {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    })
  }

  /**
   * 获取分析报告
   */
  getReport(): {
    totalEvents: number
    sessionId: string
    userId?: string
    recentEvents: AnalyticsEvent[]
  } {
    return {
      totalEvents: this.events.length,
      sessionId: this.sessionId,
      userId: this.userId,
      recentEvents: this.events.slice(-20)
    }
  }

  /**
   * 清除事件记录
   */
  clearEvents(): void {
    this.events = []
  }

  /**
   * 启用/禁用分析
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * 设置调试模式
   */
  setDebug(debug: boolean): void {
    this.config.debug = debug
  }
}

// 创建全局实例
const analytics = new Analytics({
  enabled: process.env.NODE_ENV === 'production' && import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  environment: process.env.NODE_ENV as any || 'development',
  sampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID
})

export default analytics

// 工具函数
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  analytics.track(eventName, properties)
}

export const trackPageView = (path?: string) => {
  analytics.track('page_view', { 
    path: path || window.location.pathname,
    title: document.title
  })
}

export const trackConversion = (value?: number, currency?: string) => {
  analytics.trackConversion(value, currency)
}

export const trackError = (error: Error | string, context?: Record<string, any>) => {
  analytics.trackError(error, context)
}

export const setUserId = (userId: string) => {
  analytics.setUserId(userId)
}

export const setUserProperties = (properties: Record<string, any>) => {
  analytics.setUserProperties(properties)
}

export const getAnalyticsReport = () => {
  return analytics.getReport()
}

// 预定义事件
export const Events = {
  // 用户交互
  UPLOAD_IMAGE: 'upload_image',
  REMOVE_BACKGROUND: 'remove_background',
  DOWNLOAD_RESULT: 'download_result',
  CLEAR_IMAGES: 'clear_images',
  
  // 设置
  CHANGE_SETTINGS: 'change_settings',
  CHANGE_THEME: 'change_theme',
  CHANGE_LANGUAGE: 'change_language',
  
  // 错误
  PROCESSING_ERROR: 'processing_error',
  UPLOAD_ERROR: 'upload_error',
  NETWORK_ERROR: 'network_error',
  
  // 性能
  PAGE_LOAD: 'page_load',
  IMAGE_PROCESSING_TIME: 'image_processing_time',
  
  // 业务
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  SUBSCRIPTION_START: 'subscription_start'
}