/**
 * User Instructor Application API - 用戶講師申請
 * GET /api/v1/users/[userId]/instructor-application - 獲取用戶的講師申請
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { userId: string }
}

async function handleGet(context: Context): Promise<Response> {
  const { request, params, env } = context
  const userId = parseInt(params.userId)
  
  if (isNaN(userId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的用戶 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 只能查看自己的申請或管理員可以查看
  if (payload.userId !== userId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此用戶的講師申請')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        ia.*,
        u.first_name,
        u.last_name,
        u.email
      FROM instructor_applications ia
      LEFT JOIN users u ON ia.user_id = u.id
      WHERE ia.user_id = ${userId}
      ORDER BY ia.created_at DESC
      LIMIT 1
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '講師申請不存在')
    }

    const application = result[0]
    return createSuccessResponse({
      id: application.id,
      userId: application.user_id,
      bio: application.bio,
      expertise: application.expertise,
      experience: application.experience,
      status: application.status,
      reviewedBy: application.reviewed_by,
      reviewedAt: application.reviewed_at,
      reviewNotes: application.review_notes,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
      user: {
        firstName: application.first_name,
        lastName: application.last_name,
        email: application.email
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Instructor Application')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Instructor Application')
