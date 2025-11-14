/**
 * 課程學習進度 API 端點 - 使用統一錯誤處理
 */
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateToken,
  parseJwtToken,
  validateDatabaseUrl,
  handleDatabaseError
} from '../../../../utils/error-handler'

interface Env {
  DATABASE_URL: string
}

interface Context {
  request: Request
  env: Env
  params: {
    id: string
  }
}

async function handleGetProgress(context: Context): Promise<Response> {
  const { request, env, params } = context

  console.log('[Course Progress] 查詢學習進度, Course ID:', params.id)

  // 驗證課程 ID
  const courseId = parseInt(params.id, 10)
  if (isNaN(courseId)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的課程 ID')
  }

  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  const userId = payload.userId

  console.log('[Course Progress] 用戶 ID:', userId)

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 查詢用戶的課程報名記錄
    const enrollments = await sql`
      SELECT 
        ce.*,
        c.title as course_title,
        c.description as course_description
      FROM course_enrollments ce
      JOIN courses c ON ce.course_id = c.id
      WHERE ce.course_id = ${courseId} AND ce.user_id = ${userId}
    `

    if (enrollments.length === 0) {
      // 若未報名，回傳課程基本資料與 0% 進度
      const courses = await sql`
        SELECT id, title, description FROM courses WHERE id = ${courseId}
      `

      if (courses.length === 0) {
        throw new ApiError(ErrorCode.NOT_FOUND, '課程不存在')
      }

      const course = courses[0]

      return createSuccessResponse({
        id: null,
        user_id: userId,
        course_id: course.id,
        course_title: course.title,
        course_description: course.description,
        enrollment_date: null,
        completion_date: null,
        progress_percentage: 0,
        final_score: null,
        status: 'not_enrolled'
      })
    }

    const enrollment = enrollments[0]
    console.log('[Course Progress] 找到報名記錄:', enrollment.id)

    return createSuccessResponse(enrollment)

  } catch (dbError) {
    handleDatabaseError(dbError, 'Course Progress Query')
  }
}

// 導出處理函數
export const onRequestGet = withErrorHandler(handleGetProgress, 'Course Progress')

// OPTIONS 請求處理
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}
