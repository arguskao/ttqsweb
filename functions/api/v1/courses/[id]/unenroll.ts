/**
 * Course Unenroll API - 取消課程報名
 * DELETE /api/v1/courses/[id]/unenroll - 取消報名課程
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handleDelete(context: Context): Promise<Response> {
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
    // 檢查是否已報名
    const enrollment = await sql`
      SELECT * FROM enrollments 
      WHERE course_id = ${courseId} AND user_id = ${payload.userId}
    `
    if (enrollment.length === 0) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '您尚未報名此課程')
    }

    // 檢查課程狀態
    const course = await sql`
      SELECT * FROM courses WHERE id = ${courseId}
    `
    if (course[0].status === 'completed') {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '已完成的課程無法取消報名')
    }

    // 取消報名
    await sql`
      DELETE FROM enrollments 
      WHERE course_id = ${courseId} AND user_id = ${payload.userId}
    `

    return createSuccessResponse({ message: '已取消報名' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Unenroll Course')
  }
}

export const onRequestDelete = withErrorHandler(handleDelete, 'Unenroll Course')
