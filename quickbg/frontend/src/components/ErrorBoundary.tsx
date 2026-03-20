import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // 可以在这里将错误发送到错误监控服务
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    // 刷新页面
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 如果有自定义的fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <div className="text-center space-y-6">
                {/* 错误图标 */}
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    !
                  </div>
                </div>

                {/* 错误信息 */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    哎呀，出错了！
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    应用程序遇到了意外错误。我们的技术团队已收到通知。
                  </p>
                  
                  {this.state.error && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        错误详情：
                      </p>
                      <code className="text-xs text-red-600 dark:text-red-400 break-all">
                        {this.state.error.toString()}
                      </code>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReset}
                    className="touch-target flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    重试
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="touch-target px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    返回首页
                  </button>
                </div>

                {/* 提示信息 */}
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>如果问题持续存在，请尝试：</p>
                  <ul className="space-y-1 text-left">
                    <li>• 清除浏览器缓存和Cookie</li>
                    <li>• 检查网络连接</li>
                    <li>• 使用其他浏览器</li>
                    <li>• 联系技术支持</li>
                  </ul>
                </div>

                {/* 技术支持信息 */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">
                    错误ID: {Date.now().toString(36).toUpperCase()}
                    <br />
                    时间: {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 简化的错误边界组件（函数式）
export const SimpleErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">组件加载时出现错误</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            刷新页面
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary