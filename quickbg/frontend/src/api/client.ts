/**
 * QuickBG API客户端
 * 用于与Cloudflare Worker通信
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export interface ApiError {
  success: false
  error: string
  timestamp: string
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  timestamp: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

/**
 * 检查API健康状态
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) return false
    
    const data = await response.json()
    return data.status === 'ok'
  } catch (error) {
    console.error('健康检查失败:', error)
    return false
  }
}

/**
 * 上传图片并去除背景
 */
export async function removeBackground(
  imageFile: File
): Promise<ApiResponse<{ imageUrl: string }>> {
  try {
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await fetch(`${API_BASE_URL}/remove-bg`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      // 尝试解析错误信息
      try {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || `请求失败: ${response.status}`,
          timestamp: new Date().toISOString(),
        }
      } catch {
        return {
          success: false,
          error: `请求失败: ${response.status} ${response.statusText}`,
          timestamp: new Date().toISOString(),
        }
      }
    }

    // 将返回的图片转换为Data URL
    const imageBlob = await response.blob()
    const imageUrl = URL.createObjectURL(imageBlob)

    return {
      success: true,
      data: { imageUrl },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('背景去除失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * 模拟去除背景（用于开发测试）
 */
export async function mockRemoveBackground(
  imageFile: File,
  delay: number = 2000
): Promise<ApiResponse<{ imageUrl: string }>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 创建模拟的透明背景图片
      const reader = new FileReader()
      reader.onload = (e) => {
        const originalUrl = e.target?.result as string
        
        // 在实际应用中，这里应该返回处理后的图片
        // 现在先返回原图作为模拟
        resolve({
          success: true,
          data: { imageUrl: originalUrl },
          timestamp: new Date().toISOString(),
        })
      }
      reader.readAsDataURL(imageFile)
    }, delay)
  })
}

/**
 * 下载图片
 */
export function downloadImage(imageUrl: string, filename: string = 'background-removed.png') {
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 复制图片链接到剪贴板
 */
export async function copyImageUrl(imageUrl: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(imageUrl)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    
    // 备用方法：使用textarea
    const textArea = document.createElement('textarea')
    textArea.value = imageUrl
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的图片格式。请上传PNG、JPG或WebP格式的图片。',
    }
  }

  // 检查文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '图片大小不能超过10MB。',
    }
  }

  return { valid: true }
}

/**
 * 获取文件信息
 */
export function getFileInfo(file: File): {
  name: string
  size: string
  type: string
} {
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
  
  return {
    name: file.name,
    size: `${sizeInMB} MB`,
    type: file.type.split('/')[1].toUpperCase(),
  }
}

export default {
  checkHealth,
  removeBackground,
  mockRemoveBackground,
  downloadImage,
  copyImageUrl,
  validateImageFile,
  getFileInfo,
}