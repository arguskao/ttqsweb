import { registerUser, loginUser, type RegisterData, type LoginData } from '../services/auth'

import { requireAuth } from './auth-middleware'
import { ValidationError } from './errors'
import type { RouteHandler } from './types'

// Register endpoint
export const registerHandler: RouteHandler = async (req) => {
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

    return {
      success: true,
      data: {
        user: result.user,
        token: result.token
      }
    }
  } catch (error) {
    throw error
  }
}

// Login endpoint
export const loginHandler: RouteHandler = async (req) => {
  try {
    const body = req.body as LoginData

    // Validate required fields
    if (!body) {
      throw new ValidationError('請求內容不能為空')
    }

    const { email, password } = body

    // Login user
    const result = await loginUser({ email, password })

    return {
      success: true,
      data: {
        user: result.user,
        token: result.token
      }
    }
  } catch (error) {
    throw error
  }
}

// Get current user profile
export const profileHandler: RouteHandler = async (req) => {
  try {
    // User is already attached to request by auth middleware
    if (!req.user) {
      throw new ValidationError('用戶資訊不存在')
    }

    return {
      success: true,
      data: req.user
    }
  } catch (error) {
    throw error
  }
}

// Logout endpoint (client-side token removal)
export const logoutHandler: RouteHandler = async (req) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // This endpoint can be used for logging purposes or token blacklisting

    return {
      success: true,
      data: {
        message: '登出成功'
      }
    }
  } catch (error) {
    throw error
  }
}

// Update user profile
export const updateProfileHandler: RouteHandler = async (req) => {
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
  router.get('/api/v1/auth/profile', profileHandler, [requireAuth])
  router.put('/api/v1/auth/profile', updateProfileHandler, [requireAuth])
  router.put('/api/v1/users/profile', updateProfileHandler, [requireAuth])
}
