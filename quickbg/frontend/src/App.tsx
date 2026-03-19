import React, { useState } from 'react'
import { Upload, Image as ImageIcon, Download, Trash2, Loader2 } from 'lucide-react'
import Uploader from './components/Uploader'
import Preview from './components/Preview'
import DownloadButton from './components/DownloadButton'

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
      setProcessedImage(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveBackground = async () => {
    if (!originalImage) return

    setIsProcessing(true)
    setError(null)

    try {
      // 获取上传的文件（这里需要从状态中获取文件对象）
      // 在实际应用中，应该保存文件对象
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (!fileInput?.files?.[0]) {
        throw new Error('未找到图片文件')
      }

      const file = fileInput.files[0]
      
      // 使用模拟API（开发阶段）
      const api = await import('./api/client')
      const result = await api.mockRemoveBackground(file, 1500)
      
      if (result.success) {
        setProcessedImage(result.data.imageUrl)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '背景去除失败，请重试')
      console.error('Background removal failed:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            QuickBG
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">.ai</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            基于Cloudflare的无服务器图片背景去除工具，使用Remove.bg API，快速、简单、免费
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：上传和处理区域 */}
          <div className="space-y-8">
            {/* 上传区域 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Upload className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">上传图片</h2>
              </div>
              
              <Uploader onUpload={handleImageUpload} />
              
              <div className="mt-6 text-sm text-gray-500">
                <p>支持格式: PNG, JPG, JPEG, WebP</p>
                <p>最大尺寸: 10MB</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleRemoveBackground}
                  disabled={!originalImage || isProcessing}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      一键去除背景
                    </>
                  )}
                </button>

                <button
                  onClick={handleClear}
                  disabled={!originalImage}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  清除
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {/* 下载区域 */}
            {processedImage && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Download className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">下载结果</h2>
                </div>
                <DownloadButton imageUrl={processedImage} />
              </div>
            )}
          </div>

          {/* 右侧：预览区域 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">图片预览</h2>
            </div>
            
            <Preview 
              originalImage={originalImage}
              processedImage={processedImage}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* 底部信息 */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2026 QuickBG.ai - 基于Cloudflare Workers和Remove.bg API构建</p>
          <p className="mt-2">零存储成本 · 隐私保护 · 快速处理</p>
        </footer>
      </div>
    </div>
  )
}

export default App