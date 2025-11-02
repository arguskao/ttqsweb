/**
 * 單個課程詳情 API 端點
 * 處理 /api/v1/courses/:id 路由
 */

interface Env {
    DATABASE_URL?: string
}

interface Context {
    request: Request
    env: Env
    params: {
        id: string
    }
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env, params } = context

  try {
    console.log('[Course Detail] 查詢課程詳情, ID:', params.id)

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Course Detail] DATABASE_URL 未配置')
      return new Response(
        JSON.stringify({ success: false, message: 'Database URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const sql = neon(databaseUrl)
    const courseId = parseInt(params.id, 10)

    if (isNaN(courseId)) {
      return new Response(
        JSON.stringify({ success: false, message: '無效的課程 ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    try {
      // 查詢課程詳情，包含講師資訊
      const courses = await sql`
        SELECT 
          c.*,
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
        return new Response(
          JSON.stringify({ success: false, message: '課程不存在或已停用' }),
          { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
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

      return new Response(
        JSON.stringify({
          success: true,
          data: processedCourse
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )

    } catch (dbError: any) {
      console.error('[Course Detail] 數據庫查詢失敗:', dbError)
      return new Response(
        JSON.stringify({
          success: false,
          message: '數據庫查詢失敗',
          details: dbError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

  } catch (error: any) {
    console.error('[Course Detail] 查詢課程詳情失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取課程詳情失敗',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

// 處理 OPTIONS 請求（CORS 預檢）
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