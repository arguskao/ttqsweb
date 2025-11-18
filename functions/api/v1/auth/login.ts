/**
 * 登入端點 - 使用統一錯誤處理
 */
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateDatabaseUrl,
  handleDatabaseError
} from '../../../utils/error-handler'

interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
}

interface Context {
  request: Request
  env: Env
}

async function handleLogin(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證請求方法
  if (request.method !== 'POST') {
    throw new ApiError(ErrorCode.METHOD_NOT_ALLOWED, '只允許 POST 請求')
  }

  // 解析請求體
  const body = await request.json() as { email?: string; password?: string }
  const { email, password } = body

  // 驗證必填欄位
  if (!email || !password) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '請提供電子郵件和密碼')
  }

  // 驗證 email 格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '電子郵件格式不正確')
  }

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)

  // 連接數據庫
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 查詢用戶
    const result = await sql`
      SELECT id, email, password_hash, user_type, first_name, last_name, phone,
             created_at, updated_at, is_active
      FROM users
      WHERE email = ${email} AND is_active = true
      LIMIT 1
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.UNAUTHORIZED, '電子郵件或密碼不正確')
    }

    const user = result[0]

    // 驗證密碼 - 支援 bcrypt 和舊的 SHA-256 格式
    let isPasswordValid = false

    if (user.password_hash.startsWith('$2')) {
      // bcrypt 格式
      const bcrypt = await import('bcryptjs')
      isPasswordValid = await bcrypt.compare(password, user.password_hash)
    } else if (user.password_hash.length === 64 && /^[a-f0-9]+$/.test(user.password_hash)) {
      // SHA-256 格式（舊格式）- 使用 Web Crypto API
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      isPasswordValid = sha256Hash === user.password_hash
    } else {
      console.error('[Login] 未知的密碼格式:', {
        hashLength: user.password_hash.length,
        hashPrefix: user.password_hash.substring(0, 10)
      })
      throw new ApiError(ErrorCode.INTERNAL_ERROR, '密碼驗證失敗')
    }

    if (!isPasswordValid) {
      throw new ApiError(ErrorCode.UNAUTHORIZED, '電子郵件或密碼不正確')
    }

    // 生成 JWT token
    const jwt = await import('jsonwebtoken')
    const secret = env.JWT_SECRET

    if (!secret) {
      throw new ApiError(ErrorCode.INTERNAL_ERROR, 'JWT_SECRET 未設置')
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type
      },
      secret,
      {
        expiresIn: '24h',
        issuer: 'pharmacy-assistant-academy',
        audience: 'pharmacy-assistant-academy-users'
      }
    )

    // 返回成功響應
    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      tokens: {
        accessToken: token,
        refreshToken: token
      }
    }, '登入成功')

  } catch (dbError) {
    handleDatabaseError(dbError, 'User Login')
  }
}

// 導出處理函數（自動包含錯誤處理和 CORS）
export const onRequestPost = withErrorHandler(handleLogin, 'Auth Login')

// OPTIONS 請求處理
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
