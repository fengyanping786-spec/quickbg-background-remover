// QuickBG Service Worker
// 提供离线支持和缓存功能

const CACHE_NAME = 'quickbg-v1.0.0'
const STATIC_CACHE_NAME = 'quickbg-static-v1.0.0'

// 需要缓存的资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
]

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[Service Worker] Install completed')
        return self.skipWaiting()
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除旧版本的缓存
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
    .then(() => {
      console.log('[Service Worker] Activation completed')
      return self.clients.claim()
    })
  )
})

// 获取事件 - 缓存策略
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  
  // 跳过非HTTP请求和非GET请求
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
    return
  }
  
  // 跳过Chrome扩展
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // 跳过浏览器开发者工具
  if (url.hostname === 'localhost' && url.port === '3000') {
    return
  }
  
  // API请求 - 网络优先，失败时使用缓存
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 克隆响应以进行缓存
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        })
        .catch(() => {
          // 网络失败时尝试从缓存获取
          return caches.match(event.request)
        })
    )
    return
  }
  
  // 静态资源 - 缓存优先，网络回退
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.ttf') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // 返回缓存响应，同时更新缓存
            fetchAndCache(event.request)
            return cachedResponse
          }
          
          // 没有缓存，从网络获取
          return fetchAndCache(event.request)
        })
    )
    return
  }
  
  // HTML页面 - 网络优先，缓存回退
  if (event.request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 克隆响应以进行缓存
          const responseToCache = response.clone()
          
          caches.open(STATIC_CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        })
        .catch(() => {
          // 网络失败时返回缓存的HTML
          return caches.match(event.request)
        })
    )
    return
  }
  
  // 默认策略 - 网络优先
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  )
})

// 辅助函数：获取并缓存
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      // 检查响应是否有效
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response
      }
      
      // 克隆响应以进行缓存
      const responseToCache = response.clone()
      
      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache)
        })
      
      return response
    })
}

// 后台同步事件
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag)
  
  if (event.tag === 'sync-images') {
    event.waitUntil(syncImages())
  }
})

// 推送事件
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received:', event)
  
  const options = {
    body: event.data?.text() || 'QuickBG 有新消息',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'quickbg-notification'
    },
    actions: [
      {
        action: 'open',
        title: '打开应用'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('QuickBG', options)
  )
})

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event.notification.tag)
  
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// 后台同步图片
async function syncImages() {
  try {
    // 这里可以实现离线图片的同步
    console.log('[Service Worker] Syncing images...')
    
    // 示例：从IndexedDB获取待同步的图片
    const db = await openDB()
    const pendingImages = await db.getAll('pendingImages')
    
    for (const image of pendingImages) {
      try {
        // 尝试上传图片
        const formData = new FormData()
        formData.append('image', image.blob, image.filename)
        
        const response = await fetch('/api/remove-bg', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          // 上传成功，从待同步列表中移除
          await db.delete('pendingImages', image.id)
          console.log('[Service Worker] Image synced:', image.filename)
        }
      } catch (error) {
        console.error('[Service Worker] Sync failed:', error)
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync error:', error)
  }
}

// 打开IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QuickBG', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = event => {
      const db = event.target.result
      
      // 创建对象存储
      if (!db.objectStoreNames.contains('pendingImages')) {
        const store = db.createObjectStore('pendingImages', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      }
      
      if (!db.objectStoreNames.contains('processedImages')) {
        const store = db.createObjectStore('processedImages', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      }
    }
  })
}

// 消息事件
self.addEventListener('message', event => {
  console.log('[Service Worker] Message received:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    })
  }
})