// Rate limiting middleware for authentication security
import type { Middleware } from './types'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxAttempts: number // Maximum attempts per window
  blockDurationMs: number // Block duration after max attempts exceeded
}

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  blockedUntil?: number
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up function (called manually instead of using setInterval)
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      rateLimitStore.delete(key)
    } else if (!entry.blockedUntil && now - entry.firstAttempt > 15 * 60 * 1000) {
      // 15 minutes
      rateLimitStore.delete(key)
    }
  }
}

export const createRateLimit = (config: RateLimitConfig) => {
  return (identifier: string): Middleware => {
    return async (req, next) => {
      const now = Date.now()
      const key = `rate_limit:${identifier}:${req.ip || 'unknown'}`

      let entry = rateLimitStore.get(key)

      if (!entry) {
        entry = {
          attempts: 0,
          firstAttempt: now
        }
        rateLimitStore.set(key, entry)
      }

      // Check if currently blocked
      if (entry.blockedUntil && entry.blockedUntil > now) {
        const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000)
        throw new Error(`請求過於頻繁，請 ${remainingTime} 秒後再試`)
      }

      // Reset window if expired
      if (now - entry.firstAttempt > config.windowMs) {
        entry.attempts = 0
        entry.firstAttempt = now
        entry.blockedUntil = undefined
      }

      // Increment attempts
      entry.attempts++

      // Check if limit exceeded
      if (entry.attempts > config.maxAttempts) {
        entry.blockedUntil = now + config.blockDurationMs
        throw new Error(`請求過於頻繁，請 ${Math.ceil(config.blockDurationMs / 1000)} 秒後再試`)
      }

      // Continue to next middleware
      return await next()
    }
  }
}

// Predefined rate limiters for common use cases
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5, // 5 attempts per 15 minutes
  blockDurationMs: 30 * 60 * 1000 // Block for 30 minutes
})

export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3, // 3 attempts per hour
  blockDurationMs: 60 * 60 * 1000 // Block for 1 hour
})

export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3, // 3 attempts per hour
  blockDurationMs: 60 * 60 * 1000 // Block for 1 hour
})

export const generalApiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 100, // 100 requests per 15 minutes
  blockDurationMs: 15 * 60 * 1000 // Block for 15 minutes
})

