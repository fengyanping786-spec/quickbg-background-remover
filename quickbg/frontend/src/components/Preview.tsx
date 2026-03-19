import React from 'react'
import { Image as ImageIcon, CheckCircle, Clock } from 'lucide-react'

interface PreviewProps {
  originalImage: string | null
  processedImage: string | null
  isProcessing: boolean
}

const Preview: React.FC<PreviewProps> = ({ originalImage, processedImage, isProcessing }) => {
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
    <div className="space-y-6">
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

      {/* 图片对比区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 原图 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-700">原图</h3>
          </div>
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
            <img
              src={originalImage}
              alt="原图"
              className="w-full h-64 object-contain"
            />
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-700">
              {processedImage ? '处理后' : '处理后（预览）'}
            </h3>
          </div>
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
            {processedImage ? (
              <>
                <img
                  src={processedImage}
                  alt="处理后"
                  className="w-full h-64 object-contain"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                  透明背景
                </div>
                {/* 网格背景，用于显示透明区域 */}
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
              </>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                {isProcessing ? (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-blue-600 font-medium">处理中...</p>
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

      {/* 对比说明 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-700 mb-2">效果说明</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
            <span><strong>左侧</strong>：原始图片，包含原始背景</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
            <span><strong>右侧</strong>：处理后图片，背景已去除，显示为透明PNG格式</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
            <span>网格背景用于显示透明区域，实际下载的图片为透明背景PNG</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Preview