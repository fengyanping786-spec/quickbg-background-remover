import React, { useState, useEffect } from 'react'
import { Upload, Image as ImageIcon, Download, Trash2, Loader2, Sparkles } from 'lucide-react'
import Uploader from './components/Uploader'
import Preview from './components/Preview'
import DownloadButton from './components/DownloadButton'
import Loading, { FullScreenLoading } from './components/Loading'
import Settings, { AppSettings } from './components/Settings'
import History, { addToHistory, HistoryItem } from './components/History'
import { ToastContainer, createToastHelpers } from './components/Toast'
import MobileHint from './components/MobileHint'
import NetworkStatus from './components/NetworkStatus'
import { PageSkeleton } from './components/Skeleton'
import { measurePerformance, recordPerformanceMetric } from './utils/performanceMonitor'
import { captureError } from './utils/errorMonitor'
import { trackEvent, Events } from './utils/analytics'

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('quickbg-settings')
    const defaultApiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8787'
    const appName = import.meta.env.VITE_APP_NAME || 'QuickBG'
    
    return saved ? JSON.parse(saved) : {
      processing: { format: 'png', quality: 100, removeShadow: true, enhanceEdges: false, autoCrop: false },
      ui: { theme: 'auto', language: 'zh', animationSpeed: 'normal', showTutorial: true },
      advanced: { 
        apiEndpoint: defaultApiEndpoint, 
        useMockApi: import.meta.env.DEV || false, 
        debugMode: false, 
        saveHistory: true 
      }
    }
  })
  const [toasts, setToasts] = useState<any[]>([])
  const [showTutorial, setShowTutorial] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化
  useEffect(() => {
    // 模拟加载延迟
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    // 检查是否显示教程
    const tutorialShown = localStorage.getItem('quickbg-tutorial-shown')
    if (tutorialShown === 'true' || !settings.ui.showTutorial) {
      setShowTutorial(false)
    }

    return () => clearTimeout(timer)
  }, [settings.ui.showTutorial])

  const toastHelpers = createToastHelpers((toast) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id }])
    
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, toast.duration)
    }
  })

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
      setProcessedImage(null)
      setError(null)
      setCurrentFile(file)
      
      toastHelpers.success('图片上传成功', `已上传: ${file.name}`)
      
      // 跟踪图片上传事件
      trackEvent(Events.UPLOAD_IMAGE, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        compressionEnabled: settings.advanced.useMockApi ? false : true
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveBackground = async () => {
    if (!originalImage || !currentFile) return

    setIsProcessing(true)
    setError(null)
    
    // 显示处理中通知
    const processingToastId = Date.now().toString()
    setToasts(prev => [...prev, {
      id: processingToastId,
      type: 'processing',
      title: '正在处理图片',
      message: 'AI正在智能分析并去除背景...',
      duration: 0
    }])

    // 记录性能指标
    recordPerformanceMetric('background_removal_start', Date.now())
    const startTime = Date.now()

    try {
      let result = await measurePerformance('background_removal_api', async () => {
        if (settings.advanced.useMockApi) {
          // 使用模拟API
          const api = await import('./api/client')
          return await api.mockRemoveBackground(currentFile, 2000)
        } else {
          // 使用真实API
          const api = await import('./api/client')
          return await api.removeBackground(currentFile)
        }
      })
      
      const processingTime = Date.now() - startTime
      
      // 记录处理时间
      recordPerformanceMetric('background_removal_time', processingTime)
      
      // 移除处理中通知
      setToasts(prev => prev.filter(t => t.id !== processingToastId))
      
      if (result.success) {
        setProcessedImage(result.data.imageUrl)
        
        // 添加到历史记录
        if (settings.advanced.saveHistory && currentFile) {
          addToHistory({
            timestamp: Date.now(),
            originalImage: originalImage,
            processedImage: result.data.imageUrl,
            fileName: currentFile.name,
            fileSize: (currentFile.size / (1024 * 1024)).toFixed(2) + ' MB',
            format: settings.processing.format,
            processingTime: processingTime
          })
        }
        
        toastHelpers.success('背景去除成功！', `处理时间: ${(processingTime / 1000).toFixed(1)}秒`, {
          action: {
            label: '查看结果',
            onClick: () => {
              // 滚动到结果区域
              document.querySelector('.download-section')?.scrollIntoView({ behavior: 'smooth' })
            }
          }
        })
        
        // 跟踪背景去除成功事件
        trackEvent(Events.REMOVE_BACKGROUND, {
          success: true,
          processingTime,
          fileSize: currentFile?.size,
          format: settings.processing.format,
          quality: settings.processing.quality
        })
        trackEvent(Events.IMAGE_PROCESSING_TIME, { value: processingTime })
      } else {
        setError(result.error)
        toastHelpers.error('处理失败', result.error)
        recordPerformanceMetric('background_removal_error', 1, 'count')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '背景去除失败，请重试'
      setError(errorMessage)
      toastHelpers.error('处理失败', errorMessage)
      console.error('Background removal failed:', err)
      recordPerformanceMetric('background_removal_exception', 1, 'count')
      
      // 记录错误到监控系统
      captureError(err, {
        type: 'background_removal',
        file: currentFile?.name,
        fileSize: currentFile?.size,
        settings: settings.processing
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setError(null)
    setCurrentFile(null)
    toastHelpers.info('已清除', '可以上传新的图片了')
  }

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setOriginalImage(item.originalImage)
    setProcessedImage(item.processedImage)
    setCurrentFile(null) // 历史记录没有原始文件对象
    setError(null)
    
    toastHelpers.info('已加载历史记录', `文件: ${item.fileName}`)
  }

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings)
    
    // 应用主题
    if (newSettings.ui.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newSettings.ui.theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // auto - 跟随系统
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('quickbg-tutorial-shown', 'true')
  }

  // 显示加载骨架屏
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <PageSkeleton />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Toast通知 */}
      <div className="fixed top-4 right-4 left-4 md:left-auto z-50 w-auto md:w-full max-w-sm">
        {toasts.map(toast => {
          const Toast = require('./components/Toast').default
          return <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        })}
      </div>

      {/* 教程弹窗 */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg md:rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">欢迎使用 QuickBG！</h2>
                    <p className="text-gray-500 text-sm md:text-base">快速上手指南</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseTutorial}
                  className="touch-target p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                {[
                  {
                    icon: '📁',
                    title: '上传图片',
                    description: '拖拽或点击上传PNG/JPG/WebP图片，最大10MB'
                  },
                  {
                    icon: '⚡',
                    title: '一键处理',
                    description: '点击"去除背景"，AI自动识别并去除图片背景'
                  },
                  {
                    icon: '💾',
                    title: '下载结果',
                    description: '下载透明背景PNG图片，支持多种格式和质量设置'
                  }
                ].map((step, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-5">
                    <div className="text-2xl md:text-3xl mb-2 md:mb-3">{step.icon}</div>
                    <h3 className="font-bold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">{step.title}</h3>
                    <p className="text-gray-600 text-xs md:text-sm">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg md:rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                <h3 className="font-bold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">✨ 特色功能</h3>
                <ul className="space-y-1 md:space-y-2 text-gray-600 text-xs md:text-sm">
                  <li>• <strong>智能AI处理</strong> - 自动识别主体，精准去除背景</li>
                  <li>• <strong>历史记录</strong> - 自动保存处理记录，方便查看和下载</li>
                  <li>• <strong>自定义设置</strong> - 支持格式、质量、主题等多种设置</li>
                  <li>• <strong>隐私保护</strong> - 图片处理在内存中进行，不存储任何数据</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!settings.ui.showTutorial}
                    onChange={(e) => {
                      const newSettings = { ...settings, ui: { ...settings.ui, showTutorial: !e.target.checked } }
                      setSettings(newSettings)
                      localStorage.setItem('quickbg-settings', JSON.stringify(newSettings))
                    }}
                    className="mr-2 h-4 w-4 text-purple-600 rounded"
                  />
                  <span className="text-xs md:text-sm text-gray-600">不再显示此教程</span>
                </label>
                
                <button
                  onClick={handleCloseTutorial}
                  className="touch-target px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg md:rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-colors active:scale-95 text-sm md:text-base"
                >
                  开始使用 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主界面 */}
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          {/* 头部 */}
          <header className="text-center mb-8 md:mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-3 md:mb-4">
              {import.meta.env.VITE_APP_NAME || 'QuickBG'}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">.ai</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-2xl mx-auto px-4">
              基于Cloudflare的无服务器图片背景去除工具，使用Remove.bg API，快速、简单、免费
              {import.meta.env.DEV && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                  开发版
                </span>
              )}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* 左侧：上传和处理区域 */}
            <div className="space-y-6 md:space-y-8">
              {/* 上传区域 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <Upload className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">上传图片</h2>
                </div>
                
                <Uploader onUpload={handleImageUpload} />
                
                <div className="mt-4 md:mt-6 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  <p>支持格式: PNG, JPG, JPEG, WebP</p>
                  <p>最大尺寸: 10MB</p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button
                    onClick={handleRemoveBackground}
                    disabled={!originalImage || isProcessing}
                    className="touch-target flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        <span className="text-sm md:text-base">处理中...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-sm md:text-base">一键去除背景</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClear}
                    disabled={!originalImage}
                    className="touch-target px-4 md:px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">清除</span>
                  </button>
                </div>

                {error && (
                  <div className="mt-3 md:mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* 下载区域 */}
              {processedImage && (
                <div className="download-section bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 animate-slide-up">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <Download className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">下载结果</h2>
                  </div>
                  <DownloadButton imageUrl={processedImage} />
                </div>
              )}
            </div>

            {/* 右侧：预览区域 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">图片预览</h2>
              </div>
              
              <Preview 
                originalImage={originalImage}
                processedImage={processedImage}
                isProcessing={isProcessing}
              />
            </div>
          </div>

          {/* 底部信息 */}
          <footer className="mt-8 md:mt-12 text-center text-gray-500 dark:text-gray-400 text-xs md:text-sm px-4">
            <p>© 2026 QuickBG.ai - 基于Cloudflare Workers和Remove.bg API构建</p>
            <p className="mt-1 md:mt-2">零存储成本 · 隐私保护 · 快速处理</p>
          </footer>
        </div>
      </div>

      {/* 浮动组件 */}
      <Settings onSettingsChange={handleSettingsChange} />
      <History onSelectItem={handleSelectHistoryItem} />
      
      {/* 移动端提示 */}
      <MobileHint />
      
      {/* 网络状态 */}
      <NetworkStatus />
    </>
  )
}

export default App