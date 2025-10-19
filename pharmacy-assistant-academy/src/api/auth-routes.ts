import type { RouteHandler } from './types'
import { ValidationError } from './errors'
import { registerUser, loginUser, type RegisterData, type LoginData } from '../services/auth'
import { requireAuth } from './auth-middleware'

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
            data: {
                user: req.user
            }
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

// Setup authentication routes
export const setupAuthRoutes = (router: any) => {
    // Public routes
    router.post('/api/v1/auth/register', registerHandler)
    router.post('/api/v1/auth/login', loginHandler)
    router.post('/api/v1/auth/logout', logoutHandler)

    // Protected routes
    router.get('/api/v1/auth/profile', profileHandler, [requireAuth])
}