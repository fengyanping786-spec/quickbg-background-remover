import React, { useState, useEffect } from 'react'
import { Smartphone, SwipeUp, SwipeDown, X } from 'lucide-react'

const MobileHint: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
      
      // 如果是移动设备且之前没有关闭过提示，则显示
      if (mobile && !localStorage.getItem('quickbg-mobile-hint-closed')) {
        setShowHint(true)
      }
    }

    checkMobile()
    
    // 监听窗口大小变化
    const handleResize = () => {
      checkMobile()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleClose = () => {
    setShowHint(false)
    localStorage.setItem('quickbg-mobile-hint-closed', 'true')
  }

  if (!isMobile || !showHint) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm">移动端优化提示</h3>
              <p className="text-xs opacity-90">以下手势可提升使用体验</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="touch-target p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="关闭提示"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <SwipeUp className="w-4 h-4" />
              <span className="text-xs font-medium">上滑查看结果</span>
            </div>
            <p className="text-xs opacity-80">处理完成后，上滑查看下载区域</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <SwipeDown className="w-4 h-4" />
              <span className="text-xs font-medium">下拉刷新</span>
            </div>
            <p className="text-xs opacity-80">遇到问题时，下拉页面刷新</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-xs opacity-80">
            💡 提示：长按图片可保存到相册，双指缩放可查看细节
          </p>
        </div>
      </div>
    </div>
  )
}

export default MobileHint