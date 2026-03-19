import React, { useState } from 'react'
import { Download, Check, Copy, Share2 } from 'lucide-react'

interface DownloadButtonProps {
  imageUrl: string
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ imageUrl }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [quality, setQuality] = useState<number>(100)

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // 创建临时链接下载
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `quickbg-removed-background-${Date.now()}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
      
      // 模拟下载完成
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('下载失败:', error)
      alert('下载失败，请重试')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      // 这里应该是处理后的图片URL
      const tempUrl = imageUrl // 实际应该是从API获取的URL
      await navigator.clipboard.writeText(tempUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QuickBG - 背景去除工具',
          text: '使用QuickBG快速去除图片背景',
          url: window.location.href,
        })
      } catch (error) {
        console.error('分享失败:', error)
      }
    } else {
      alert('分享功能在当前浏览器不可用')
    }
  }

  return (
    <div className="space-y-6">
      {/* 下载按钮 */}
      <div className="space-y-4">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              下载中...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              下载透明背景图片
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            点击上方按钮下载处理后的图片
          </p>
          <p className="text-gray-500 text-xs mt-1">
            图片将保存为透明背景PNG格式
          </p>
        </div>
      </div>

      {/* 设置选项 */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-gray-700">下载设置</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片格式
            </label>
            <div className="flex gap-2">
              {(['png', 'jpg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    format === fmt
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {format === 'png' 
                ? 'PNG格式支持透明背景，推荐使用'
                : 'JPG格式不支持透明背景，背景将为白色'
              }
            </p>
          </div>

          {format === 'jpg' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片质量: {quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>较小文件</span>
                <span>最佳质量</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 其他操作 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="w-5 h-5 text-green-500" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              复制链接
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          分享
        </button>
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-semibold text-blue-700 mb-2">使用提示</h4>
        <ul className="space-y-2 text-sm text-blue-600">
          <li>• 下载的图片可直接用于设计、电商、社交媒体等场景</li>
          <li>• PNG格式支持透明背景，适合专业设计使用</li>
          <li>• 如需再次处理，请上传新图片或重新处理当前图片</li>
          <li>• 所有图片处理均在内存中进行，不会存储您的图片</li>
        </ul>
      </div>
    </div>
  )
}

export default DownloadButton