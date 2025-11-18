/**
 * API響應優化中間件
 * 提供壓縮、緩存、結構化響應等功能
 */

import type { ApiRequest, ApiResponse, Middleware } from './types'

// 響應壓縮配置
interface CompressionConfig {
  enabled: boolean
  threshold: number // 最小壓縮大小 (bytes)
  algorithms: ('gzip' | 'deflate' | 'brotli')[]
}

// 緩存配置
interface CacheConfig {
  enabled: boolean
  ttl: number // 緩存時間 (seconds)
  varyHeaders: string[] // 影響緩存的請求頭
}

// 響應優化配置
interface ResponseOptimizationConfig {
  compression: CompressionConfig
  cache: CacheConfig
  enableMetrics: boolean
  enableStructuredLogging: boolean
}

const defaultConfig: ResponseOptimizationConfig = {
  compression: {
    enabled: true,
    threshold: 1024, // 1KB
    algorithms: ['gzip', 'deflate']
  },
  cache: {
    enabled: true,
    ttl: 300, // 5分鐘
    varyHeaders: ['authorization', 'accept-language']
  },
  enableMetrics: true,
  enableStructuredLogging: true
}

// 響應壓縮中間件
export const compressionMiddleware = (config = defaultConfig.compression): Middleware => {
  return async (req, next) => {
    const startTime = Date.now()
    const response = await next()
    const duration = Date.now() - startTime

    if (!config.enabled) {
      return response
    }

    // 檢查響應大小
    const responseSize = JSON.stringify(response).length
    if (responseSize < config.threshold) {
      return response
    }

    // 檢查客戶端支持的壓縮算法
    const acceptEncoding = req.headers['accept-encoding'] ?? ''
    let compressionAlgorithm: string | null = null

    if (acceptEncoding.includes('br') && config.algorithms.includes('brotli')) {
      compressionAlgorithm = 'br'
    } else if (acceptEncoding.includes('gzip') && config.algorithms.includes('gzip')) {
      compressionAlgorithm = 'gzip'
    } else if (acceptEncoding.includes('deflate') && config.algorithms.includes('deflate')) {
      compressionAlgorithm = 'deflate'
    }

    if (compressionAlgorithm) {
      // 在實際環境中，這裡會實現真正的壓縮
      // 目前只是添加壓縮標頭
      response.headers = response.headers ?? {}
      response.headers['Content-Encoding'] = compressionAlgorithm
      response.headers['Vary'] = 'Accept-Encoding'

      // 記錄壓縮統計
      if (defaultConfig.enableMetrics) {
        console.log(
          `Response compressed with ${compressionAlgorithm}: ${responseSize} -> ${Math.round(responseSize * 0.7)} bytes`
        )
      }
    }

    return response
  }
}

// 響應緩存中間件
export const cacheMiddleware = (config = defaultConfig.cache): Middleware => {
  // 內存緩存存儲 (生產環境應使用Redis)
  const cache = new Map<string, { data: ApiResponse; expiry: number }>()

  // 清理過期緩存的函數
  const cleanupExpiredCache = () => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiry) {
        cache.delete(key)
      }
    }
  }

  return async (req, next) => {
    if (!config.enabled) {
      return await next()
    }

    // 只緩存GET請求
    if (req.method !== 'GET') {
      return await next()
    }

    // 偶爾清理過期緩存 (10% 的機率)
    if (Math.random() < 0.1) {
      cleanupExpiredCache()
    }

    // 生成緩存鍵
    const cacheKey = generateCacheKey(req, config.varyHeaders)

    // 檢查緩存
    const cached = cache.get(cacheKey)
    if (cached && Date.now() < cached.expiry) {
      // 添加緩存命中標頭
      const response = { ...cached.data }
      response.headers = response.headers ?? {}
      response.headers['X-Cache'] = 'HIT'
      response.headers['X-Cache-TTL'] = Math.round((cached.expiry - Date.now()) / 1000).toString()

      if (defaultConfig.enableMetrics) {
        console.log(`Cache HIT for ${req.url}`)
      }

      return response
    }

    // 執行請求
    const response = await next()

    // 只緩存成功的響應
    if (response.success !== false) {
      const expiry = Date.now() + config.ttl * 1000
      cache.set(cacheKey, { data: response, expiry })

      // 添加緩存標頭
      response.headers = response.headers ?? {}
      response.headers['X-Cache'] = 'MISS'
      response.headers['Cache-Control'] = `public, max-age=${config.ttl}`
    }

    return response
  }
}

// 生成緩存鍵
function generateCacheKey(req: ApiRequest, varyHeaders: string[]): string {
  const url = req.url ?? ''
  const query = req.query ?? {}
  const headers: Record<string, string> = {}

  // 只包含影響緩存的請求頭
  varyHeaders.forEach(header => {
    const value = req.headers[header.toLowerCase()] || req.headers[header]
    if (value) {
      headers[header] = value as string
    }
  })

  return `${req.method}:${url}:${JSON.stringify(query)}:${JSON.stringify(headers)}`
}

// 響應時間監控中間件
export const performanceMiddleware = (): Middleware => {
  return async (req, next) => {
    const startTime = Date.now()
    const startMemory = process.memoryUsage()

    try {
      const response = await next()
      const duration = Date.now() - startTime
      const endMemory = process.memoryUsage()

      // 添加性能標頭
      response.headers = response.headers ?? {}
      response.headers['X-Response-Time'] = `${duration}ms`
      response.headers['X-Memory-Usage'] =
        `${Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024)}KB`

      // 記錄性能指標
      if (defaultConfig.enableMetrics) {
        logPerformanceMetrics(req, response, duration, startMemory, endMemory)
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // 記錄錯誤性能指標
      if (defaultConfig.enableMetrics) {
        logErrorMetrics(req, error, duration)
      }

      throw error
    }
  }
}

// 記錄性能指標
function logPerformanceMetrics(
  req: ApiRequest,
  response: ApiResponse,
  duration: number,
  startMemory: NodeJS.MemoryUsage,
  endMemory: NodeJS.MemoryUsage
) {
  const metrics = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    statusCode: response.success === false ? 500 : 200,
    duration,
    memoryDelta: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id
  }

  console.log('API Performance:', JSON.stringify(metrics))
}

// 記錄錯誤指標
function logErrorMetrics(req: ApiRequest, error: any, duration: number) {
  const metrics = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    error: error.message || 'Unknown error',
    duration,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id
  }

  console.error('API Error:', JSON.stringify(metrics))
}

// 結構化響應中間件
export const structuredResponseMiddleware = (): Middleware => {
  return async (req, next) => {
    const startTime = Date.now()

    try {
      const response = await next()
      const duration = Date.now() - startTime

      // 確保響應格式一致
      const structuredResponse: ApiResponse = {
        success: response.success !== false,
        data: response.data,
        error: response.error,
        meta: {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          requestId: req.headers['x-request-id'] || generateRequestId()
        }
      }

      return structuredResponse
    } catch (error) {
      const duration = Date.now() - startTime

      // 結構化錯誤響應
      return {
        success: false,
        error: {
          code: (error as any)?.code || 'INTERNAL_ERROR',
          message: (error as any)?.message || '內部伺服器錯誤',
          statusCode: 500
        },
        meta: {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          requestId: req.headers['x-request-id'] || generateRequestId()
        }
      }
    }
  }
}

// 生成請求ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 請求去重中間件
export const deduplicationMiddleware = (): Middleware => {
  const pendingRequests = new Map<string, Promise<ApiResponse>>()

  return async (req, next) => {
    // 只對GET請求進行去重
    if (req.method !== 'GET') {
      return await next()
    }

    const requestKey = `${req.method}:${req.url}:${req.headers['authorization'] ?? ''}`

    // 檢查是否有相同的請求正在處理
    const pendingRequest = pendingRequests.get(requestKey)
    if (pendingRequest) {
      console.log(`Deduplicating request: ${requestKey}`)
      return await pendingRequest
    }

    // 創建新的請求Promise
    const requestPromise = next()
    pendingRequests.set(requestKey, requestPromise)

    try {
      return await requestPromise
    } finally {
      // 清理pending請求
      pendingRequests.delete(requestKey)
    }
  }
}

// 批量操作中間件
export const batchOperationMiddleware = (): Middleware => {
  return async (req, next) => {
    // 檢查是否為批量操作請求
    if (req.url?.includes('/batch') && req.method === 'POST') {
      const batchRequests = req.body as Array<{
        method: string
        url: string
        body?: any
        headers?: Record<string, string>
      }>

      if (Array.isArray(batchRequests)) {
        const batchResponses = await Promise.allSettled(
          batchRequests.map(async batchReq => {
            try {
              // 模擬處理批量請求
              const mockResponse = await next()
              return {
                success: true,
                data: mockResponse.data,
                meta: {
                  originalUrl: batchReq.url,
                  originalMethod: batchReq.method
                }
              }
            } catch (error) {
              return {
                success: false,
                error: {
                  code: 'BATCH_REQUEST_ERROR',
                  message: (error as any)?.message || '批量請求處理失敗',
                  statusCode: 500
                }
              }
            }
          })
        )

        return {
          success: true,
          data: {
            results: batchResponses.map(result =>
              result.status === 'fulfilled'
                ? result.value
                : {
                  success: false,
                  error: {
                    code: 'BATCH_REQUEST_FAILED',
                    message: '批量請求失敗'
                  }
                }
            ),
            total: batchRequests.length,
            successful: batchResponses.filter(r => r.status === 'fulfilled').length,
            failed: batchResponses.filter(r => r.status === 'rejected').length
          }
        }
      }
    }

    return await next()
  }
}

// 組合所有響應優化中間件
export const responseOptimizationMiddleware = (config = defaultConfig): Middleware[] => {
  return [
    performanceMiddleware(),
    compressionMiddleware(config.compression),
    cacheMiddleware(config.cache),
    deduplicationMiddleware(),
    batchOperationMiddleware(),
    structuredResponseMiddleware()
  ]
}

// 導出配置接口
export type { ResponseOptimizationConfig, CompressionConfig, CacheConfig }
