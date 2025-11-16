/**
 * User Instructor Profile API - 用戶的講師資料
 * GET /api/v1/users/[userId]/instructor - 獲取用戶的講師資料
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { userId: string }
}

// GET - 獲取用戶的講師資料
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
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此用戶的講師資料')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查用戶是否為講師
    const user = await sql`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        phone,
        user_type,
        bio,
        avatar_url
      FROM users
      WHERE id = ${userId} AND user_type = 'instructor'
    `

    if (user.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '用戶不是講師或不存在')
    }

    // 獲取講師統計
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT e.id) as student_count
      FROM users u
      LEFT JOIN courses c ON u.id = c.instructor_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE u.id = ${userId}
      GROUP BY u.id
    `

    // 獲取最近的課程
    const recentCourses = await sql`
      SELECT 
        id,
        title,
        description,
        thumbnail_url,
        duration,
        level,
        created_at
      FROM courses
      WHERE instructor_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `

    return createSuccessResponse({
      ...user[0],
      stats: stats[0] || {
        course_count: 0,
        student_count: 0
      },
      recentCourses
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Instructor Profile')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Instructor Profile')
