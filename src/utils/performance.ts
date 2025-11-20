// Performance optimization utilities

// Image lazy loading utility
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement
        image.src = src
        image.classList.remove('lazy')
        observer.unobserve(image)
      }
    })
  })

  observer.observe(img)
}

// Debounce utility for search and input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle utility for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// Preload critical resources
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type
  document.head.appendChild(link)
}

// Critical CSS inlining
export const inlineCriticalCSS = (css: string) => {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

// Resource hints
export const addResourceHint = (href: string, rel: 'prefetch' | 'preconnect' | 'dns-prefetch') => {
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  if (rel === 'preconnect') {
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}

// Web Vitals tracking (console only - no external analytics)
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return

  // Track Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver(list => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]

    if (!lastEntry) return

    // Log to console for debugging
    if (import.meta.env.DEV) {
      console.log('[Web Vitals] LCP:', {
        value: Math.round((lastEntry as any).startTime ?? 0),
        element: lastEntry
      })
    }
  })

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) {
    // Silently fail if not supported
  }
}

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = document.querySelectorAll('script[src]')
    let totalSize = 0

    scripts.forEach(async script => {
      const src = (script as HTMLScriptElement).src
      if (src.includes('localhost') || src.includes('127.0.0.1')) {
        try {
          const response = await fetch(src)
          const size = parseInt(response.headers.get('content-length') || '0')
          totalSize += size
          console.log(`Bundle: ${src.split('/').pop()} - ${(size / 1024).toFixed(2)}KB`)
        } catch (e) {
          // Silently fail
        }
      }
    })

    setTimeout(() => {
      console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`)
    }, 1000)
  }
}

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    console.log({
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`
    })
  }
}

// Critical resource loading
export const loadCriticalResources = () => {
  // Preload critical fonts
  preloadResource(
    'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap',
    'style'
  )

  // Preconnect to external domains
  addResourceHint('https://api.pharmacy-academy.com', 'preconnect')
  addResourceHint('https://cdnjs.cloudflare.com', 'preconnect')

  // DNS prefetch for analytics
  addResourceHint('//www.google-analytics.com', 'dns-prefetch')
  addResourceHint('//www.googletagmanager.com', 'dns-prefetch')
}
