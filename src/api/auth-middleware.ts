import { verifyToken, getUserById } from '../services/auth'

import { AuthenticationError } from './errors'
import type { Middleware } from './types'

// Authentication middleware
export const authMiddleware: Middleware = async (req, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization as string

    if (!authHeader) {
      throw new AuthenticationError('未提供認證令牌')
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader

    if (!token) {
      throw new AuthenticationError('認證令牌格式錯誤')
    }

    // Verify JWT token
    const payload = verifyToken(token)

    // Get user details from database
    const user = await getUserById(payload.userId)

    if (!user) {
      throw new AuthenticationError('用戶不存在或已被停用')
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      userType: user.userType
    }

    // Continue to next middleware or route handler
    return await next()
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error
    }

    // Handle JWT verification errors
    throw new AuthenticationError('認證令牌無效或已過期')
  }
}

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuthMiddleware: Middleware = async (req, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization as string

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader

      if (token) {
        const payload = verifyToken(token)
        const user = await getUserById(payload.userId)

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            userType: user.userType
          }
        }
      }
    }
  } catch (error) {
    // Silently ignore authentication errors in optional middleware
    console.warn('Optional auth middleware error:', error)
  }

  return await next()
}

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]): Middleware => {
  return async (req, next) => {
    if (!req.user) {
      throw new AuthenticationError('需要登入才能訪問此資源')
    }

    if (!allowedRoles.includes(req.user.userType)) {
      throw new AuthenticationError('沒有權限訪問此資源')
    }

    return await next()
  }
}

// Convenience middleware for job seekers only
export const requireJobSeeker: Middleware = requireRole(['job_seeker'])

// Convenience middleware for employers only
export const requireEmployer: Middleware = requireRole(['employer'])

// Convenience middleware for any authenticated user
export const requireAuth: Middleware = authMiddleware
