// 速率限制中間件
import type { Request, Response, NextFunction } from 'express'

// 內存存儲的速率限制器
class MemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

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

    if (!data) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return false
    }

    if (now > data.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return false
    }

    if (data.count >= limit) {
      return true
    }

    data.count++
    return false
  }

  // 獲取剩餘請求次數
  getRemainingRequests(key: string, limit: number, windowMs: number): number {
    this.cleanup()

    const now = Date.now()
    const data = this.requests.get(key)

    if (!data || now > data.resetTime) {
      return limit
    }

    return Math.max(0, limit - data.count)
  }

  // 獲取重置時間
  getResetTime(key: string): number {
    const data = this.requests.get(key)
    return data ? data.resetTime : Date.now()
  }
}

const rateLimiter = new MemoryRateLimiter()

// 速率限制配置
export interface RateLimitOptions {
  windowMs: number
  max: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: Request) => string
}

// 默認的 key 生成器
const defaultKeyGenerator = (req: Request): string => {
  // 使用 IP 地址作為默認 key
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  return `rate_limit:${ip}`
}

// 速率限制中間件工廠
export const createRateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = '請求過於頻繁，請稍後再試',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator
  } = options

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req)

    // 檢查是否超過限制
    if (rateLimiter.isLimitExceeded(key, max, windowMs)) {
      const resetTime = rateLimiter.getResetTime(key)
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

      // 設置響應頭
      res.setHeader('X-RateLimit-Limit', max.toString())
      res.setHeader('X-RateLimit-Remaining', '0')
      res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString())
      res.setHeader('Retry-After', retryAfter.toString())

      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter,
          timestamp: new Date().toISOString()
        }
      })
    }

    // 設置響應頭
    const remaining = rateLimiter.getRemainingRequests(key, max, windowMs)
    const resetTime = rateLimiter.getResetTime(key)

    res.setHeader('X-RateLimit-Limit', max.toString())
    res.setHeader('X-RateLimit-Remaining', remaining.toString())
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString())

    // 監聽響應完成，決定是否計數
    const originalSend = res.send
    res.send = function (data) {
      const statusCode = res.statusCode

      // 根據配置決定是否計數
      if (skipSuccessfulRequests && statusCode < 400) {
        // 不計數成功的請求
      } else if (skipFailedRequests && statusCode >= 400) {
        // 不計數失敗的請求
      } else {
        // 正常計數
        rateLimiter.isLimitExceeded(key, max, windowMs)
      }

      return originalSend.call(this, data)
    }

    next()
  }
}

// 預定義的速率限制器

// 登入速率限制 - 15分鐘內最多5次嘗試
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 5,
  message: '登入嘗試次數過多，請15分鐘後再試',
  keyGenerator: req => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const email = req.body?.email || 'unknown'
    return `login:${ip}:${email}`
  }
})

// 註冊速率限制 - 1小時內最多3次嘗試
export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 3,
  message: '註冊嘗試次數過多，請1小時後再試',
  keyGenerator: req => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    return `register:${ip}`
  }
})

// API 速率限制 - 15分鐘內最多100次請求
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100,
  message: 'API 請求過於頻繁，請稍後再試',
  keyGenerator: req => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const userId = (req as any).user?.id || 'anonymous'
    return `api:${ip}:${userId}`
  }
})

// 密碼重置速率限制 - 1小時內最多3次嘗試
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 3,
  message: '密碼重置請求過於頻繁，請1小時後再試',
  keyGenerator: req => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const email = req.body?.email || 'unknown'
    return `password_reset:${ip}:${email}`
  }
})

// 文件上傳速率限制 - 1小時內最多10次上傳
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 10,
  message: '文件上傳過於頻繁，請1小時後再試',
  keyGenerator: req => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const userId = (req as any).user?.id || 'anonymous'
    return `upload:${ip}:${userId}`
  }
})

// 搜索速率限制 - 1分鐘內最多20次搜索
export const searchRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分鐘
  max: 20,
  message: '搜索請求過於頻繁，請稍後再試',
  keyGenerator: req => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const userId = (req as any).user?.id || 'anonymous'
    return `search:${ip}:${userId}`
  }
})

// 嚴格速率限制 - 用於敏感操作
export const strictRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: 10,
  message: '操作過於頻繁，請1小時後再試',
  keyGenerator: req => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const userId = (req as any).user?.id || 'anonymous'
    const path = req.path
    return `strict:${ip}:${userId}:${path}`
  }
})

// 導出所有速率限制器
export { createRateLimit, rateLimiter }
