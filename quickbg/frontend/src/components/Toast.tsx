import React, { useState, useEffect, createContext, useContext } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Bell,
  Sparkles
} from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'processing'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: ToastMessage
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false)

  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-500',
          progressColor: 'bg-green-500'
        }
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          progressColor: 'bg-red-500'
        }
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500',
          progressColor: 'bg-yellow-500'
        }
      case 'processing':
        return {
          icon: <Sparkles className="w-5 h-5 animate-pulse" />,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          iconColor: 'text-purple-500',
          progressColor: 'bg-purple-500'
        }
      default: // info
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500',
          progressColor: 'bg-blue-500'
        }
    }
  }

  const config = getConfig()
  const duration = toast.duration || 5000

  useEffect(() => {
    if (toast.type !== 'processing') {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => onRemove(toast.id), 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.type, duration, onRemove])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  return (
    <div
      className={`
        relative w-full max-w-md mb-3 transform transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className={`
        ${config.bgColor} ${config.borderColor} border-2 rounded-xl shadow-lg
        overflow-hidden backdrop-blur-sm
      `}>
        {/* 进度条 */}
        {toast.type !== 'processing' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className={`h-full ${config.progressColor} transition-all duration-${duration}`}
              style={{ 
                width: isExiting ? '100%' : '0%',
                transition: `width ${duration}ms linear`
              }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start">
            {/* 图标 */}
            <div className={`flex-shrink-0 ${config.iconColor} mr-3 mt-0.5`}>
              {config.icon}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`font-semibold ${config.textColor}`}>
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRemove}
                  className={`ml-4 flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
                  aria-label="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 操作按钮 */}
              {toast.action && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      toast.action?.onClick()
                      handleRemove()
                    }}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                      ${toast.type === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                      ${toast.type === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                      ${toast.type === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''}
                      ${toast.type === 'info' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                      ${toast.type === 'processing' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : ''}
                    `}
                  >
                    {toast.action.label}
                  </button>
                </div>
              )}

              {/* 处理中状态的特殊显示 */}
              {toast.type === 'processing' && (
                <div className="mt-3 flex items-center space-x-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse w-1/2"></div>
                  </div>
                  <span className="text-xs text-purple-600 font-medium">处理中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast上下文
interface ToastContextType {
  showToast: (message: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast容器组件
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {/* Toast容器 */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Hook使用Toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast必须在ToastProvider内使用')
  }
  return context
}

// 快捷方法
export const createToastHelpers = (showToast: (msg: Omit<ToastMessage, 'id'>) => void) => ({
  success: (title: string, message?: string, options?: Partial<ToastMessage>) => {
    showToast({
      type: 'success',
      title,
      message,
      duration: 3000,
      ...options
    })
  },
  
  error: (title: string, message?: string, options?: Partial<ToastMessage>) => {
    showToast({
      type: 'error',
      title,
      message,
      duration: 5000,
      ...options
    })
  },
  
  warning: (title: string, message?: string, options?: Partial<ToastMessage>) => {
    showToast({
      type: 'warning',
      title,
      message,
      duration: 4000,
      ...options
    })
  },
  
  info: (title: string, message?: string, options?: Partial<ToastMessage>) => {
    showToast({
      type: 'info',
      title,
      message,
      duration: 3000,
      ...options
    })
  },
  
  processing: (title: string, message?: string, options?: Partial<ToastMessage>) => {
    showToast({
      type: 'processing',
      title,
      message,
      duration: 0, // 处理中通知不会自动关闭
      ...options
    })
  }
})

export default Toast