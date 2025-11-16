/**
 * Course Reviews API - 課程評價管理
 * GET /api/v1/courses/[id]/reviews - 獲取課程評價列表
 * POST /api/v1/courses/[id]/reviews - 創建課程評價
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const courseId = parseInt(params.id)
  
  if (isNaN(courseId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的課程 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const reviews = await sql`
      SELECT 
        cr.*,
        u.first_name,
        u.last_name
      FROM course_reviews cr
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.course_id = ${courseId}
      ORDER BY cr.created_at DESC
    `

    const formattedReviews = reviews.map((review: any) => ({
      id: review.id,
      courseId: review.course_id,
      userId: review.user_id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      user: {
        firstName: review.first_name,
        lastName: review.last_name
      }
    }))

    // 計算平均評分
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0

    return createSuccessResponse({
      reviews: formattedReviews,
      meta: {
        total: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Course Reviews')
  }
}

async function handlePost(context: Context): Promise<Response> {
  const { request, params, env } = context
  const courseId = parseInt(params.id)
  
  if (isNaN(courseId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的課程 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '評分必須在 1-5 之間')
    }

    // 檢查課程是否存在
    const course = await sql`
      SELECT * FROM courses WHERE id = ${courseId}
    `
    if (course.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '課程不存在')
    }

    // 檢查是否已經評價過
    const existing = await sql`
      SELECT * FROM course_reviews 
      WHERE course_id = ${courseId} AND user_id = ${payload.userId}
    `
    if (existing.length > 0) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '您已經評價過此課程')
    }

    // 檢查是否已報名課程
    const enrollment = await sql`
      SELECT * FROM enrollments 
      WHERE course_id = ${courseId} AND user_id = ${payload.userId}
    `
    if (enrollment.length === 0) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '只有報名學員才能評價課程')
    }

    const result = await sql`
      INSERT INTO course_reviews (
        course_id,
        user_id,
        rating,
        comment,
        created_at,
        updated_at
      ) VALUES (
        ${courseId},
        ${payload.userId},
        ${body.rating},
        ${body.comment || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const review = result[0]
    return createSuccessResponse({
      id: review.id,
      courseId: review.course_id,
      userId: review.user_id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Create Course Review')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Course Reviews')
export const onRequestPost = withErrorHandler(handlePost, 'Create Course Review')
