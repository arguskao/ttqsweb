// Service Worker for Pharmacy Assistant Academy PWA
const CACHE_NAME = 'pharmacy-academy-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  // 不快取 index.html，避免部署後載入舊版入口導致 chunk 名稱不匹配
  '/favicon.ico',
  '/icon-192.svg',
  '/icon-512.svg'
]

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API requests
  if (request.url.includes('/api/')) {
    return
  }

  // 對 HTML 與模組腳本採用 network-first，避免回舊版或回到 HTML
  if (request.destination === 'document' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 成功則回應並更新快取（只快取非 HTML 檔案）
          const clone = response.clone()
          if (request.destination !== 'document' && response.status === 200 && response.type === 'basic') {
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          // 失敗時，文件回離線頁；其餘從快取取用
          if (request.destination === 'document') {
            const cachedIndex = await caches.match('/') || await caches.match('/index.html')
            return cachedIndex || new Response('Offline', { status: 503 })
          }
          const cached = await caches.match(request)
          return cached || new Response('', { status: 504 })
        })
    )
    return
  }

  // 其他資源採用 cache-first
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse
      return fetch(request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone()
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() => new Response('', { status: 504 }))
    })
  )
})

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered')
    // Handle background sync tasks
  }
})

// Push notification handling
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: '查看詳情',
          icon: '/icon-192.svg'
        },
        {
          action: 'close',
          title: '關閉',
          icon: '/icon-192.svg'
        }
      ]
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'))
  }
})
