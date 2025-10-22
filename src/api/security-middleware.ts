// 安全中間件和防護措施
import type { ApiRequest, ApiResponse, Middleware } from './types'

// 速率限制配置
export interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
  standardHeaders: boolean
  legacyHeaders: boolean
}

// CSRF 保護中間件
export const csrfProtection: Middleware = async (req, next) => {
  // 檢查 CSRF token
  const token = req.headers['x-csrf-token'] as string
  const sessionToken = (req as any).session?.csrfToken

  // 對於 GET 請求，跳過 CSRF 檢查
  if (req.method === 'GET') {
    return await next()
  }

  if (!token || token !== sessionToken) {
    return {
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISMATCH',
        message: 'CSRF token 驗證失敗',
        timestamp: new Date().toISOString(),
        requestId: 'unknown'
      }
    }
  }

  return await next()
}

// 生成 CSRF token
export const generateCSRFToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex')
}

// 安全頭部中間件
export const securityHeaders: Middleware = async (req, next) => {
  const response = await next()

  // 設置安全頭部
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  }

  // HSTS (僅在 HTTPS 環境下)
  if (req.url?.startsWith('https://')) {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
  }

  return {
    ...response,
    headers: {
      ...response.headers,
      ...securityHeaders
    }
  }
}

// Content Security Policy 中間件
export const cspMiddleware: Middleware = async (req, next) => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.example.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')

  const response = await next()

  return {
    ...response,
    headers: {
      ...response.headers,
      'Content-Security-Policy': cspDirectives
    }
  }
}

// 輸入驗證中間件
export const inputValidation: Middleware = async (req, next) => {
  // 檢查請求體大小
  const contentLength = parseInt(req.headers['content-length'] || '0')
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (contentLength > maxSize) {
    return {
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: '請求體過大',
        timestamp: new Date().toISOString(),
        requestId: 'unknown'
      }
    }
  }

  // 檢查 Content-Type
  const contentType = req.headers['content-type']
  if (req.method !== 'GET' && req.method !== 'HEAD' && !contentType?.includes('application/json')) {
    return {
      success: false,
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: '不支持的媒體類型',
        timestamp: new Date().toISOString(),
        requestId: 'unknown'
      }
    }
  }

  return await next()
}

// SQL 注入防護中間件
export const sqlInjectionProtection: Middleware = async (req, next) => {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(UNION\s+SELECT)/gi,
    /(DROP\s+TABLE)/gi,
    /(DELETE\s+FROM)/gi,
    /(INSERT\s+INTO)/gi,
    /(UPDATE\s+SET)/gi
  ]

  // 檢查查詢參數
  const queryString = JSON.stringify(req.query ?? {})
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(queryString)) {
      return {
        success: false,
        error: {
          code: 'SQL_INJECTION_DETECTED',
          message: '檢測到潛在的 SQL 注入攻擊',
          timestamp: new Date().toISOString(),
          requestId: 'unknown'
        }
      }
    }
  }

  // 檢查請求體
  if (req.body) {
    const bodyString = JSON.stringify(req.body)
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(bodyString)) {
        return {
          success: false,
          error: {
            code: 'SQL_INJECTION_DETECTED',
            message: '檢測到潛在的 SQL 注入攻擊',
            timestamp: new Date().toISOString(),
            requestId: 'unknown'
          }
        }
      }
    }
  }

  return await next()
}

// XSS 防護中間件
export const xssProtection: Middleware = async (req, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ]

  // 檢查查詢參數
  const queryString = JSON.stringify(req.query ?? {})
  for (const pattern of xssPatterns) {
    if (pattern.test(queryString)) {
      return {
        success: false,
        error: {
          code: 'XSS_DETECTED',
          message: '檢測到潛在的 XSS 攻擊',
          timestamp: new Date().toISOString(),
          requestId: 'unknown'
        }
      }
    }
  }

  // 檢查請求體
  if (req.body) {
    const bodyString = JSON.stringify(req.body)
    for (const pattern of xssPatterns) {
      if (pattern.test(bodyString)) {
        return {
          success: false,
          error: {
            code: 'XSS_DETECTED',
            message: '檢測到潛在的 XSS 攻擊',
            timestamp: new Date().toISOString(),
            requestId: 'unknown'
          }
        }
      }
    }
  }

  return await next()
}

// 請求日誌中間件
export const requestLogging: Middleware = async (req, next) => {
  const startTime = Date.now()
  const requestId = require('crypto').randomBytes(16).toString('hex')

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request ID: ${requestId}`)

  const response = await next()
  const duration = Date.now() - startTime

  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - ${response.success ? 'SUCCESS' : 'ERROR'} - ${duration}ms - Request ID: ${requestId}`
  )

  return {
    ...response,
    meta: {
      ...response.meta,
      requestId,
      duration: `${duration}ms`
    }
  }
}

// 錯誤處理函數 (不是中間件，因為它處理錯誤)
export const handleError = (error: any, req: ApiRequest): ApiResponse => {
  console.error('Unhandled error:', error)

  // 根據錯誤類型返回適當的響應
  if (error.name === 'ValidationError') {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || '驗證失敗',
        timestamp: new Date().toISOString(),
        requestId: 'unknown'
      }
    }
  }

  if (error.name === 'UnauthorizedError') {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message || '未授權訪問',
        timestamp: new Date().toISOString(),
        requestId: 'unknown'
      }
    }
  }

  // 默認錯誤響應
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '內部服務器錯誤',
      timestamp: new Date().toISOString(),
      requestId: 'unknown'
    }
  }
}

// 所有中間件已經通過 export const 導出，不需要重複導出
