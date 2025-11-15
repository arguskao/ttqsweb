/**
 * User Job Applications API - 用戶的工作申請
 * GET /api/v1/users/[userId]/applications - 獲取用戶的工作申請列表
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { userId: string }
}

// GET - 獲取用戶的工作申請
async function handleGet(context: Context): Promise<Response> {
  const { request, params, env } = context
  const userId = parseInt(params.userId)
  
  if (isNaN(userId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的用戶 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 檢查權限：只能查看自己的申請或管理員
  if (payload.userId !== userId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此用戶的申請')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || null
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 計算總數
    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM job_applications
      WHERE user_id = ${userId}
        ${status ? sql`AND status = ${status}` : sql``}
    `
    const total = parseInt(countResult[0]?.count || '0')

    // 獲取申請列表
    const applications = await sql`
      SELECT 
        ja.*,
        j.title as job_title,
        j.company_name,
        j.location,
        j.job_type,
        j.salary_min,
        j.salary_max
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = ${userId}
        ${status ? sql`AND ja.status = ${status}` : sql``}
      ORDER BY ja.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return createSuccessResponse({
      applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Applications')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Applications')
