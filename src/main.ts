import './assets/main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { setErrorHandler, apiService, api } from './services/api'
import { container, SERVICE_KEYS } from './services/container'
import { customErrorHandler } from './services/error-handler'
import { analytics } from './utils/analytics'
import { setupApiMetrics } from './utils/api-metrics'
import { loadCriticalResources, trackWebVitals } from './utils/performance'
import { setupRoutePreloading } from './utils/route-preloader'

// Load critical resources early
loadCriticalResources()

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
;(window as any).__routePreloader = routePreloader

// Mount app
app.mount('#app')

// 開始預加載關鍵路由
routePreloader.preloadCriticalRoutes()

// Initialize analytics
if (import.meta.env.VITE_GA_TRACKING_ID) {
  analytics.init()
}

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
  // Web Vitals monitoring with analytics integration
  import('web-vitals')
    .then(mod => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = mod as any
      getCLS((metric: any) => {
        console.log('CLS:', metric)
        if (window.gtag) {
          window.gtag('event', 'CLS', {
            value: Math.round(metric.value * 1000),
            event_category: 'Web Vitals'
          })
        }
      })

      getFID((metric: any) => {
        console.log('FID:', metric)
        if (window.gtag) {
          window.gtag('event', 'FID', {
            value: Math.round(metric.value),
            event_category: 'Web Vitals'
          })
        }
      })

      getFCP((metric: any) => {
        console.log('FCP:', metric)
        if (window.gtag) {
          window.gtag('event', 'FCP', {
            value: Math.round(metric.value),
            event_category: 'Web Vitals'
          })
        }
      })

      getLCP((metric: any) => {
        console.log('LCP:', metric)
        if (window.gtag) {
          window.gtag('event', 'LCP', {
            value: Math.round(metric.value),
            event_category: 'Web Vitals'
          })
        }
      })

      getTTFB((metric: any) => {
        console.log('TTFB:', metric)
        if (window.gtag) {
          window.gtag('event', 'TTFB', {
            value: Math.round(metric.value),
            event_category: 'Web Vitals'
          })
        }
      })
    })
    .catch(() => {
      // Silently fail if web-vitals is not available
    })

  // Track additional performance metrics
  trackWebVitals()

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

    if (scrollPercent > maxScrollDepth && scrollPercent % 25 === 0) {
      maxScrollDepth = scrollPercent
      analytics.trackScrollDepth(scrollPercent)
    }
  }

  let scrollTimeout: ReturnType<typeof setTimeout>
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(trackScrollDepth, 100)
  })

  // Track time on page
  const startTime = Date.now()
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000)
    analytics.trackTimeOnPage(timeOnPage)
  })
}
