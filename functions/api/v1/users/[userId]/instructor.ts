/**
 * User Instructor Profile API - 用戶講師資料
 * GET /api/v1/users/[userId]/instructor - 獲取用戶的講師資料
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

  // 只能查看自己的講師資料或管理員可以查看
  if (payload.userId !== userId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此用戶的講師資料')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        i.*,
        u.first_name,
        u.last_name,
        u.email
      FROM instructors i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.user_id = ${userId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '講師資料不存在')
    }

    const instructor = result[0]

    // 獲取經驗列表
    const experiences = await sql`
      SELECT * FROM experiences 
      WHERE instructor_id = ${instructor.id}
      ORDER BY start_date DESC
    `

    return createSuccessResponse({
      id: instructor.id,
      userId: instructor.user_id,
      bio: instructor.bio,
      expertise: instructor.expertise,
      rating: instructor.rating,
      totalStudents: instructor.total_students,
      totalCourses: instructor.total_courses,
      status: instructor.status,
      createdAt: instructor.created_at,
      updatedAt: instructor.updated_at,
      user: {
        firstName: instructor.first_name,
        lastName: instructor.last_name,
        email: instructor.email
      },
      experiences: experiences.map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        company: exp.company,
        startDate: exp.start_date,
        endDate: exp.end_date,
        description: exp.description
      }))
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Instructor Profile')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Instructor Profile')
