import React from 'react'
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react'

interface LoadingProps {
  type?: 'default' | 'processing' | 'uploading'
  message?: string
  progress?: number
}

const Loading: React.FC<LoadingProps> = ({ 
  type = 'default', 
  message,
  progress 
}) => {
  const getConfig = () => {
    switch (type) {
      case 'processing':
        return {
          icon: <Sparkles className="w-8 h-8 text-purple-600" />,
          defaultMessage: '正在智能处理图片背景...',
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        }
      case 'uploading':
        return {
          icon: <ImageIcon className="w-8 h-8 text-blue-600" />,
          defaultMessage: '正在上传图片...',
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      default:
        return {
          icon: <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />,
          defaultMessage: '加载中...',
          color: 'from-gray-500 to-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const config = getConfig()
  const displayMessage = message || config.defaultMessage

  return (
    <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-8`}>
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        {/* 图标 */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              {type === 'processing' || type === 'uploading' ? (
                config.icon
              ) : (
                <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
              )}
            </div>
          </div>
          
          {/* 旋转装饰（仅处理中状态） */}
          {type === 'processing' && (
            <>
              <div className="absolute -top-2 -left-2 w-24 h-24 border-4 border-purple-200 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute -top-4 -left-4 w-28 h-28 border-4 border-pink-200 border-t-transparent rounded-full animate-spin animation-delay-300"></div>
            </>
          )}
        </div>

        {/* 消息 */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-800">{displayMessage}</h3>
          
          {type === 'processing' && (
            <p className="text-gray-600 max-w-md">
              AI正在分析图片内容，智能识别并去除背景...
            </p>
          )}

          {type === 'uploading' && (
            <p className="text-gray-600">
              请稍候，正在安全上传您的图片...
            </p>
          )}
        </div>

        {/* 进度条 */}
        {progress !== undefined && (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${config.color} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="space-y-2 text-sm text-gray-500">
          {type === 'processing' && (
            <>
              <p>✨ AI智能处理中，请勿关闭页面</p>
              <p>⏱️ 通常需要2-5秒，复杂图片可能需要更长时间</p>
            </>
          )}
          
          {type === 'uploading' && (
            <p>📁 上传速度取决于您的网络连接和图片大小</p>
          )}

          {!type && (
            <p>🔄 正在加载必要资源...</p>
          )}
        </div>

        {/* 动画点（仅处理中） */}
        {type === 'processing' && (
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color} animate-pulse`}
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 全屏加载组件
export const FullScreenLoading: React.FC<LoadingProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Loading {...props} />
      </div>
    </div>
  )
}

// 内联加载组件
export const InlineLoading: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size]

  return (
    <div className="inline-flex items-center justify-center">
      <Loader2 className={`${sizeClass} text-gray-600 animate-spin`} />
    </div>
  )
}

export default Loading