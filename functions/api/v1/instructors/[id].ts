/**
 * Instructor Detail API - 講師詳情
 * GET /api/v1/instructors/[id] - 獲取講師詳情
 * PUT /api/v1/instructors/[id] - 更新講師資料
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// GET - 獲取講師詳情
async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const instructorId = parseInt(params.id)
  
  if (isNaN(instructorId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的講師 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 獲取講師基本信息
    const instructor = await sql`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.bio,
        u.avatar_url,
        u.created_at,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT e.id) as student_count,
        AVG(cr.rating) as average_rating
      FROM users u
      LEFT JOIN courses c ON u.id = c.instructor_id AND c.is_active = true
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN course_reviews cr ON c.id = cr.course_id
      WHERE u.id = ${instructorId} AND u.user_type = 'instructor'
      GROUP BY u.id
    `

    if (instructor.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '講師不存在')
    }

    // 獲取講師的課程
    const courses = await sql`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.duration,
        c.level,
        COUNT(DISTINCT e.id) as enrollment_count,
        AVG(cr.rating) as average_rating
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN course_reviews cr ON c.id = cr.course_id
      WHERE c.instructor_id = ${instructorId} AND c.is_active = true
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `

    return createSuccessResponse({
      ...instructor[0],
      courses
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Instructor Detail')
  }
}

// PUT - 更新講師資料
async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const instructorId = parseInt(params.id)
  
  if (isNaN(instructorId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的講師 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 檢查權限：只能修改自己的資料或管理員
  if (payload.userId !== instructorId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此講師資料')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    // 更新講師資料
    const result = await sql`
      UPDATE users SET
        first_name = COALESCE(${body.firstName}, first_name),
        last_name = COALESCE(${body.lastName}, last_name),
        phone = COALESCE(${body.phone}, phone),
        bio = COALESCE(${body.bio}, bio),
        avatar_url = COALESCE(${body.avatarUrl}, avatar_url),
        updated_at = NOW()
      WHERE id = ${instructorId} AND user_type = 'instructor'
      RETURNING id, first_name, last_name, email, phone, bio, avatar_url
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '講師不存在')
    }

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Instructor')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Instructor Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update Instructor')
