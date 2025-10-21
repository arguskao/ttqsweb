import jwt from 'jsonwebtoken'

import { AuthenticationError, ValidationError, handleApiError } from './errors'
import type { Middleware } from './types'

// CORS middleware
export const corsMiddleware: Middleware = async (req, next) => {
  const response = await next()

  // Add CORS headers (this would be handled by the server framework in a real implementation)
  return {
    ...response,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...response.headers
    }
  }
}

// Request logging middleware
export const loggingMiddleware: Middleware = async (req, next) => {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)

  try {
    const response = await next()
    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${response.success ? 'SUCCESS' : 'ERROR'} (${duration}ms)`)
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} - ERROR (${duration}ms)`, error)
    throw error
  }
}

// Error handling middleware
export const errorHandlingMiddleware: Middleware = async (req, next) => {
  try {
    return await next()
  } catch (error) {
    const apiError = handleApiError(error)
    return {
      success: false,
      error: apiError
    }
  }
}

// Authentication middleware
export const authMiddleware: Middleware = async (req, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('缺少認證令牌')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType
    }

    return await next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('無效的認證令牌')
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('認證令牌已過期')
    }
    throw error
  }
}

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthMiddleware: Middleware = async (req, next) => {
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    try {
      const jwtSecret = process.env.JWT_SECRET
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as any
        req.user = {
          id: decoded.id,
          email: decoded.email,
          userType: decoded.userType
        }
      }
    } catch (error) {
      // Ignore token errors in optional auth
      console.warn('Optional auth token error:', error)
    }
  }

  return await next()
}

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]): Middleware => {
  return async (req, next) => {
    if (!req.user) {
      throw new AuthenticationError('需要認證')
    }

    if (!allowedRoles.includes(req.user.userType)) {
      throw new AuthenticationError('權限不足')
    }

    return await next()
  }
}

// Request validation middleware
export const validateRequest = (schema: {
    body?: (data: unknown) => boolean
    params?: (data: unknown) => boolean
    query?: (data: unknown) => boolean
}): Middleware => {
  return async (req, next) => {
    const errors: Record<string, string> = {}

    if (schema.body && req.body && !schema.body(req.body)) {
      errors.body = '請求體格式錯誤'
    }

    if (schema.params && req.params && !schema.params(req.params)) {
      errors.params = '路徑參數格式錯誤'
    }

    if (schema.query && req.query && !schema.query(req.query)) {
      errors.query = '查詢參數格式錯誤'
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('請求驗證失敗', errors)
    }

    return await next()
  }
}

// Rate limiting middleware (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const rateLimitMiddleware = (maxRequests = 100, windowMs = 60000): Middleware => {
  return async (req, next) => {
    const clientId = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    const clientData = requestCounts.get(clientId as string)

    if (!clientData || clientData.resetTime < windowStart) {
      requestCounts.set(clientId as string, { count: 1, resetTime: now + windowMs })
    } else {
      clientData.count++
      if (clientData.count > maxRequests) {
        throw new ValidationError('請求過於頻繁，請稍後再試')
      }
    }

    return await next()
  }
}
