/**
 * 課程報名狀態更新 API
 * 處理 /api/v1/courses/:courseId/enrollments/:enrollmentId 路由
 * 只有講師和管理員可以更新學員狀態
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
} from '../../../../../utils/error-handler'

interface Env {
  DATABASE_URL: string
}

interface Context {
  request: Request
  env: Env
  params: {
    courseId: string
    enrollmentId: string
  }
}

// PATCH - 更新報名狀態
async function handleUpdateEnrollment(context: Context): Promise<Response> {
  const { request, env, params } = context

  console.log('[Enrollment Update] 更新報名狀態, Enrollment ID:', params.enrollmentId)

  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  const userId = payload.userId
  const userType = payload.userType

  // 驗證 ID
  const courseId = parseInt(params.courseId, 10)
  const enrollmentId = parseInt(params.enrollmentId, 10)
  
  if (isNaN(courseId) || isNaN(enrollmentId)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的 ID')
  }

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查課程是否存在並驗證權限
    const courseResult = await sql`
      SELECT c.*, ia.user_id as instructor_user_id
      FROM courses c
      LEFT JOIN instructor_applications ia ON c.instructor_id = ia.id
      WHERE c.id = ${courseId}
    `

    if (courseResult.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '課程不存在')
    }

    const course = courseResult[0]

    // 權限檢查：只有課程講師或管理員可以更新
    if (userType !== 'admin' && course.instructor_user_id !== userId) {
      throw new ApiError(ErrorCode.FORBIDDEN, '您沒有權限更新此報名狀態')
    }

    // 解析請求體
    const body = await request.json() as any
    const { status } = body

    // 驗證狀態值
    const validStatuses = ['enrolled', 'in_progress', 'completed', 'dropped']
    if (!status || !validStatuses.includes(status)) {
      throw new ApiError(ErrorCode.INVALID_INPUT, '無效的狀態值')
    }

    // 更新報名狀態
    const updateResult = await sql`
      UPDATE course_enrollments
      SET 
        status = ${status},
        completion_date = ${status === 'completed' ? sql`NOW()` : null},
        progress_percentage = ${status === 'completed' ? 100 : sql`progress_percentage`}
      WHERE id = ${enrollmentId} AND course_id = ${courseId}
      RETURNING *
    `

    if (updateResult.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '報名記錄不存在')
    }

    console.log('[Enrollment Update] 更新成功, 新狀態:', status)

    return createSuccessResponse({
      id: updateResult[0].id,
      status: updateResult[0].status,
      completionDate: updateResult[0].completion_date,
      progressPercentage: updateResult[0].progress_percentage
    }, '報名狀態更新成功')

  } catch (dbError) {
    handleDatabaseError(dbError, 'Enrollment Update')
  }
}

// 導出處理函數
export const onRequestPatch = withErrorHandler(handleUpdateEnrollment, 'Enrollment Update')

// OPTIONS 請求處理
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
