import './assets/main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { setErrorHandler, apiService, api } from './services/api'
import { authServiceEnhanced } from './services/auth-service-enhanced'
import { container, SERVICE_KEYS } from './services/container'
import { customErrorHandler } from './services/error-handler'
import { analytics } from './utils/analytics'
import { setupApiMetrics } from './utils/api-metrics'
import { setupGlobalErrorHandlers } from './utils/error-logger'
import { loadCriticalResources } from './utils/performance'
import { setupRoutePreloading } from './utils/route-preloader'
import { ANALYTICS_CONFIG } from './config/analytics'

// Load critical resources early
loadCriticalResources()

// 設置全局錯誤處理器
setupGlobalErrorHandlers()

// 註冊核心服務到依賴注入容器
container.registerSingleton(SERVICE_KEYS.API_SERVICE, () => apiService)
container.registerSingleton(SERVICE_KEYS.ERROR_HANDLER, () => customErrorHandler)
container.registerSingleton(SERVICE_KEYS.ANALYTICS_SERVICE, () => analytics)

// Create Vue app
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Use router and Pinia
app.use(router)
app.use(pinia)

// 設置自定義錯誤處理器
setErrorHandler(customErrorHandler)

// 設置 API 指標監控
setupApiMetrics(api)

// 設置路由預加載
const routePreloader = setupRoutePreloading(router)
window.__routePreloader = routePreloader

// Mount app
app.mount('#app')

// 初始化認證狀態 (從 sessionStorage 和 localStorage 恢復)
authServiceEnhanced
  .initializeAuth()
  .then(() => {
    window.__authInitialized = true
  })
  .catch(error => {
    console.error('Failed to initialize auth:', error)
    window.__authInitialized = true // 即使失敗也標記為已初始化
  })

// 開始預加載關鍵路由
routePreloader.preloadCriticalRoutes()

// Note: Analytics is console-only (no external tracking)
// Real analytics can be added later if needed

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, notify user
                console.log('New content available, please refresh.')
              }
            })
          }
        })
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Performance monitoring
if (typeof window !== 'undefined') {
  // Simple Web Vitals monitoring (console only)
  import('web-vitals')
    .then(mod => {
      const { onCLS, onFID, onFCP, onLCP, onTTFB } = mod
      onCLS(metric => console.log('CLS:', metric))
      onFID(metric => console.log('FID:', metric))
      onFCP(metric => console.log('FCP:', metric))
      onLCP(metric => console.log('LCP:', metric))
      onTTFB(metric => console.log('TTFB:', metric))
    })
    .catch(error => {
      if (import.meta.env.DEV) {
        console.warn('Failed to load web-vitals:', error)
      }
    })

  // Monitor memory usage in development
  if (import.meta.env.DEV) {
    import('./utils/performance').then(({ monitorMemoryUsage, analyzeBundleSize }) => {
      monitorMemoryUsage()
      analyzeBundleSize()
    })
  }

  // Track scroll depth for engagement
  let maxScrollDepth = 0
  const trackScrollDepth = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = Math.round((scrollTop / docHeight) * 100)

    if (
      scrollPercent > maxScrollDepth &&
      scrollPercent % ANALYTICS_CONFIG.SCROLL_DEPTH_INTERVAL === 0
    ) {
      maxScrollDepth = scrollPercent
      analytics.trackScrollDepth(scrollPercent)
    }
  }

  let scrollTimeout: ReturnType<typeof setTimeout>
  const scrollHandler = () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(trackScrollDepth, ANALYTICS_CONFIG.SCROLL_DEBOUNCE_DELAY)
  }
  window.addEventListener('scroll', scrollHandler)

  // Track time on page
  const startTime = Date.now()
  const beforeUnloadHandler = () => {
    const timeOnPage = Math.round((Date.now() - startTime) / ANALYTICS_CONFIG.MS_TO_SECONDS)
    analytics.trackTimeOnPage(timeOnPage)
    
    // Cleanup event listeners to prevent memory leaks
    window.removeEventListener('scroll', scrollHandler)
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    clearTimeout(scrollTimeout)
  }
  window.addEventListener('beforeunload', beforeUnloadHandler)
}
