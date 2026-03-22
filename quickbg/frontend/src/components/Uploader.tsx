import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, X, Minimize2 as Compress, Zap } from 'lucide-react'
import { compressImage, needsCompression, getImageInfo } from '../utils/imageCompressor'

interface UploaderProps {
  onUpload: (file: File) => void
}

const Uploader: React.FC<UploaderProps> = ({ onUpload }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState<string | null>(null)
  const [isShrinking, setIsShrinking] = useState(false)
  const [compressionEnabled, setShrinkionEnabled] = useState(true)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // 验证文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('请上传PNG、JPG或WebP格式的图片')
      return
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('图片大小不能超过10MB')
      return
    }

    try {
      let finalFile = file
      setOriginalSize((file.size / (1024 * 1024)).toFixed(2) + ' MB')

      // 如果需要压缩且启用了压缩
      if (compressionEnabled && needsCompression(file, 1 * 1024 * 1024)) { // 1MB以上压缩
        setIsShrinking(true)
        
        try {
          // 压缩图片
          const compressedBlob = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            outputFormat: file.type as any
          })
          
          // 创建新的File对象
          finalFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          
          // 显示压缩信息
          const compressedSize = (compressedBlob.size / (1024 * 1024)).toFixed(2)
          const savedPercent = ((1 - compressedBlob.size / file.size) * 100).toFixed(1)
          setFileSize(`${compressedSize} MB (节省${savedPercent}%)`)
        } catch (compressError) {
          console.warn('图片压缩失败，使用原图:', compressError)
          setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB')
        } finally {
          setIsShrinking(false)
        }
      } else {
        setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB')
      }

      // 设置预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(finalFile)

      // 设置文件信息
      setFileName(file.name)

      // 调用父组件处理
      onUpload(finalFile)
    } catch (error) {
      console.error('文件处理失败:', error)
      alert('文件处理失败，请重试')
    }
  }, [onUpload, compressionEnabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleClear = () => {
    setPreview(null)
    setFileName(null)
    setFileSize(null)
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`touch-target border-2 border-dashed rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 text-center cursor-pointer transition-all duration-200 active:scale-95 ${
            isDragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
            
            <div>
              <p className="text-base md:text-lg font-semibold text-gray-700 mb-1 md:mb-2">
                {isDragActive ? '松开上传图片' : '拖拽或点击上传'}
              </p>
              <p className="text-gray-500 text-sm md:text-base">支持PNG、JPG、WebP格式</p>
            </div>
            
            <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
              <span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs md:text-sm">
                PNG
              </span>
              <span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs md:text-sm">
                JPG
              </span>
              <span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs md:text-sm">
                JPEG
              </span>
              <span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs md:text-sm">
                WebP
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in">
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${
                isShrinking 
                  ? 'bg-gradient-to-br from-yellow-100 to-orange-100' 
                  : 'bg-gradient-to-br from-green-100 to-blue-100'
              }`}>
                {isShrinking ? (
                  <Compress className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 animate-pulse" />
                ) : (
                  <FileImage className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                )}
              </div>
              <div className="max-w-[70%]">
                <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{fileName}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs md:text-sm text-gray-500">{fileSize}</p>
                  {originalSize && fileSize && originalSize !== fileSize && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      <Zap className="w-3 h-3 inline mr-1" />
                      已压缩
                    </span>
                  )}
                  {isShrinking && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs animate-pulse">
                      压缩中...
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 压缩开关 */}
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compressionEnabled}
                    onChange={(e) => setShrinkionEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  <span className="ml-2 text-xs text-gray-600 hidden md:inline">压缩</span>
                </label>
              </div>
              
              <button
                onClick={handleClear}
                className="touch-target p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                title="清除"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="rounded-lg md:rounded-xl overflow-hidden border border-gray-200">
            <img
              src={preview}
              alt="预览"
              className="w-full h-32 md:h-48 object-cover"
              loading="lazy"
            />
          </div>
          
          <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500 text-center">
            图片已上传，点击"一键去除背景"开始处理
          </p>
        </div>
      )}

      {/* URL上传输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔗</span>
        </div>
        <input
          type="text"
          placeholder="或输入图片URL地址"
          className="touch-target w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const url = (e.target as HTMLInputElement).value
              if (url) {
                // 这里可以添加URL图片加载逻辑
                alert('URL上传功能开发中...')
              }
            }
          }}
        />
      </div>
    </div>
  )
}

export default Uploader