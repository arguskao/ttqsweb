import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { analytics } from './utils/analytics'
import { loadCriticalResources, trackWebVitals } from './utils/performance'

// Load critical resources early
loadCriticalResources()

// Create Vue app
const app = createApp(App)

// Use router
app.use(router)

// Mount app
app.mount('#app')

// Initialize analytics
if (import.meta.env.VITE_GA_TRACKING_ID) {
    analytics.init()
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);

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
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Performance monitoring
if (typeof window !== 'undefined') {
    // Web Vitals monitoring with analytics integration
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
            console.log('CLS:', metric)
            if (window.gtag) {
                window.gtag('event', 'CLS', {
                    value: Math.round(metric.value * 1000),
                    event_category: 'Web Vitals'
                })
            }
        })

        getFID((metric) => {
            console.log('FID:', metric)
            if (window.gtag) {
                window.gtag('event', 'FID', {
                    value: Math.round(metric.value),
                    event_category: 'Web Vitals'
                })
            }
        })

        getFCP((metric) => {
            console.log('FCP:', metric)
            if (window.gtag) {
                window.gtag('event', 'FCP', {
                    value: Math.round(metric.value),
                    event_category: 'Web Vitals'
                })
            }
        })

        getLCP((metric) => {
            console.log('LCP:', metric)
            if (window.gtag) {
                window.gtag('event', 'LCP', {
                    value: Math.round(metric.value),
                    event_category: 'Web Vitals'
                })
            }
        })

        getTTFB((metric) => {
            console.log('TTFB:', metric)
            if (window.gtag) {
                window.gtag('event', 'TTFB', {
                    value: Math.round(metric.value),
                    event_category: 'Web Vitals'
                })
            }
        })
    }).catch(() => {
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

    let scrollTimeout: number
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