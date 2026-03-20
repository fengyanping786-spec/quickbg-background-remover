import React, { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, CheckCircle, Clock, ZoomIn, ZoomOut, Download, Maximize2, Grid } from 'lucide-react'
import { lazyLoadImage, Presets } from '../utils/imageCDN'

interface PreviewProps {
  originalImage: string | null
  processedImage: string | null
  isProcessing: boolean
}

const Preview: React.FC<PreviewProps> = ({ originalImage, processedImage, isProcessing }) => {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [loadedImages, setLoadedImages] = useState({
    original: false,
    processed: false
  })
  const [showGrid, setShowGrid] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const originalImageRef = useRef<HTMLImageElement>(null)
  const processedImageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 重置加载状态当图片改变时
  useEffect(() => {
    setLoadedImages({ original: false, processed: false })
    setZoomLevel(1)
  }, [originalImage, processedImage])

  // 处理图片下载
  const handleDownload = (type: 'original' | 'processed') => {
    const imageUrl = type === 'original' ? originalImage : processedImage
    if (!imageUrl) return

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `quickbg_${type}_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 全屏切换
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
      setFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setFullscreen(false)
    }
  }

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (!originalImage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">等待上传图片</h3>
        <p className="text-gray-500 max-w-md">
          上传图片后，这里将显示原图和去除背景后的效果对比
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* 处理状态指示器 */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl">
          <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="text-blue-700 font-medium">正在处理图片背景...</span>
        </div>
      )}

      {processedImage && !isProcessing && (
        <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-medium">背景去除完成！</span>
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">工具:</span>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            重置缩放
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 border rounded-lg text-sm flex items-center gap-1.5 ${
              showGrid 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-4 h-4" />
            网格 {showGrid ? '开' : '关'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Maximize2 className="w-4 h-4" />
            {fullscreen ? '退出全屏' : '全屏'}
          </button>
        </div>
      </div>

      {/* 图片对比区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 原图 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-700">原图</h3>
            </div>
            <button
              onClick={() => handleDownload('original')}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 flex items-center gap-1.5"
              disabled={!originalImage}
            >
              <Download className="w-4 h-4" />
              下载
            </button>
          </div>
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 group">
            <div className="relative w-full h-64 md:h-80 overflow-hidden">
              <img
                ref={originalImageRef}
                alt="原图"
                className={`w-full h-full object-contain transition-all duration-300 ${
                  loadedImages.original ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transform: `scale(${zoomLevel})` }}
                onLoad={() => setLoadedImages(prev => ({ ...prev, original: true }))}
                src={originalImage || undefined}
              />
              {!loadedImages.original && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
              原图
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            上传的原始图片
          </p>
        </div>

        {/* 处理后图片 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-700">
                {processedImage ? '处理后' : '处理后（预览）'}
              </h3>
            </div>
            {processedImage && (
              <button
                onClick={() => handleDownload('processed')}
                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                下载
              </button>
            )}
          </div>
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
            {processedImage ? (
              <>
                <div className="relative w-full h-64 md:h-80 overflow-hidden">
                  <img
                    ref={processedImageRef}
                    alt="处理后"
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      loadedImages.processed ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ transform: `scale(${zoomLevel})` }}
                    onLoad={() => setLoadedImages(prev => ({ ...prev, processed: true }))}
                    src={processedImage}
                  />
                  {!loadedImages.processed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                  透明背景
                </div>
                {/* 网格背景，用于显示透明区域 */}
                {showGrid && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                {isProcessing ? (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-blue-600 font-medium">处理中...</p>
                    <p className="text-blue-500 text-sm mt-1">AI正在智能分析图片</p>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-600 font-medium">点击"一键去除背景"</p>
                    <p className="text-gray-500 text-sm mt-1">查看处理后的透明背景图片</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 text-center">
            {processedImage 
              ? '透明背景PNG格式' 
              : '处理后将显示透明背景效果'
            }
          </p>
        </div>
      </div>

      {/* 缩放控制 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">缩放控制:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.25, prev - 0.25))}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg min-w-[80px] text-center">
              {Math.round(zoomLevel * 100)}%
            </div>
            <button
              onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.25))}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            重置
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>原图</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>处理后</span>
          </div>
          {showGrid && (
            <div className="flex items-center gap-1.5">
              <Grid className="w-4 h-4" />
              <span>网格背景</span>
            </div>
          )}
        </div>
      </div>

      {/* 对比说明 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-700 mb-3">效果说明</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-600">原图区域</h5>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                <span>显示上传的原始图片，包含所有背景元素</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                <span>支持缩放查看细节（25%-400%）</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                <span>点击下载按钮保存原图</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-600">处理后区域</h5>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>显示去除背景后的透明PNG图片</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>网格背景帮助识别透明区域</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>下载的图片为透明背景，可直接用于设计</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-600 mb-2">使用技巧</h5>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li>• 使用缩放功能查看图片细节</li>
            <li>• 开启/关闭网格背景以更好地查看透明区域</li>
            <li>• 使用全屏模式获得更好的查看体验</li>
            <li>• 处理复杂图片时，AI可能需要更多时间</li>
            <li>• 下载的PNG图片保持原始质量</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Preview