/**
 * Instructor Profile API - 當前講師的資料
 * GET /api/v1/instructors/profile - 獲取當前講師的資料
 * PUT /api/v1/instructors/profile - 更新當前講師的資料
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取當前講師的資料
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 查詢講師申請記錄
    const result = await sql`
      SELECT 
        ia.id,
        ia.user_id,
        ia.bio,
        ia.qualifications,
        ia.specialization,
        ia.years_of_experience,
        ia.status,
        ia.is_active,
        ia.average_rating,
        ia.total_ratings,
        ia.created_at,
        ia.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM instructor_applications ia
      JOIN users u ON u.id = ia.user_id
      WHERE ia.user_id = ${payload.userId} AND ia.status = 'approved'
      ORDER BY ia.created_at DESC
      LIMIT 1
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '找不到講師資料')
    }

    // 轉換為 camelCase
    const instructor = result[0]
    return createSuccessResponse({
      id: instructor.id,
      userId: instructor.user_id,
      bio: instructor.bio,
      qualifications: instructor.qualifications,
      specialization: instructor.specialization,
      yearsOfExperience: instructor.years_of_experience,
      status: instructor.status,
      isActive: instructor.is_active,
      averageRating: instructor.average_rating,
      totalRatings: instructor.total_ratings,
      createdAt: instructor.created_at,
      updatedAt: instructor.updated_at,
      firstName: instructor.first_name,
      lastName: instructor.last_name,
      email: instructor.email,
      phone: instructor.phone
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Instructor Profile')
  }
}

// PUT - 更新當前講師的資料
async function handlePut(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    // 更新講師資料
    const result = await sql`
      UPDATE instructor_applications SET
        bio = COALESCE(${body.bio}, bio),
        qualifications = COALESCE(${body.qualifications}, qualifications),
        specialization = COALESCE(${body.specialization}, specialization),
        years_of_experience = COALESCE(${body.yearsOfExperience}, years_of_experience),
        updated_at = NOW()
      WHERE user_id = ${payload.userId} AND status = 'approved'
      RETURNING *
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '找不到講師資料')
    }

    // 轉換為 camelCase
    const instructor = result[0]
    return createSuccessResponse({
      id: instructor.id,
      userId: instructor.user_id,
      bio: instructor.bio,
      qualifications: instructor.qualifications,
      specialization: instructor.specialization,
      yearsOfExperience: instructor.years_of_experience,
      status: instructor.status,
      isActive: instructor.is_active,
      averageRating: instructor.average_rating,
      totalRatings: instructor.total_ratings,
      createdAt: instructor.created_at,
      updatedAt: instructor.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Instructor Profile')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Instructor Profile')
export const onRequestPut = withErrorHandler(handlePut, 'Update Instructor Profile')
