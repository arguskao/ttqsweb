/**
 * 課程 API 端點
 * 簡化版本，只處理課程列表查詢
 */

interface Env {
    DATABASE_URL?: string
}

interface Context {
    request: Request
    env: Env
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    console.log('[Courses] 查詢課程列表')

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Courses] DATABASE_URL 未配置')
      return new Response(
        JSON.stringify({ success: false, message: 'Database URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const sql = neon(databaseUrl)
    const url = new URL(request.url)

    // 獲取查詢參數
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = (page - 1) * limit
    const courseType = url.searchParams.get('course_type')
    const search = url.searchParams.get('search')

    console.log('[Courses] 查詢參數:', { page, limit, courseType, search })

    // 課程類型映射：前端英文 -> 數據庫中文
    const courseTypeMapping: Record<string, string> = {
      'basic': '基礎課程',
      'advanced': '進階課程',
      'internship': '實務課程'
    }

    try {
      let courses
      let total = 0

      if (courseType && courseTypeMapping[courseType]) {
        // 有課程類型篩選
        const dbCourseType = courseTypeMapping[courseType]
        console.log('[Courses] 篩選課程類型:', dbCourseType)

        // 獲取總數
        const countResult = await sql`
                    SELECT COUNT(*) as count 
                    FROM courses 
                    WHERE is_active = true AND course_type = ${dbCourseType}
                `
        total = parseInt(countResult[0]?.count || '0', 10)

        // 獲取課程列表
        courses = await sql`
                    SELECT * FROM courses 
                    WHERE is_active = true AND course_type = ${dbCourseType}
                    ORDER BY created_at DESC 
                    LIMIT ${limit} OFFSET ${offset}
                `
      } else if (search) {
        // 有搜尋條件
        console.log('[Courses] 搜尋關鍵字:', search)

        // 獲取總數
        const countResult = await sql`
                    SELECT COUNT(*) as count 
                    FROM courses 
                    WHERE is_active = true 
                    AND (title ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
                `
        total = parseInt(countResult[0]?.count || '0', 10)

        // 獲取課程列表
        courses = await sql`
                    SELECT * FROM courses 
                    WHERE is_active = true 
                    AND (title ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
                    ORDER BY created_at DESC 
                    LIMIT ${limit} OFFSET ${offset}
                `
      } else {
        // 無篩選條件，獲取所有課程
        console.log('[Courses] 獲取所有課程')

        // 獲取總數
        const countResult = await sql`
                    SELECT COUNT(*) as count 
                    FROM courses 
                    WHERE is_active = true
                `
        total = parseInt(countResult[0]?.count || '0', 10)

        // 獲取課程列表
        courses = await sql`
                    SELECT * FROM courses 
                    WHERE is_active = true
                    ORDER BY created_at DESC 
                    LIMIT ${limit} OFFSET ${offset}
                `
      }

      console.log('[Courses] 查詢到的課程數:', courses.length, '總數:', total)

      // 將數據庫中文課程類型轉換為前端英文類型
      const courseTypeReverseMapping: Record<string, string> = {
        '基礎課程': 'basic',
        '進階課程': 'advanced',
        '實務課程': 'internship'
      }

      const processedCourses = courses.map((course: any) => ({
        ...course,
        course_type: courseTypeReverseMapping[course.course_type] || course.course_type
      }))

      console.log('[Courses] 處理後的課程:', processedCourses.map(c => ({ id: c.id, title: c.title, type: c.course_type })))

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
      console.error('[Courses] 數據庫查詢失敗:', dbError)
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
    console.error('[Courses] 查詢課程列表失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取課程列表失敗',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

// POST 方法 - 創建新課程
export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    console.log('[Courses] 創建新課程')

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Courses] DATABASE_URL 未配置')
      return new Response(
        JSON.stringify({ success: false, message: 'Database URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const sql = neon(databaseUrl)
    const body = await request.json() as any

    console.log('[Courses] 接收到的課程資料:', body)

    // 驗證必填欄位
    if (!body.title || !body.description) {
      return new Response(
        JSON.stringify({ success: false, message: '課程標題和描述為必填欄位' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 課程類型映射：前端英文 -> 數據庫中文
    const courseTypeMapping: Record<string, string> = {
      'basic': '基礎課程',
      'advanced': '進階課程',
      'internship': '實務課程'
    }

    const dbCourseType = courseTypeMapping[body.course_type] || '基礎課程'

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

    return new Response(
      JSON.stringify({
        success: true,
        data: result[0],
        message: '課程創建成功'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )

  } catch (error: any) {
    console.error('[Courses] 創建課程失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '創建課程失敗',
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
      // 必須允許前端實際發送的自訂標頭，否則預檢會被拒絕
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}
