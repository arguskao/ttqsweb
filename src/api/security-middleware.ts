// 安全中間件和防護措施
import type { Request, Response, NextFunction } from 'express'

// 速率限制配置
export interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
  standardHeaders: boolean
  legacyHeaders: boolean
}

// CSRF 保護中間件
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // 檢查 CSRF token
  const token = req.headers['x-csrf-token'] as string
  const sessionToken = (req as any).session?.csrfToken

  // 對於 GET 請求，跳過 CSRF 檢查
  if (req.method === 'GET') {
    return next()
  }

  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISMATCH',
        message: 'CSRF token 驗證失敗',
        timestamp: new Date().toISOString()
      }
    })
  }

  next()
}

// 生成 CSRF token
export const generateCSRFToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex')
}

// 安全頭部中間件
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // 設置安全頭部
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // HSTS (僅在 HTTPS 環境下)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}

// Content Security Policy 中間件
export const cspMiddleware = (req: Request, res: Response, next: NextFunction) => {
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

  res.setHeader('Content-Security-Policy', cspDirectives)
  next()
}

// 輸入驗證中間件
export const inputValidation = (req: Request, res: Response, next: NextFunction) => {
  // 檢查請求體大小
  const contentLength = parseInt(req.headers['content-length'] || '0')
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: '請求體過大',
        timestamp: new Date().toISOString()
      }
    })
  }

  // 檢查 Content-Type
  const contentType = req.headers['content-type']
  if (req.method !== 'GET' && req.method !== 'HEAD' && !contentType?.includes('application/json')) {
    return res.status(415).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: '不支持的媒體類型',
        timestamp: new Date().toISOString()
      }
    })
  }

  next()
}

// SQL 注入防護中間件
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(UNION\s+SELECT)/gi,
    /(DROP\s+TABLE)/gi,
    /(DELETE\s+FROM)/gi,
    /(INSERT\s+INTO)/gi,
    /(UPDATE\s+SET)/gi
  ]

  const checkForSQLInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlInjectionPatterns.some(pattern => pattern.test(obj))
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSQLInjection(value))
    }

    return false
  }

  // 檢查請求體、查詢參數和路徑參數
  if (
    checkForSQLInjection(req.body) ||
    checkForSQLInjection(req.query) ||
    checkForSQLInjection(req.params)
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: '檢測到潛在的 SQL 注入攻擊',
        timestamp: new Date().toISOString()
      }
    })
  }

  next()
}

// XSS 防護中間件
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi
  ]

  const checkForXSS = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return xssPatterns.some(pattern => pattern.test(obj))
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForXSS(value))
    }

    return false
  }

  if (checkForXSS(req.body) || checkForXSS(req.query)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: '檢測到潛在的 XSS 攻擊',
        timestamp: new Date().toISOString()
      }
    })
  }

  next()
}

// 請求日誌中間件
export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  const requestId =
    req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 添加請求 ID 到響應頭
  res.setHeader('X-Request-ID', requestId)

  // 記錄請求開始
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${requestId}`)

  // 監聽響應完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO'

    console.log(
      `[${new Date().toISOString()}] ${logLevel} ${req.method} ${req.path} ${res.statusCode} - ${duration}ms - Request ID: ${requestId}`
    )
  })

  next()
}

// 錯誤處理中間件
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)

  // 根據錯誤類型返回適當的響應
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '數據驗證失敗',
        details: err.details,
        timestamp: new Date().toISOString()
      }
    })
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授權訪問',
        timestamp: new Date().toISOString()
      }
    })
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '權限不足',
        timestamp: new Date().toISOString()
      }
    })
  }

  // 默認錯誤響應
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '服務器內部錯誤',
      timestamp: new Date().toISOString()
    }
  })
}

// 組合所有安全中間件
export const securityMiddleware = [
  securityHeaders,
  cspMiddleware,
  inputValidation,
  sqlInjectionProtection,
  xssProtection,
  requestLogging
]

// 認證相關的安全中間件
export const authSecurityMiddleware = [csrfProtection, ...securityMiddleware]

// 導出所有中間件
export {
  csrfProtection,
  generateCSRFToken,
  securityHeaders,
  cspMiddleware,
  inputValidation,
  sqlInjectionProtection,
  xssProtection,
  requestLogging,
  errorHandler
}
