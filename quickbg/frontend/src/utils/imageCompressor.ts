/**
 * 图片压缩工具
 * 用于在客户端压缩图片，减少上传时间和带宽使用
 */

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的Blob对象
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    outputFormat = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // 计算新的尺寸
        let width = img.width
        let height = img.height
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        // 创建Canvas进行压缩
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'))
          return
        }
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          outputFormat,
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 获取图片信息
 * @param file 图片文件
 * @returns 图片尺寸和大小信息
 */
export async function getImageInfo(file: File): Promise<{
  width: number
  height: number
  size: number
  format: string
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          format: file.type
        })
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 判断是否需要压缩
 * @param file 图片文件
 * @param threshold 阈值（字节），默认2MB
 * @returns 是否需要压缩
 */
export function needsCompression(file: File, threshold: number = 2 * 1024 * 1024): boolean {
  return file.size > threshold
}

/**
 * 计算压缩后的预估大小
 * @param originalSize 原始大小（字节）
 * @param quality 压缩质量（0-1）
 * @param scale 缩放比例（0-1）
 * @returns 预估大小（字节）
 */
export function estimateCompressedSize(
  originalSize: number,
  quality: number = 0.8,
  scale: number = 1
): number {
  // 简单的估算公式：原始大小 × 质量 × 缩放比例的平方
  return Math.floor(originalSize * quality * Math.pow(scale, 2))
}

/**
 * 批量压缩图片
 * @param files 图片文件数组
 * @param options 压缩选项
 * @returns 压缩后的Blob数组
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<Blob[]> {
  const promises = files.map(file => compressImage(file, options))
  return Promise.all(promises)
}

/**
 * 创建压缩进度回调
 * @param onProgress 进度回调函数
 * @returns 带进度的压缩函数
 */
export function createCompressorWithProgress(
  onProgress?: (progress: number) => void
) {
  return async (file: File, options: CompressionOptions = {}): Promise<Blob> => {
    if (onProgress) onProgress(10) // 开始
    
    const blob = await compressImage(file, options)
    
    if (onProgress) onProgress(100) // 完成
    
    return blob
  }
}

export default {
  compressImage,
  getImageInfo,
  needsCompression,
  estimateCompressedSize,
  compressImages,
  createCompressorWithProgress
}