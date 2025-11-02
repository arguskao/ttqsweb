/**
 * 講師課程列表 API 端點
 * 處理 /api/v1/instructors/:instructorId/courses 路由
 */

interface Env {
    DATABASE_URL?: string
}

interface Context {
    request: Request
    env: Env
    params: {
        instructorId: string
    }
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env, params } = context

  try {
    console.log('[Instructor Courses] 查詢講師課程列表, Instructor ID:', params.instructorId)

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Instructor Courses] DATABASE_URL 未配置')
      return new Response(
        JSON.stringify({ success: false, message: 'Database URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const sql = neon(databaseUrl)
    const instructorId = parseInt(params.instructorId, 10)
    const url = new URL(request.url)

    // 獲取查詢參數
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = (page - 1) * limit

    if (isNaN(instructorId)) {
      return new Response(
        JSON.stringify({ success: false, message: '無效的講師 ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log('[Instructor Courses] 查詢參數:', { instructorId, page, limit })

    try {
      // 獲取講師的課程總數
      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM courses 
        WHERE instructor_id = ${instructorId} AND is_active = true
      `
      const total = parseInt(countResult[0]?.count || '0', 10)

      // 獲取講師的課程列表
      const courses = await sql`
        SELECT 
          c.*,
          COUNT(ce.id) as enrollment_count
        FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE c.instructor_id = ${instructorId} AND c.is_active = true
        GROUP BY c.id
        ORDER BY c.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `

      console.log('[Instructor Courses] 查詢到的課程數:', courses.length, '總數:', total)

      // 課程類型映射：數據庫中文 -> 前端英文
      const courseTypeMapping: Record<string, string> = {
        '基礎課程': 'basic',
        '進階課程': 'advanced',
        '實務課程': 'internship'
      }

      const processedCourses = courses.map((course: any) => ({
        ...course,
        course_type: courseTypeMapping[course.course_type] || course.course_type,
        enrollment_count: parseInt(course.enrollment_count || '0', 10)
      }))

      console.log('[Instructor Courses] 處理後的課程:', processedCourses.map(c => ({ 
        id: c.id, 
        title: c.title, 
        type: c.course_type,
        enrollments: c.enrollment_count 
      })))

      return new Response(
        JSON.stringify({
          success: true,
          data: processedCourses,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )

    } catch (dbError: any) {
      console.error('[Instructor Courses] 數據庫查詢失敗:', dbError)
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
    console.error('[Instructor Courses] 查詢講師課程失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取講師課程失敗',
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