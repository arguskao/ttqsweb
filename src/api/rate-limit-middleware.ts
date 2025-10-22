// 速率限制中間件
import type { ApiRequest, ApiResponse, Middleware } from './types'

// 內存存儲的速率限制器
class MemoryRateLimiter {
  private readonly requests: Map<string, { count: number; resetTime: number }> = new Map()

  // 清理過期的記錄
  private cleanup() {
    const now = Date.now()
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key)
      }
    }
  }

  // 檢查是否超過限制
  isLimitExceeded(key: string, limit: number, windowMs: number): boolean {
    this.cleanup()

    const now = Date.now()
    const data = this.requests.get(key)

    if (!data || now > data.resetTime) {
      // 創建新的記錄
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return false
    }

    if (data.count >= limit) {
      return true
    }

    // 增加計數
    data.count++
    return false
  }

  // 獲取剩餘請求數
  getRemainingRequests(key: string, limit: number, windowMs: number): number {
    this.cleanup()

    const data = this.requests.get(key)
    if (!data || Date.now() > data.resetTime) {
      return limit - 1
    }

    return Math.max(0, limit - data.count)
  }

  // 獲取重置時間
  getResetTime(key: string): number {
    const data = this.requests.get(key)
    return data ? data.resetTime : Date.now()
  }
}

// 全局速率限制器實例
const rateLimiter = new MemoryRateLimiter()

// 速率限制選項
export interface RateLimitOptions {
  windowMs: number
  max: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: ApiRequest) => string
}

// 默認鍵生成器
const defaultKeyGenerator = (req: ApiRequest): string => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
  return `rate_limit:${ip}`
}

// 速率限制中間件工廠
export const createRateLimit = (options: RateLimitOptions): Middleware => {
  const {
    windowMs,
    max,
    message = '請求過於頻繁，請稍後再試',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator
  } = options

  return async (req: ApiRequest, next: () => Promise<ApiResponse>): Promise<ApiResponse> => {
    const key = keyGenerator(req)

    // 檢查是否超過限制
    if (rateLimiter.isLimitExceeded(key, max, windowMs)) {
      const resetTime = rateLimiter.getResetTime(key)
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          timestamp: new Date().toISOString(),
          requestId: 'unknown'
        },
        headers: {
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          'Retry-After': retryAfter.toString()
        }
      }
    }

    // 執行下一個中間件或處理器
    const response = await next()

    // 設置速率限制頭部
    const remaining = rateLimiter.getRemainingRequests(key, max, windowMs)
    const resetTime = rateLimiter.getResetTime(key)

    return {
      ...response,
      headers: {
        ...response.headers,
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      }
    }
  }
}

// 預定義的速率限制器

// 登入速率限制 - 15分鐘內最多5次嘗試
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 5,
  message: '登入嘗試過於頻繁，請15分鐘後再試'
})

// 註冊速率限制 - 1小時內最多3次嘗試
export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 3,
  message: '註冊嘗試過於頻繁，請1小時後再試'
})

// API 速率限制 - 15分鐘內最多100次請求
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100,
  message: 'API 請求過於頻繁，請稍後再試'
})

// 密碼重置速率限制 - 1小時內最多3次嘗試
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 3,
  message: '密碼重置嘗試過於頻繁，請1小時後再試'
})

// 文件上傳速率限制 - 1小時內最多10次上傳
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 10,
  message: '文件上傳過於頻繁，請1小時後再試'
})

// 搜索速率限制 - 1分鐘內最多20次搜索
export const searchRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分鐘
  max: 20,
  message: '搜索請求過於頻繁，請稍後再試'
})

// 嚴格速率限制 - 用於敏感操作
export const strictRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 10,
  message: '操作過於頻繁，請1小時後再試'
})

// 導出速率限制器實例
export { rateLimiter }
