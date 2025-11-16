/**
 * Course Review Detail API - 課程評價詳情
 * PUT /api/v1/courses/reviews/[id] - 更新評價
 * DELETE /api/v1/courses/reviews/[id] - 刪除評價
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const reviewId = parseInt(params.id)
  
  if (isNaN(reviewId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的評價 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    if (body.rating && (body.rating < 1 || body.rating > 5)) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '評分必須在 1-5 之間')
    }

    const existing = await sql`
      SELECT * FROM course_reviews WHERE id = ${reviewId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '評價不存在')
    }

    if (existing[0].user_id !== payload.userId) {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此評價')
    }

    const result = await sql`
      UPDATE course_reviews SET
        rating = COALESCE(${body.rating}, rating),
        comment = COALESCE(${body.comment}, comment),
        updated_at = NOW()
      WHERE id = ${reviewId}
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
    handleDatabaseError(dbError, 'Update Course Review')
  }
}

async function handleDelete(context: Context): Promise<Response> {
  const { request, params, env } = context
  const reviewId = parseInt(params.id)
  
  if (isNaN(reviewId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的評價 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const existing = await sql`
      SELECT * FROM course_reviews WHERE id = ${reviewId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '評價不存在')
    }

    if (existing[0].user_id !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限刪除此評價')
    }

    await sql`DELETE FROM course_reviews WHERE id = ${reviewId}`

    return createSuccessResponse({ message: '評價已刪除' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Delete Course Review')
  }
}

export const onRequestPut = withErrorHandler(handlePut, 'Update Course Review')
export const onRequestDelete = withErrorHandler(handleDelete, 'Delete Course Review')
