/**
 * 註冊端點 - 使用統一錯誤處理
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

async function handleRegister(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證請求方法
  if (request.method !== 'POST') {
    throw new ApiError(ErrorCode.METHOD_NOT_ALLOWED, '只允許 POST 請求')
  }

  // 解析請求體
  const body = await request.json() as {
    email?: string
    password?: string
    userType?: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  const { email, password, userType, firstName, lastName, phone } = body

  // 驗證必填欄位
  if (!email || !password || !userType || !firstName || !lastName) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '請提供所有必填欄位')
  }

  // 驗證 email 格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '電子郵件格式不正確')
  }

  // 驗證密碼強度
  if (password.length < 8) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '密碼必須至少 8 個字符')
  }

  // 驗證用戶類型
  const validUserTypes = ['admin', 'instructor', 'employer', 'job_seeker']
  if (!validUserTypes.includes(userType)) {
    throw new ApiError(
      ErrorCode.INVALID_INPUT,
      '用戶類型必須是管理員、講師、雇主或求職者'
    )
  }

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查用戶是否已存在
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `

    if (existingUser.length > 0) {
      throw new ApiError(ErrorCode.ALREADY_EXISTS, '此電子郵件已被註冊')
    }

    // 加密密碼
    const bcrypt = await import('bcryptjs')
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 插入新用戶
    const result = await sql`
      INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
      VALUES (${email}, ${passwordHash}, ${userType}, ${firstName}, ${lastName}, ${phone || null})
      RETURNING id, email, user_type, first_name, last_name, phone,
                created_at, updated_at, is_active
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.DB_ERROR, '創建用戶失敗')
    }

    const user = result[0]

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
    return createSuccessResponse(
      {
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
      },
      '註冊成功',
      201
    )

  } catch (dbError) {
    handleDatabaseError(dbError, 'User Registration')
  }
}

// 導出處理函數（自動包含錯誤處理和 CORS）
export const onRequestPost = withErrorHandler(handleRegister, 'Auth Register')

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
