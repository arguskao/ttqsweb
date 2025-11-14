/**
 * 用戶課程報名記錄 API 端點 - 使用統一錯誤處理
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
} from '../../../utils/error-handler'

interface Env {
  DATABASE_URL: string
}

interface Context {
  request: Request
  env: Env
}

async function handleGetEnrollments(context: Context): Promise<Response> {
  const { request, env } = context

  console.log('[User Enrollments] 查詢用戶報名記錄')

  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  const userId = payload.userId

  console.log('[User Enrollments] 用戶 ID:', userId)

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 查詢用戶的所有報名記錄，包含課程信息
    const enrollments = await sql`
      SELECT 
        ce.id,
        ce.user_id,
        ce.course_id,
        ce.enrollment_date,
        ce.completion_date,
        ce.progress_percentage,
        ce.final_score,
        ce.status,
        c.title as course_title,
        c.course_type,
        c.duration_hours
      FROM course_enrollments ce
      LEFT JOIN courses c ON ce.course_id = c.id
      WHERE ce.user_id = ${userId}
      ORDER BY ce.enrollment_date DESC
    `

    console.log('[User Enrollments] 找到報名記錄:', enrollments.length)

    // 轉換為前端期望的格式
    const formattedEnrollments = enrollments.map((enrollment: any) => ({
      id: enrollment.id,
      userId: enrollment.user_id,
      courseId: enrollment.course_id,
      courseTitle: enrollment.course_title,
      courseType: enrollment.course_type,
      durationHours: enrollment.duration_hours,
      enrollmentDate: enrollment.enrollment_date,
      completionDate: enrollment.completion_date,
      progressPercentage: enrollment.progress_percentage || 0,
      finalScore: enrollment.final_score,
      status: enrollment.status || 'enrolled'
    }))

    return createSuccessResponse(formattedEnrollments)

  } catch (dbError) {
    handleDatabaseError(dbError, 'User Enrollments Query')
  }
}

// 導出處理函數（自動包含錯誤處理和 CORS）
export const onRequestGet = withErrorHandler(handleGetEnrollments, 'User Enrollments')

// 處理 OPTIONS 請求（CORS 預檢）
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}
