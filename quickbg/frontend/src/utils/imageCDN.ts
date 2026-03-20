/**
 * 图片CDN工具
 * 用于优化图片加载和缓存
 */

interface ImageCDNOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  position?: 'center' | 'top' | 'right' | 'bottom' | 'left'
  background?: string
  blur?: number
  sharpen?: number
  grayscale?: boolean
  rotate?: number
  flip?: boolean
  flop?: boolean
}

class ImageCDN {
  private cdnUrl: string
  private defaultOptions: ImageCDNOptions

  constructor(cdnUrl?: string, defaultOptions?: ImageCDNOptions) {
    this.cdnUrl = cdnUrl || 'https://images.quickbg.ai'
    this.defaultOptions = {
      width: 800,
      quality: 80,
      format: 'auto',
      fit: 'cover',
      position: 'center',
      ...defaultOptions
    }
  }

  /**
   * 生成CDN URL
   */
  generateUrl(imageUrl: string, options?: ImageCDNOptions): string {
    if (!this.isExternalUrl(imageUrl)) {
      return imageUrl
    }

    const mergedOptions = { ...this.defaultOptions, ...options }
    const params = this.buildParams(mergedOptions)
    
    // 编码原始URL
    const encodedUrl = encodeURIComponent(imageUrl)
    
    return `${this.cdnUrl}/${params}/${encodedUrl}`
  }

  /**
   * 检查是否为外部URL
   */
  private isExternalUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://')
  }

  /**
   * 构建参数字符串
   */
  private buildParams(options: ImageCDNOptions): string {
    const params: string[] = []

    if (options.width) params.push(`w_${options.width}`)
    if (options.height) params.push(`h_${options.height}`)
    if (options.quality) params.push(`q_${options.quality}`)
    if (options.format && options.format !== 'auto') params.push(`f_${options.format}`)
    if (options.fit) params.push(`fit_${options.fit}`)
    if (options.position) params.push(`pos_${options.position}`)
    if (options.background) params.push(`bg_${options.background.replace('#', '')}`)
    if (options.blur) params.push(`blur_${options.blur}`)
    if (options.sharpen) params.push(`sharpen_${options.sharpen}`)
    if (options.grayscale) params.push('grayscale')
    if (options.rotate) params.push(`rotate_${options.rotate}`)
    if (options.flip) params.push('flip')
    if (options.flop) params.push('flop')

    return params.join(',')
  }

  /**
   * 预加载图片
   */
  preloadImage(url: string, options?: ImageCDNOptions): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const cdnUrl = this.generateUrl(url, options)

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${cdnUrl}`))
      
      img.src = cdnUrl
    })
  }

  /**
   * 批量预加载图片
   */
  async preloadImages(urls: string[], options?: ImageCDNOptions): Promise<HTMLImageElement[]> {
    const promises = urls.map(url => this.preloadImage(url, options))
    return Promise.all(promises)
  }

  /**
   * 获取图片信息
   */
  getImageInfo(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to get image info: ${url}`))
      }
      
      img.src = url
    })
  }

  /**
   * 响应式图片源集
   */
  generateSrcSet(url: string, breakpoints: number[], options?: ImageCDNOptions): string {
    return breakpoints
      .map(width => {
        const imageUrl = this.generateUrl(url, { ...options, width })
        return `${imageUrl} ${width}w`
      })
      .join(', ')
  }

  /**
   * 懒加载图片
   */
  lazyLoadImage(
    element: HTMLImageElement,
    url: string,
    options?: ImageCDNOptions,
    placeholder?: string
  ): void {
    // 设置占位符
    if (placeholder) {
      element.src = placeholder
    }

    // 创建Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 加载实际图片
          const cdnUrl = this.generateUrl(url, options)
          element.src = cdnUrl
          
          // 图片加载完成后移除观察
          element.onload = () => {
            observer.unobserve(element)
          }
        }
      })
    }, {
      rootMargin: '50px',
      threshold: 0.1
    })

    observer.observe(element)
  }

  /**
   * 渐进式图片加载
   */
  progressiveLoad(
    element: HTMLImageElement,
    url: string,
    options?: ImageCDNOptions
  ): void {
    // 先加载低质量图片
    const lowQualityUrl = this.generateUrl(url, { ...options, quality: 20, blur: 10 })
    element.src = lowQualityUrl

    // 然后加载高质量图片
    const highQualityUrl = this.generateUrl(url, options)
    const highQualityImg = new Image()
    
    highQualityImg.onload = () => {
      element.src = highQualityUrl
      element.classList.add('loaded')
    }
    
    highQualityImg.src = highQualityUrl
  }

  /**
   * 图片缓存管理
   */
  async cacheImage(url: string, options?: ImageCDNOptions): Promise<string> {
    const cdnUrl = this.generateUrl(url, options)
    
    try {
      // 检查是否支持Cache API
      if ('caches' in window) {
        const cache = await caches.open('quickbg-images')
        const cachedResponse = await cache.match(cdnUrl)
        
        if (cachedResponse) {
          return URL.createObjectURL(await cachedResponse.blob())
        }
        
        // 缓存图片
        const response = await fetch(cdnUrl)
        await cache.put(cdnUrl, response.clone())
        
        return URL.createObjectURL(await response.blob())
      }
      
      return cdnUrl
    } catch (error) {
      console.warn('Image caching failed:', error)
      return cdnUrl
    }
  }

  /**
   * 清除图片缓存
   */
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      const imageCaches = cacheNames.filter(name => name.includes('quickbg-images'))
      
      await Promise.all(
        imageCaches.map(name => caches.delete(name))
      )
    }
  }

  /**
   * 获取缓存状态
   */
  async getCacheStatus(): Promise<{
    total: number
    size: number
    images: string[]
  }> {
    if (!('caches' in window)) {
      return { total: 0, size: 0, images: [] }
    }

    const cache = await caches.open('quickbg-images')
    const keys = await cache.keys()
    
    let totalSize = 0
    const images: string[] = []

    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
        images.push(request.url)
      }
    }

    return {
      total: keys.length,
      size: totalSize,
      images
    }
  }

  /**
   * 图片压缩（客户端）
   */
  async compressImage(
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: 'image/jpeg' | 'image/png' | 'image/webp'
    } = {}
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          // 计算新尺寸
          let width = img.width
          let height = img.height
          
          const maxWidth = options.maxWidth || 1920
          const maxHeight = options.maxHeight || 1080
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }
          
          // 创建Canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to create canvas context'))
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
                reject(new Error('Image compression failed'))
              }
            },
            options.format || file.type,
            options.quality || 0.8
          )
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
        
        img.src = e.target?.result as string
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }
}

// 创建全局实例
const imageCDN = new ImageCDN('https://images.quickbg.ai', {
  width: 800,
  quality: 80,
  format: 'auto',
  fit: 'cover'
})

export default imageCDN

// 工具函数
export const getOptimizedImageUrl = (url: string, options?: ImageCDNOptions) => {
  return imageCDN.generateUrl(url, options)
}

export const preloadImage = (url: string, options?: ImageCDNOptions) => {
  return imageCDN.preloadImage(url, options)
}

export const lazyLoadImage = (
  element: HTMLImageElement,
  url: string,
  options?: ImageCDNOptions,
  placeholder?: string
) => {
  imageCDN.lazyLoadImage(element, url, options, placeholder)
}

export const compressImage = (file: File, options?: any) => {
  return imageCDN.compressImage(file, options)
}

export const clearImageCache = () => {
  return imageCDN.clearCache()
}

// 预定义配置
export const Presets = {
  THUMBNAIL: { width: 150, height: 150, quality: 60 },
  PREVIEW: { width: 400, height: 300, quality: 75 },
  DISPLAY: { width: 800, height: 600, quality: 85 },
  ORIGINAL: { quality: 100 },
  WEB_OPTIMIZED: { width: 1200, quality: 80, format: 'webp' },
  MOBILE_OPTIMIZED: { width: 375, quality: 75, format: 'webp' }
}