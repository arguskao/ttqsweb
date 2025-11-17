/**
 * 課程 API 端點 - 使用統一錯誤處理
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
} from '../../utils/error-handler'

interface Env {
  DATABASE_URL: string
}

interface Context {
  request: Request
  env: Env
}

// 課程類型映射
const COURSE_TYPE_MAPPING: Record<string, string> = {
  'basic': '基礎課程',
  'advanced': '進階課程',
  'internship': '實務課程'
}

const COURSE_TYPE_REVERSE: Record<string, string> = {
  '基礎課程': 'basic',
  '進階課程': 'advanced',
  '實務課程': 'internship'
}

// GET - 獲取課程列表
async function handleGetCourses(context: Context): Promise<Response> {
  const { request, env } = context

  console.log('[Courses] 查詢課程列表')

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 解析查詢參數
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '12', 10)
  const offset = (page - 1) * limit
  const courseType = url.searchParams.get('course_type')
  const search = url.searchParams.get('search')

  // 驗證分頁參數
  if (page < 1 || limit < 1 || limit > 100) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的分頁參數')
  }

  console.log('[Courses] 查詢參數:', { page, limit, courseType, search })

  try {
    let courses
    let total = 0

    if (courseType && COURSE_TYPE_MAPPING[courseType]) {
      // 按課程類型篩選
      const dbCourseType = COURSE_TYPE_MAPPING[courseType]
      console.log('[Courses] 篩選課程類型:', dbCourseType)

      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM courses 
        WHERE is_active = true AND course_type = ${dbCourseType}
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      courses = await sql`
        SELECT 
          c.*,
          i.id as instructor_db_id,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          u.email as instructor_email,
          i.bio as instructor_bio,
          i.expertise as instructor_expertise,
          i.average_rating as instructor_rating
        FROM courses c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE c.is_active = true AND c.course_type = ${dbCourseType}
        ORDER BY c.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search) {
      // 按關鍵字搜尋
      console.log('[Courses] 搜尋關鍵字:', search)

      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM courses 
        WHERE is_active = true 
        AND (title ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      courses = await sql`
        SELECT 
          c.*,
          i.id as instructor_db_id,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          u.email as instructor_email,
          i.bio as instructor_bio,
          i.expertise as instructor_expertise,
          i.average_rating as instructor_rating
        FROM courses c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE c.is_active = true 
        AND (c.title ILIKE ${`%${search}%`} OR c.description ILIKE ${`%${search}%`})
        ORDER BY c.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // 獲取所有課程
      console.log('[Courses] 獲取所有課程')

      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM courses 
        WHERE is_active = true
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      courses = await sql`
        SELECT 
          c.*,
          i.id as instructor_db_id,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          u.email as instructor_email,
          i.bio as instructor_bio,
          i.expertise as instructor_expertise,
          i.average_rating as instructor_rating
        FROM courses c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE c.is_active = true
        ORDER BY c.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    console.log('[Courses] 查詢到的課程數:', courses.length, '總數:', total)

    // 轉換課程類型為前端格式，並整理講師信息
    const processedCourses = courses.map((course: any) => {
      // 提取講師相關字段
      const instructorFields = {
        instructor_db_id: course.instructor_db_id,
        instructor_first_name: course.instructor_first_name,
        instructor_last_name: course.instructor_last_name,
        instructor_email: course.instructor_email,
        instructor_bio: course.instructor_bio,
        instructor_expertise: course.instructor_expertise,
        instructor_rating: course.instructor_rating
      }
      
      // 移除講師字段，保留課程字段
      const courseData: any = {}
      for (const key in course) {
        if (!key.startsWith('instructor_')) {
          courseData[key] = course[key]
        }
      }
      
      // 轉換課程類型
      courseData.course_type = COURSE_TYPE_REVERSE[courseData.course_type] || courseData.course_type
      
      // 添加向後兼容的扁平格式
      if (instructorFields.instructor_first_name) {
        courseData.instructorFirstName = instructorFields.instructor_first_name
        courseData.instructorLastName = instructorFields.instructor_last_name
        courseData.instructorEmail = instructorFields.instructor_email
      }
      
      // 添加新的嵌套格式
      if (instructorFields.instructor_db_id) {
        courseData.instructor = {
          id: instructorFields.instructor_db_id,
          first_name: instructorFields.instructor_first_name,
          last_name: instructorFields.instructor_last_name,
          full_name: `${instructorFields.instructor_first_name || ''} ${instructorFields.instructor_last_name || ''}`.trim(),
          email: instructorFields.instructor_email,
          bio: instructorFields.instructor_bio,
          expertise: instructorFields.instructor_expertise,
          rating: instructorFields.instructor_rating
        }
      }
      
      return courseData
    })

    return createSuccessResponse(processedCourses, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })

  } catch (dbError) {
    handleDatabaseError(dbError, 'Courses Query')
  }
}

// POST - 創建新課程
async function handleCreateCourse(context: Context): Promise<Response> {
  const { request, env } = context

  console.log('[Courses] 創建新課程')

  // 驗證 token 和權限
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  checkPermission(payload.userType, ['admin', 'instructor'])

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 解析請求體
  const body = await request.json() as {
    title?: string
    description?: string
    course_type?: string
    duration_hours?: number
    price?: number
    instructor_id?: number
  }

  console.log('[Courses] 接收到的課程資料:', body)

  // 驗證必填欄位
  if (!body.title || !body.description) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '課程標題和描述為必填欄位')
  }

  // 驗證課程類型
  const dbCourseType = body.course_type 
    ? COURSE_TYPE_MAPPING[body.course_type] || '基礎課程'
    : '基礎課程'

  try {
    // 創建課程
    const result = await sql`
      INSERT INTO courses (
        title, 
        description, 
        course_type, 
        duration_hours, 
        price,
        instructor_id,
        is_active
      ) VALUES (
        ${body.title},
        ${body.description},
        ${dbCourseType},
        ${body.duration_hours || 0},
        ${body.price || 0},
        ${body.instructor_id || null},
        true
      )
      RETURNING *
    `

    console.log('[Courses] 課程創建成功:', result[0])

    return createSuccessResponse(result[0], '課程創建成功', 201)

  } catch (dbError) {
    handleDatabaseError(dbError, 'Course Creation')
  }
}

// 導出處理函數
export const onRequestGet = withErrorHandler(handleGetCourses, 'Courses List')
export const onRequestPost = withErrorHandler(handleCreateCourse, 'Course Create')

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
