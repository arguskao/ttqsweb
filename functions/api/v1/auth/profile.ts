/**
 * Auth Profile API - 用戶個人資料
 * GET /api/v1/auth/profile - 獲取當前用戶資料
 * PUT /api/v1/auth/profile - 更新當前用戶資料
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取當前用戶資料
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        phone,
        user_type,
        created_at,
        updated_at
      FROM users
      WHERE id = ${payload.userId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '用戶不存在')
    }

    // 轉換欄位名稱為 camelCase
    const user = result[0]
    return createSuccessResponse({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      userType: user.user_type,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Profile')
  }
}

// PUT - 更新當前用戶資料
async function handlePut(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    // 更新用戶資料
    const result = await sql`
      UPDATE users SET
        first_name = COALESCE(${body.firstName}, first_name),
        last_name = COALESCE(${body.lastName}, last_name),
        phone = COALESCE(${body.phone}, phone),
        updated_at = NOW()
      WHERE id = ${payload.userId}
      RETURNING id, email, first_name, last_name, phone, user_type, created_at, updated_at
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '用戶不存在')
    }

    // 轉換欄位名稱為 camelCase
    const user = result[0]
    return createSuccessResponse({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      userType: user.user_type,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Profile')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Profile')
export const onRequestPut = withErrorHandler(handlePut, 'Update Profile')
