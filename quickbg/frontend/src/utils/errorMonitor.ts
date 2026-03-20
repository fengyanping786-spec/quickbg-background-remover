/**
 * 错误监控工具
 * 用于捕获和报告前端错误
 */

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  url: string
  userAgent: string
  userId?: string
  sessionId: string
  extra?: Record<string, any>
}

interface ErrorMonitorConfig {
  enabled: boolean
  dsn?: string
  environment: 'development' | 'production' | 'staging'
  sampleRate: number
  maxErrorsPerMinute: number
  ignoreErrors: RegExp[]
}

class ErrorMonitor {
  private config: ErrorMonitorConfig
  private errorCount = 0
  private lastResetTime = Date.now()
  private sessionId: string

  constructor(config?: Partial<ErrorMonitorConfig>) {
    this.sessionId = this.generateSessionId()
    
    this.config = {
      enabled: true,
      environment: process.env.NODE_ENV as any || 'development',
      sampleRate: 1.0,
      maxErrorsPerMinute: 10,
      ignoreErrors: [
        /ResizeObserver loop limit exceeded/,
        /Script error\.?/,
        /^$/
      ],
      ...config
    }

    this.setupGlobalErrorHandlers()
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    if (!this.config.enabled || typeof window === 'undefined') {
      return
    }

    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack
      }, {
        type: 'unhandledrejection',
        reason: event.reason?.toString()
      })
    })

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      // 忽略资源加载错误
      if (event.target && (event.target as any).src) {
        return
      }

      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // 捕获console.error
    const originalConsoleError = console.error
    console.error = (...args) => {
      this.captureError({
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')
      }, {
        type: 'console.error',
        args: args
      })
      
      originalConsoleError.apply(console, args)
    }

    // 捕获console.warn
    const originalConsoleWarn = console.warn
    console.warn = (...args) => {
      this.captureError({
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        level: 'warning'
      }, {
        type: 'console.warn',
        args: args
      })
      
      originalConsoleWarn.apply(console, args)
    }
  }

  /**
   * 捕获错误
   */
  captureError(error: Error | string | any, extra?: Record<string, any>): void {
    if (!this.config.enabled) {
      return
    }

    // 检查错误频率限制
    this.checkRateLimit()

    // 解析错误信息
    const errorInfo = this.parseError(error, extra)

    // 检查是否忽略此错误
    if (this.shouldIgnoreError(errorInfo)) {
      return
    }

    // 采样率控制
    if (Math.random() > this.config.sampleRate) {
      return
    }

    // 记录错误
    this.recordError(errorInfo)

    // 发送到监控服务
    this.reportError(errorInfo)
  }

  /**
   * 解析错误信息
   */
  private parseError(error: Error | string | any, extra?: Record<string, any>): ErrorInfo {
    let message: string
    let stack: string | undefined

    if (error instanceof Error) {
      message = error.message
      stack = error.stack
    } else if (typeof error === 'string') {
      message = error
    } else if (error?.message) {
      message = error.message
      stack = error.stack
    } else {
      message = String(error)
    }

    return {
      message,
      stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      extra
    }
  }

  /**
   * 检查是否忽略错误
   */
  private shouldIgnoreError(errorInfo: ErrorInfo): boolean {
    return this.config.ignoreErrors.some(pattern => 
      pattern.test(errorInfo.message)
    )
  }

  /**
   * 检查频率限制
   */
  private checkRateLimit(): void {
    const now = Date.now()
    
    // 每分钟重置计数
    if (now - this.lastResetTime > 60000) {
      this.errorCount = 0
      this.lastResetTime = now
    }

    // 检查是否超过限制
    if (this.errorCount >= this.config.maxErrorsPerMinute) {
      console.warn('Error rate limit exceeded, skipping error reporting')
      return
    }

    this.errorCount++
  }

  /**
   * 记录错误到本地存储（用于调试）
   */
  private recordError(errorInfo: ErrorInfo): void {
    try {
      const errors = JSON.parse(localStorage.getItem('quickbg_errors') || '[]')
      errors.push(errorInfo)
      
      // 只保留最近的100个错误
      if (errors.length > 100) {
        errors.shift()
      }
      
      localStorage.setItem('quickbg_errors', JSON.stringify(errors))
    } catch (e) {
      console.warn('Failed to record error to localStorage:', e)
    }
  }

  /**
   * 报告错误到监控服务
   */
  private reportError(errorInfo: ErrorInfo): void {
    // 这里可以集成 Sentry、Bugsnag 等监控服务
    if (this.config.dsn) {
      this.sendToMonitoringService(errorInfo)
    } else {
      // 开发环境输出到控制台
      if (this.config.environment === 'development') {
        console.group('Error Monitor')
        console.error('Error:', errorInfo.message)
        console.error('Stack:', errorInfo.stack)
        console.error('Extra:', errorInfo.extra)
        console.groupEnd()
      }
    }
  }

  /**
   * 发送到监控服务
   */
  private sendToMonitoringService(errorInfo: ErrorInfo): void {
    // 实际项目中这里会发送到监控服务
    // 例如: fetch(this.config.dsn, { method: 'POST', body: JSON.stringify(errorInfo) })
    
    console.debug('Error reported to monitoring service:', errorInfo)
  }

  /**
   * 获取错误报告
   */
  getErrorReport(): {
    totalErrors: number
    recentErrors: ErrorInfo[]
    sessionId: string
    environment: string
  } {
    try {
      const errors = JSON.parse(localStorage.getItem('quickbg_errors') || '[]')
      return {
        totalErrors: errors.length,
        recentErrors: errors.slice(-10),
        sessionId: this.sessionId,
        environment: this.config.environment
      }
    } catch (e) {
      return {
        totalErrors: 0,
        recentErrors: [],
        sessionId: this.sessionId,
        environment: this.config.environment
      }
    }
  }

  /**
   * 清除错误记录
   */
  clearErrors(): void {
    localStorage.removeItem('quickbg_errors')
    this.errorCount = 0
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    // 可以用于关联用户和错误
    console.debug('ErrorMonitor: User ID set to', userId)
  }

  /**
   * 手动报告错误
   */
  manualReport(error: Error | string, extra?: Record<string, any>): void {
    this.captureError(error, { ...extra, manual: true })
  }
}

// 创建全局实例
const errorMonitor = new ErrorMonitor({
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV as any || 'development',
  sampleRate: 0.5, // 50%采样率
  maxErrorsPerMinute: 20
})

export default errorMonitor

// 工具函数
export const captureError = (error: Error | string, extra?: Record<string, any>) => {
  errorMonitor.captureError(error, extra)
}

export const manualReport = (error: Error | string, extra?: Record<string, any>) => {
  errorMonitor.manualReport(error, extra)
}

export const getErrorReport = () => {
  return errorMonitor.getErrorReport()
}

export const clearErrors = () => {
  errorMonitor.clearErrors()
}

export const setUserId = (userId: string) => {
  errorMonitor.setUserId(userId)
}