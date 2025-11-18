import jwt from 'jsonwebtoken'

import { AuthenticationError } from './errors'
import type { Middleware, ApiRequest } from './types'

// Authenticated request type
export interface AuthenticatedRequest extends ApiRequest {
  user: NonNullable<ApiRequest['user']>
}

// JWT token verification
const verifyToken = (token: string) => {
  // 只從環境變量讀取 JWT secret
  const secret = process.env.JWT_SECRET || (globalThis as any)?.env?.JWT_SECRET
  
  // 如果沒有配置 secret，拋出錯誤（不要使用硬編碼的後備值）
  if (!secret) {
    console.error('[verifyToken] JWT_SECRET not configured in environment variables')
    throw new AuthenticationError('服務器配置錯誤：JWT Secret 未設置')
  }

  try {
    const result = jwt.verify(token, secret) as any
    console.log('[verifyToken] Token verified successfully')
    return result
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[verifyToken] Token expired')
      throw new AuthenticationError('認證令牌已過期，請重新登入')
    }
    
    console.log('[verifyToken] Token verification failed:', error instanceof Error ? error.message : 'Unknown')
    throw new AuthenticationError('認證令牌無效或已過期')
  }
}

// Authentication middleware
export const authMiddleware: Middleware = async (req, next) => {
  try {
    console.log('[authMiddleware] Starting authentication')

    // Get token from Authorization header
    const authHeader = req.headers.authorization || (req.headers.Authorization as string)

    console.log('[authMiddleware] authHeader:', authHeader ? 'present' : 'missing')

    if (!authHeader) {
      throw new AuthenticationError('未提供認證令牌')
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

    if (!token) {
      throw new AuthenticationError('認證令牌格式錯誤')
    }

    console.log('[authMiddleware] Token extracted, verifying...')

    // Verify JWT token
    const payload = verifyToken(token)

    console.log('[authMiddleware] Token verified, payload:', payload)

    // Get user info from token payload
    const userId = payload.userId || payload.id
    if (!userId) {
      throw new AuthenticationError('令牌中缺少用戶ID')
    }

    // 直接使用 token 中的用戶信息（避免在 Cloudflare Workers 中查詢資料庫）
    // Token 只包含基本識別資訊：userId, email, userType
    // 詳細資訊（姓名、電話等）需要時從 /api/v1/auth/profile 獲取
    req.user = {
      id: userId,
      email: payload.email || '',
      userType: payload.userType || 'job_seeker',
      firstName: '',  // Token 中不包含姓名，避免中文編碼問題
      lastName: '',
      phone: undefined,
      isActive: true,
      // 兼容舊的屬性名稱
      user_type: payload.userType || 'job_seeker',
      first_name: '',
      last_name: '',
      is_active: true
    }

    console.log('[authMiddleware] req.user set:', req.user)

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
    const authHeader = req.headers.authorization || (req.headers.Authorization as string)

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

      if (token) {
        const payload = verifyToken(token)
        const userId = payload.userId || payload.id

        if (userId) {
          // 只從 token 讀取基本資訊，避免資料庫查詢
          req.user = {
            id: userId,
            email: payload.email || '',
            userType: payload.userType || 'job_seeker',
            firstName: '',  // Token 中不包含姓名
            lastName: '',
            phone: undefined,
            isActive: true,
            // 兼容舊的屬性名稱
            user_type: payload.userType || 'job_seeker',
            first_name: '',
            last_name: '',
            is_active: true
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

// Role-based authorization middleware (includes authentication)
export const requireRole = (allowedRoles: string[]): Middleware => {
  return async (req, next) => {
    // 先執行認證檢查
    if (!req.user) {
      // 嘗試從 token 獲取用戶信息
      try {
        const authHeader = req.headers.authorization || (req.headers.Authorization as string)

        if (!authHeader) {
          throw new AuthenticationError('需要登入才能訪問此資源')
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

        if (!token) {
          throw new AuthenticationError('認證令牌格式錯誤')
        }

        const payload = verifyToken(token)
        const userId = payload.userId || payload.id

        if (!userId) {
          throw new AuthenticationError('令牌中缺少用戶ID')
        }

        // 設置用戶信息
        req.user = {
          id: userId,
          email: payload.email || '',
          userType: payload.userType || 'job_seeker',
          firstName: '',  // Token 中不包含姓名
          lastName: '',
          phone: undefined,
          isActive: true,
          user_type: payload.userType || 'job_seeker',
          first_name: '',
          last_name: '',
          is_active: true
        }
      } catch (error) {
        throw new AuthenticationError('需要登入才能訪問此資源')
      }
    }

    if (!allowedRoles.includes(req.user.userType || req.user.user_type)) {
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

// Admin role requirement
export function requireAdmin(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AuthenticationError('需要登入才能訪問此資源')
  }

  if (req.user.userType !== 'admin') {
    throw new AuthenticationError('需要管理員權限才能訪問此資源')
  }

  return req.user
}

// Higher role requirement (for role hierarchy)
export function requireHigherRole(req: AuthenticatedRequest, targetUserType: string) {
  if (!req.user) {
    throw new AuthenticationError('需要登入才能訪問此資源')
  }

  const roleHierarchy = ['job_seeker', 'employer', 'instructor', 'admin']
  const currentUserRoleIndex = roleHierarchy.indexOf(req.user.userType)
  const targetRoleIndex = roleHierarchy.indexOf(targetUserType)

  if (currentUserRoleIndex === -1 || targetRoleIndex === -1) {
    throw new AuthenticationError('無效的用戶角色')
  }

  if (currentUserRoleIndex <= targetRoleIndex) {
    throw new AuthenticationError('沒有足夠權限修改此用戶')
  }

  return req.user
}
