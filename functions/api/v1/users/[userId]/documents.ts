/**
 * User Documents API - 用戶的文檔
 * GET /api/v1/users/[userId]/documents - 獲取用戶上傳的文檔列表
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { userId: string }
}

// GET - 獲取用戶的文檔
async function handleGet(context: Context): Promise<Response> {
  const { request, params, env } = context
  const userId = parseInt(params.userId)
  
  if (isNaN(userId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的用戶 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 檢查權限：只能查看自己的文檔或管理員
  if (payload.userId !== userId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此用戶的文檔')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category') || null
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 計算總數
    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM documents
      WHERE uploaded_by = ${userId}
        ${category ? sql`AND category = ${category}` : sql``}
    `
    const total = parseInt(countResult[0]?.count || '0')

    // 獲取文檔列表
    const documents = await sql`
      SELECT 
        id,
        title,
        description,
        file_url,
        file_type,
        file_size,
        category,
        download_count,
        is_active,
        created_at,
        updated_at
      FROM documents
      WHERE uploaded_by = ${userId}
        ${category ? sql`AND category = ${category}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return createSuccessResponse({
      documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Documents')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Documents')
