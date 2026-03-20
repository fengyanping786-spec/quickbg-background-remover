import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (isOnline) {
      window.location.reload()
    } else {
      // 尝试重新连接
      setIsOnline(navigator.onLine)
    }
  }

  if (!showAlert) return null

  return (
    <div className="fixed top-20 md:top-24 left-4 right-4 z-40 animate-slide-up">
      <div className={`rounded-xl shadow-lg p-4 ${
        isOnline 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
          : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isOnline ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
            </div>
            
            <div>
              <h3 className={`font-bold text-sm ${
                isOnline ? 'text-green-800' : 'text-red-800'
              }`}>
                {isOnline ? '网络已恢复' : '网络连接已断开'}
              </h3>
              <p className={`text-xs ${
                isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {isOnline 
                  ? '现在可以正常使用所有功能了' 
                  : '请检查网络连接，部分功能可能无法使用'
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleRetry}
            className={`touch-target px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
              isOnline 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            {isOnline ? '刷新页面' : '重试连接'}
          </button>
        </div>

        {!isOnline && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <ul className="space-y-1 text-xs text-red-600">
              <li>• 检查Wi-Fi或移动数据是否开启</li>
              <li>• 尝试切换网络连接</li>
              <li>• 确保没有启用飞行模式</li>
              <li>• 离线时仍可查看历史记录</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkStatus