/**
 * 課程學員名單 API 端點 - 使用統一錯誤處理
 * 只有課程講師和管理員可以查看
 */
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateToken,
  parseJwtToken,
  checkPermission,
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
    courseId: string
  }
}

async function handleGetStudents(context: Context): Promise<Response> {
  const { request, env, params } = context

  console.log('[Course Students] 查詢課程學員名單, Course ID:', params.courseId)

  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  const userId = payload.userId
  const userType = payload.userType

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 驗證課程 ID
  const courseId = parseInt(params.courseId, 10)
  if (isNaN(courseId)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的課程 ID')
  }

  try {
    // 檢查課程是否存在
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

    // 權限檢查：只有課程講師或管理員可以查看學員名單
    if (userType !== 'admin' && course.instructor_user_id !== userId) {
      throw new ApiError(ErrorCode.FORBIDDEN, '您沒有權限查看此課程的學員名單')
    }

    // 獲取學員名單
    const students = await sql`
      SELECT 
        ce.id as enrollment_id,
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        ce.enrollment_date,
        ce.progress_percentage,
        ce.status,
        ce.completion_date,
        ce.final_score
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.course_id = ${courseId}
      ORDER BY ce.enrollment_date DESC
    `

    console.log('[Course Students] 找到學員:', students.length)

    // 格式化學員資料
    const formattedStudents = students.map((student: any) => ({
      id: student.enrollment_id,
      userId: student.user_id,
      email: student.email,
      firstName: student.first_name,
      lastName: student.last_name,
      fullName: `${student.last_name}${student.first_name}`,
      phone: student.phone,
      enrollmentDate: student.enrollment_date,
      progressPercentage: student.progress_percentage || 0,
      status: student.status || 'enrolled',
      completionDate: student.completion_date,
      finalScore: student.final_score
    }))

    return createSuccessResponse({
      course: {
        id: course.id,
        title: course.title,
        courseType: course.course_type
      },
      students: formattedStudents,
      total: formattedStudents.length
    })

  } catch (dbError) {
    handleDatabaseError(dbError, 'Course Students Query')
  }
}

// 導出處理函數（自動包含錯誤處理和 CORS）
export const onRequestGet = withErrorHandler(handleGetStudents, 'Course Students')

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
