/**
 * 單個課程詳情 API 端點 - 使用統一錯誤處理
 */
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateDatabaseUrl,
  handleDatabaseError
} from '../../../utils/error-handler'

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

async function handleGetCourse(context: Context): Promise<Response> {
  const { env, params } = context

  console.log('[Course Detail] 查詢課程詳情, ID:', params.id)

  // 驗證課程 ID
  const courseId = parseInt(params.id, 10)
  if (isNaN(courseId)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的課程 ID')
  }

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 查詢課程詳情，包含講師資訊
    const courses = await sql`
      SELECT 
        c.*,
        u.id as instructor_user_id,
        u.first_name as instructor_first_name,
        u.last_name as instructor_last_name,
        ia.bio as instructor_bio,
        ia.specialization as instructor_specialization
      FROM courses c
      LEFT JOIN instructor_applications ia ON c.instructor_id = ia.id
      LEFT JOIN users u ON ia.user_id = u.id
      WHERE c.id = ${courseId} AND c.is_active = true
    `

    if (courses.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '課程不存在或已停用')
    }

    const course = courses[0]
    console.log('[Course Detail] 找到課程:', course.title)

    // 課程類型映射：數據庫中文 -> 前端英文
    const courseTypeMapping: Record<string, string> = {
      '基礎課程': 'basic',
      '進階課程': 'advanced',
      '實務課程': 'internship'
    }

    // 處理課程資料，轉換為前端期望的格式
    const processedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      courseType: courseTypeMapping[course.course_type] || 'basic',
      course_type: courseTypeMapping[course.course_type] || 'basic',
      durationHours: course.duration_hours,
      duration_hours: course.duration_hours,
      price: course.price,
      instructorId: course.instructor_id,
      instructor_id: course.instructor_id,
      instructorUserId: course.instructor_user_id,
      instructor_user_id: course.instructor_user_id,
      instructorFirstName: course.instructor_first_name,
      instructorLastName: course.instructor_last_name,
      instructorBio: course.instructor_bio,
      instructorSpecialization: course.instructor_specialization,
      isActive: course.is_active,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }

    console.log('[Course Detail] 處理後的課程資料:', {
      id: processedCourse.id,
      title: processedCourse.title,
      type: processedCourse.courseType
    })

    return createSuccessResponse(processedCourse)

  } catch (dbError) {
    handleDatabaseError(dbError, 'Course Detail Query')
  }
}

// 導出處理函數（自動包含錯誤處理和 CORS）
export const onRequestGet = withErrorHandler(handleGetCourse, 'Course Detail')

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
