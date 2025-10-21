import { registerUser, loginUser, type RegisterData, type LoginData } from '../services/auth'
import { requireAuth } from './auth-middleware'
import { ValidationError } from './errors'
import type { RouteHandler } from './types'

// 導入安全中間件
import {
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  strictRateLimit,
  csrfProtection,
  generateCSRFToken
} from './rate-limit-middleware'
import { securityMiddleware, authSecurityMiddleware } from './security-middleware'

// 生成 CSRF token 端點
export const csrfTokenHandler: RouteHandler = async req => {
  try {
    const token = generateCSRFToken()

    // 將 token 存儲到 session 中
    if ((req as any).session) {
      ;(req as any).session.csrfToken = token
    }

    return {
      success: true,
      data: {
        csrfToken: token
      }
    }
  } catch (error) {
    throw error
  }
}

// 註冊端點 - 增強安全
export const registerHandler: RouteHandler = async req => {
  try {
    const body = req.body as RegisterData

    // 驗證請求內容
    if (!body) {
      throw new ValidationError('請求內容不能為空')
    }

    const { email, password, userType, firstName, lastName, phone, confirmPassword } = body

    // 驗證必填欄位
    if (!email || !password || !userType || !firstName || !lastName) {
      throw new ValidationError('請填寫所有必填欄位')
    }

    // 驗證密碼確認
    if (password !== confirmPassword) {
      throw new ValidationError('密碼確認不一致')
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('請輸入有效的電子郵件地址')
    }

    // 驗證密碼強度
    if (password.length < 8) {
      throw new ValidationError('密碼至少需要8個字符')
    }

    // 驗證用戶類型
    if (!['job_seeker', 'employer'].includes(userType)) {
      throw new ValidationError('無效的用戶類型')
    }

    // 註冊用戶
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
        tokens: {
          accessToken: result.token,
          refreshToken: result.refreshToken || '',
          expiresIn: result.expiresIn || 3600
        }
      }
    }
  } catch (error) {
    throw error
  }
}

// 登入端點 - 增強安全
export const loginHandler: RouteHandler = async req => {
  try {
    const body = req.body as LoginData

    // 驗證請求內容
    if (!body) {
      throw new ValidationError('請求內容不能為空')
    }

    const { email, password } = body

    // 驗證必填欄位
    if (!email || !password) {
      throw new ValidationError('請填寫電子郵件和密碼')
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('請輸入有效的電子郵件地址')
    }

    // 登入用戶
    const result = await loginUser({ email, password })

    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.token,
          refreshToken: result.refreshToken || '',
          expiresIn: result.expiresIn || 3600
        }
      }
    }
  } catch (error) {
    throw error
  }
}

// Token 刷新端點
export const refreshTokenHandler: RouteHandler = async req => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new ValidationError('缺少 refresh token')
    }

    // 驗證 refresh token 並生成新的 access token
    // 這裡需要實現 refresh token 的驗證邏輯
    const result = await refreshAccessToken(refreshToken)

    return {
      success: true,
      data: {
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn
        }
      }
    }
  } catch (error) {
    throw error
  }
}

// 獲取當前用戶資料
export const profileHandler: RouteHandler = async req => {
  try {
    // 用戶已通過認證中間件附加到請求
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

// 登出端點
export const logoutHandler: RouteHandler = async req => {
  try {
    const { refreshToken } = req.body

    // 如果有 refresh token，嘗試撤銷它
    if (refreshToken) {
      await revokeRefreshToken(refreshToken)
    }

    return {
      success: true,
      data: {
        message: '登出成功'
      }
    }
  } catch (error) {
    // 即使撤銷失敗，也返回成功
    console.warn('Logout token revocation failed:', error)
    return {
      success: true,
      data: {
        message: '登出成功'
      }
    }
  }
}

// 更新用戶資料
export const updateProfileHandler: RouteHandler = async req => {
  try {
    // 用戶已通過認證中間件附加到請求
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

    // 驗證至少提供一個要更新的欄位
    if (!body.firstName && !body.lastName && !body.phone) {
      throw new ValidationError('至少需要提供一個要更新的欄位')
    }

    // 驗證電話號碼格式（如果提供）
    if (body.phone) {
      const phoneRegex = /^09\d{8}$/
      if (!phoneRegex.test(body.phone)) {
        throw new ValidationError('請輸入有效的台灣手機號碼')
      }
    }

    // 導入數據庫連接
    const { getDatabase } = await import('../config/database')
    const db = await getDatabase()

    // 動態構建更新查詢
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

    // 添加更新時間戳
    updates.push('updated_at = CURRENT_TIMESTAMP')

    // 添加用戶 ID 作為最後一個參數
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

// 密碼重置請求端點
export const passwordResetRequestHandler: RouteHandler = async req => {
  try {
    const { email } = req.body

    if (!email) {
      throw new ValidationError('請提供電子郵件地址')
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('請輸入有效的電子郵件地址')
    }

    // 發送密碼重置郵件
    await sendPasswordResetEmail(email)

    return {
      success: true,
      data: {
        message: '密碼重置郵件已發送'
      }
    }
  } catch (error) {
    throw error
  }
}

// 密碼重置端點
export const passwordResetHandler: RouteHandler = async req => {
  try {
    const { token, newPassword, confirmPassword } = req.body

    if (!token || !newPassword || !confirmPassword) {
      throw new ValidationError('請提供所有必要信息')
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError('密碼確認不一致')
    }

    if (newPassword.length < 8) {
      throw new ValidationError('密碼至少需要8個字符')
    }

    // 重置密碼
    await resetPassword(token, newPassword)

    return {
      success: true,
      data: {
        message: '密碼重置成功'
      }
    }
  } catch (error) {
    throw error
  }
}

// 輔助函數 - 刷新 access token
async function refreshAccessToken(refreshToken: string) {
  // 這裡需要實現 refresh token 的驗證和新的 access token 生成邏輯
  // 暫時返回模擬數據
  return {
    accessToken: 'new_access_token',
    refreshToken: 'new_refresh_token',
    expiresIn: 3600
  }
}

// 輔助函數 - 撤銷 refresh token
async function revokeRefreshToken(refreshToken: string) {
  // 這裡需要實現 refresh token 的撤銷邏輯
  console.log('Revoking refresh token:', refreshToken)
}

// 輔助函數 - 發送密碼重置郵件
async function sendPasswordResetEmail(email: string) {
  // 這裡需要實現郵件發送邏輯
  console.log('Sending password reset email to:', email)
}

// 輔助函數 - 重置密碼
async function resetPassword(token: string, newPassword: string) {
  // 這裡需要實現密碼重置邏輯
  console.log('Resetting password with token:', token)
}

// 設置認證路由
export const setupAuthRoutes = (router: any) => {
  // 公開路由 - 應用安全中間件
  router.get('/api/v1/auth/csrf-token', csrfTokenHandler, ...securityMiddleware)
  router.post(
    '/api/v1/auth/register',
    registerHandler,
    registerRateLimit,
    ...authSecurityMiddleware
  )
  router.post('/api/v1/auth/login', loginHandler, loginRateLimit, ...authSecurityMiddleware)
  router.post('/api/v1/auth/logout', logoutHandler, ...authSecurityMiddleware)
  router.post('/api/v1/auth/refresh', refreshTokenHandler, ...authSecurityMiddleware)
  router.post(
    '/api/v1/auth/password-reset-request',
    passwordResetRequestHandler,
    passwordResetRateLimit,
    ...authSecurityMiddleware
  )
  router.post(
    '/api/v1/auth/password-reset',
    passwordResetHandler,
    passwordResetRateLimit,
    ...authSecurityMiddleware
  )

  // 受保護的路由 - 應用嚴格安全中間件
  router.get(
    '/api/v1/auth/profile',
    profileHandler,
    requireAuth,
    strictRateLimit,
    ...authSecurityMiddleware
  )
  router.put(
    '/api/v1/auth/profile',
    updateProfileHandler,
    requireAuth,
    strictRateLimit,
    ...authSecurityMiddleware
  )
  router.put(
    '/api/v1/users/profile',
    updateProfileHandler,
    requireAuth,
    strictRateLimit,
    ...authSecurityMiddleware
  )
}
