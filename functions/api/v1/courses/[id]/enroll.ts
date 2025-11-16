/**
 * 課程報名 API 端點 - 使用統一錯誤處理
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

async function handleEnrollCourse(context: Context): Promise<Response> {
  const { request, env, params } = context

  console.log('[Course Enroll] 課程報名, Course ID:', params.id)

  // 驗證課程 ID
  const courseId = parseInt(params.id, 10)
  if (isNaN(courseId)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的課程 ID')
  }

  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  const userId = payload.userId

  console.log('[Course Enroll] 用戶 ID:', userId)

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查課程是否存在
    const courses = await sql`
      SELECT * FROM courses 
      WHERE id = ${courseId}
    `

    if (courses.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '課程不存在')
    }

    const course = courses[0]
    console.log('[Course Enroll] 找到課程:', course.title)

    // 檢查用戶是否已經報名
    const existingEnrollments = await sql`
      SELECT * FROM course_enrollments 
      WHERE course_id = ${courseId} AND user_id = ${userId}
    `

    if (existingEnrollments.length > 0) {
      throw new ApiError(ErrorCode.ALREADY_EXISTS, '您已經報名過此課程')
    }

    // 創建報名記錄
    const enrollment = await sql`
      INSERT INTO course_enrollments (
        course_id, 
        user_id, 
        enrollment_date, 
        status,
        progress_percentage
      ) VALUES (
        ${courseId},
        ${userId},
        NOW(),
        'enrolled',
        0
      )
      RETURNING *
    `

    console.log('[Course Enroll] 報名成功:', enrollment[0])

    return createSuccessResponse(
      {
        enrollment: enrollment[0]
      },
      '課程報名成功',
      201
    )

  } catch (dbError) {
    handleDatabaseError(dbError, 'Course Enrollment')
  }
}

// 導出處理函數（自動包含錯誤處理和 CORS）
export const onRequestPost = withErrorHandler(handleEnrollCourse, 'Course Enroll')

// OPTIONS 請求處理
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
