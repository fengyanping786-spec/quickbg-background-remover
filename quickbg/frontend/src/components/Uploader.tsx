import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, X } from 'lucide-react'

interface UploaderProps {
  onUpload: (file: File) => void
}

const Uploader: React.FC<UploaderProps> = ({ onUpload }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
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

    // 设置预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 设置文件信息
    setFileName(file.name)
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB')

    // 调用父组件处理
    onUpload(file)
  }, [onUpload])

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
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            
            <div>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {isDragActive ? '松开鼠标上传图片' : '拖拽图片到这里'}
              </p>
              <p className="text-gray-500">或点击选择文件</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                PNG
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                JPG
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                JPEG
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                WebP
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                <FileImage className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{fileName}</p>
                <p className="text-sm text-gray-500">{fileSize}</p>
              </div>
            </div>
            
            <button
              onClick={handleClear}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="清除"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <img
              src={preview}
              alt="预览"
              className="w-full h-48 object-cover"
            />
          </div>
          
          <p className="mt-4 text-sm text-gray-500 text-center">
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
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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