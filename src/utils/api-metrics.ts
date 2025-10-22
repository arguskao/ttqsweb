import { analytics } from './analytics'

interface ApiMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  status?: number
  success?: boolean
  error?: string
}

class ApiMetricsCollector {
  private readonly metrics: Map<string, ApiMetrics> = new Map()
  private readonly maxMetrics = 1000 // Keep only last 1000 requests

  startRequest(requestId: string, method: string, url: string): void {
    const metric: ApiMetrics = {
      requestId,
      method,
      url,
      startTime: performance.now()
    }

    this.metrics.set(requestId, metric)

    // Clean up old metrics if we exceed the limit
    if (this.metrics.size > this.maxMetrics) {
      const oldestKey = this.metrics.keys().next().value as string | undefined
      if (oldestKey) {
        this.metrics.delete(oldestKey)
      }
    }
  }

  endRequest(requestId: string, status: number, success: boolean, error?: string): void {
    const metric = this.metrics.get(requestId)
    if (!metric) return

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    metric.status = status
    metric.success = success
    metric.error = error

    // Send metrics to analytics
    this.sendMetricsToAnalytics(metric)

    // Clean up the metric after processing
    this.metrics.delete(requestId)
  }

  private sendMetricsToAnalytics(metric: ApiMetrics): void {
    if (!metric.duration) return

    // Track API response time
    analytics.trackEvent(
      'api_request',
      'API',
      `${metric.method} ${this.sanitizeUrl(metric.url)}`,
      Math.round(metric.duration)
    )

    // Track error rates
    if (!metric.success) {
      analytics.trackEvent(
        'api_error',
        'API',
        `${metric.method} ${this.sanitizeUrl(metric.url)} - ${metric.status}`,
        metric.status
      )
    }

    // Track slow requests (>1 second)
    if (metric.duration > 1000) {
      analytics.trackEvent(
        'api_slow_request',
        'API',
        `${metric.method} ${this.sanitizeUrl(metric.url)}`,
        Math.round(metric.duration)
      )
    }
  }

  private sanitizeUrl(url: string): string {
    // Remove sensitive data from URLs
    return url
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/[?&]token=[^&]*/g, '') // Remove tokens
      .replace(/[?&]password=[^&]*/g, '') // Remove passwords
      .replace(/[?&]email=[^&]*/g, '') // Remove emails
  }

  getMetrics(): ApiMetrics[] {
    return Array.from(this.metrics.values())
  }

  getAverageResponseTime(): number {
    const completedMetrics = Array.from(this.metrics.values()).filter(m => m.duration !== undefined)

    if (completedMetrics.length === 0) return 0

    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration ?? 0), 0)
    return totalDuration / completedMetrics.length
  }

  getErrorRate(): number {
    const completedMetrics = Array.from(this.metrics.values()).filter(m => m.success !== undefined)

    if (completedMetrics.length === 0) return 0

    const errorCount = completedMetrics.filter(m => !m.success).length
    return errorCount / completedMetrics.length
  }

  getSlowRequestCount(): number {
    return Array.from(this.metrics.values()).filter(m => m.duration && m.duration > 1000).length
  }
}

// Global instance
export const apiMetricsCollector = new ApiMetricsCollector()

// Axios interceptor integration
export function setupApiMetrics(axiosInstance: any): void {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: any) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      config.metadata = { requestId }

      apiMetricsCollector.startRequest(
        requestId,
        config.method?.toUpperCase() || 'GET',
        config.url ?? ''
      )

      return config
    },
    (error: any) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: any) => {
      const requestId = response.config.metadata?.requestId
      if (requestId) {
        apiMetricsCollector.endRequest(requestId, response.status, true)
      }
      return response
    },
    (error: any) => {
      const requestId = error.config?.metadata?.requestId
      if (requestId) {
        apiMetricsCollector.endRequest(requestId, error.response?.status ?? 0, false, error.message)
      }
      return Promise.reject(error)
    }
  )
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private readonly metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): void {
    this.metrics.set(label, performance.now())
  }

  endTiming(label: string): number {
    const startTime = this.metrics.get(label)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.metrics.delete(label)

    // Track timing in analytics
    analytics.trackEvent(
      'performance_timing',
      'Performance',
      label,
      Math.round(duration)
    )

    return duration
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(label)
    return fn().finally(() => {
      this.endTiming(label)
    })
  }

  measureSync<T>(label: string, fn: () => T): T {
    this.startTiming(label)
    try {
      return fn()
    } finally {
      this.endTiming(label)
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Web Vitals integration
export function trackWebVitals(): void {
  if (typeof window === 'undefined') return

  // Track Core Web Vitals
  import('web-vitals')
    .then((mod: any) => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = mod as any

      if (getCLS) {
        getCLS((metric: any) => {
          analytics.trackEvent(
            'web_vital',
            'Web Vitals',
            `CLS: ${metric.rating}`,
            Math.round(metric.value * 1000)
          )
        })
      }

      if (getFID) {
        getFID((metric: any) => {
          analytics.trackEvent(
            'web_vital',
            'Web Vitals',
            `FID: ${metric.rating}`,
            Math.round(metric.value)
          )
        })
      }

      if (getFCP) {
        getFCP((metric: any) => {
          analytics.trackEvent(
            'web_vital',
            'Web Vitals',
            `FCP: ${metric.rating}`,
            Math.round(metric.value)
          )
        })
      }

      if (getLCP) {
        getLCP((metric: any) => {
          analytics.trackEvent(
            'web_vital',
            'Web Vitals',
            `LCP: ${metric.rating}`,
            Math.round(metric.value)
          )
        })
      }

      if (getTTFB) {
        getTTFB((metric: any) => {
          analytics.trackEvent(
            'web_vital',
            'Web Vitals',
            `TTFB: ${metric.rating}`,
            Math.round(metric.value)
          )
        })
      }
    })
    .catch(() => {
      // Silently fail if web-vitals is not available
    })
}
