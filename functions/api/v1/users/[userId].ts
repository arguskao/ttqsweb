/**
 * User Detail API - 用戶詳情
 * GET /api/v1/users/[userId] - 獲取用戶詳情
 * PUT /api/v1/users/[userId] - 更新用戶資料
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { userId: string }
}

// GET - 獲取用戶詳情
async function handleGet(context: Context): Promise<Response> {
  const { request, params, env } = context
  const userId = parseInt(params.userId)
  
  if (isNaN(userId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的用戶 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 檢查權限：只能查看自己的資料或管理員
  if (payload.userId !== userId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此用戶資料')
  }

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
        bio,
        avatar_url,
        created_at,
        updated_at
      FROM users
      WHERE id = ${userId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '用戶不存在')
    }

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Detail')
  }
}

// PUT - 更新用戶資料
async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const userId = parseInt(params.userId)
  
  if (isNaN(userId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的用戶 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 檢查權限：只能修改自己的資料或管理員
  if (payload.userId !== userId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此用戶資料')
  }

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
        bio = COALESCE(${body.bio}, bio),
        avatar_url = COALESCE(${body.avatarUrl}, avatar_url),
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, first_name, last_name, phone, user_type, bio, avatar_url
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '用戶不存在')
    }

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update User')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update User')
