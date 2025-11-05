import jwt from 'jsonwebtoken'

import { registerUser, loginUser, type RegisterData, type LoginData } from '../services/auth'

import { requireAuth } from './auth-middleware'
import { ValidationError } from './errors'
import { SessionManager, generateSecureToken } from './session-manager'
import type { RouteHandler } from './types'

// Register endpoint
export const registerHandler: RouteHandler = async req => {
  try {
    const body = req.body as RegisterData

    // Validate required fields
    if (!body) {
      throw new ValidationError('請求內容不能為空')
    }

    const { email, password, userType, firstName, lastName, phone } = body

    // Register user
    const result = await registerUser({
      email,
      password,
      userType,
      firstName,
      lastName,
      phone
    })

    // Create secure session
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    const sessionId = SessionManager.createSession(
      result.user.id,
      result.user.email,
      result.user.userType,
      ipAddress,
      userAgent
    )

    // Generate secure token with session
    const secureToken = generateSecureToken(
      {
        userId: result.user.id,
        email: result.user.email,
        userType: result.user.userType
      },
      sessionId
    )

    return {
      success: true,
      data: {
        user: result.user,
        token: secureToken,
        sessionId
      }
    }
  } catch (error) {
    throw error
  }
}

// Login endpoint
export const loginHandler: RouteHandler = async req => {
  try {
    const body = req.body as LoginData

    // Validate required fields
    if (!body) {
      throw new ValidationError('請求內容不能為空')
    }

    const { email, password } = body

    // Login user
    const result = await loginUser({ email, password })

    // Create secure session
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    const sessionId = SessionManager.createSession(
      result.user.id,
      result.user.email,
      result.user.userType,
      ipAddress,
      userAgent
    )

    // Generate secure token with session
    const secureToken = generateSecureToken(
      {
        userId: result.user.id,
        email: result.user.email,
        userType: result.user.userType
      },
      sessionId
    )

    return {
      success: true,
      data: {
        user: result.user,
        token: secureToken,
        sessionId
      }
    }
  } catch (error) {
    throw error
  }
}

// Get current user profile
export const profileHandler: RouteHandler = async req => {
  try {
    // User is already attached to request by auth middleware
    if (!req.user) {
      throw new ValidationError('用戶資訊不存在')
    }

    // 從資料庫獲取完整的用戶資訊（使用 Neon serverless driver）
    const { neon } = await import('@neondatabase/serverless')
    const DATABASE_URL = process.env.DATABASE_URL || ''
    const sql = neon(DATABASE_URL)

    const result = await sql`
      SELECT id, email, user_type, first_name, last_name, phone,
             created_at, updated_at, is_active
      FROM users
      WHERE id = ${req.user.id} AND is_active = true
    `

    if (result.length === 0) {
      throw new ValidationError('用戶不存在')
    }

    const user = result[0]

    if (!user) {
      throw new ValidationError('用戶資料不完整')
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          userType: user.user_type,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          isActive: user.is_active
        }
      }
    }
  } catch (error) {
    throw error
  }
}

// Logout endpoint
export const logoutHandler: RouteHandler = async req => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization ?? (req.headers.Authorization as string)

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

      try {
        // Verify token to get session info
        const secret = process.env.JWT_SECRET
        if (secret) {
          const payload = jwt.verify(token, secret) as any

          // Blacklist the token
          if (payload.tokenId) {
            SessionManager.blacklistToken(payload.tokenId, payload.exp * 1000)
          }

          // Invalidate session
          if (payload.sessionId) {
            SessionManager.invalidateSession(payload.sessionId)
          }
        }
      } catch (error) {
        // Token might be invalid, but we still want to return success
        console.warn('Logout with invalid token:', error)
      }
    }

    return {
      success: true,
      message: '登出成功'
    }
  } catch (error) {
    throw error
  }
}

// Update user profile
export const updateProfileHandler: RouteHandler = async req => {
  try {
    // User is already attached to request by auth middleware
    if (!req.user) {
      throw new ValidationError('用戶資訊不存在')
    }

    const body = req.body as Partial<{
      firstName: string
      lastName: string
      phone: string
    }>

    if (!body) {
      throw new ValidationError('請求內容不能為空')
    }

    // Validate at least one field is provided
    if (!body.firstName && !body.lastName && !body.phone) {
      throw new ValidationError('至少需要提供一個要更新的欄位')
    }

    // Import database connection
    const { getDatabase } = await import('../config/database')
    const db = await getDatabase()

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.firstName) {
      updates.push(`first_name = $${paramIndex++}`)
      values.push(body.firstName)
    }
    if (body.lastName) {
      updates.push(`last_name = $${paramIndex++}`)
      values.push(body.lastName)
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`)
      values.push(body.phone)
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP')

    // Add user ID as last parameter
    values.push(req.user.id)

    const query = `
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, email, user_type as "userType", first_name as "firstName",
                      last_name as "lastName", phone, created_at as "createdAt",
                      updated_at as "updatedAt", is_active as "isActive"
        `

    const result = await db.query(query, values)

    if (result.rows.length === 0) {
      throw new ValidationError('更新用戶資料失敗')
    }

    return {
      success: true,
      data: {
        user: result.rows[0]
      }
    }
  } catch (error) {
    throw error
  }
}

// Setup authentication routes
export const setupAuthRoutes = (router: any) => {
  // Public routes
  router.post('/api/v1/auth/register', registerHandler)
  router.post('/api/v1/auth/login', loginHandler)
  router.post('/api/v1/auth/logout', logoutHandler)

  // Protected routes
  router.get('/api/v1/auth/profile', requireAuth, profileHandler)
  router.put('/api/v1/auth/profile', requireAuth, updateProfileHandler)
  router.put('/api/v1/users/profile', requireAuth, updateProfileHandler)
}
