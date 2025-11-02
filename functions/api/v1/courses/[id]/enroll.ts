/**
 * 課程報名 API 端點
 * 處理 /api/v1/courses/:id/enroll 路由
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

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env, params } = context

  try {
    console.log('[Course Enroll] 課程報名, Course ID:', params.id)

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Course Enroll] DATABASE_URL 未配置')
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

    // 從 Authorization header 獲取用戶資訊
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: '需要登入才能報名課程' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 解析 JWT token 獲取用戶 ID
    const token = authHeader.substring(7)
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ success: false, message: '無效的認證 token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    let userId: number
    try {
      const payload = JSON.parse(atob(parts[1]))
      userId = payload.userId || payload.user_id || payload.id
      
      if (!userId) {
        throw new Error('Token 中沒有用戶 ID')
      }
      
      console.log('[Course Enroll] 用戶 ID:', userId)
    } catch (error) {
      console.error('[Course Enroll] Token 解析失敗:', error)
      return new Response(
        JSON.stringify({ success: false, message: '無效的認證 token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    try {  
    // 檢查課程是否存在
      const courses = await sql`
        SELECT * FROM courses 
        WHERE id = ${courseId} AND is_active = true
      `

      if (courses.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: '課程不存在或已停用' }),
          { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const course = courses[0]
      console.log('[Course Enroll] 找到課程:', course.title)

      // 檢查用戶是否已經報名
      const existingEnrollments = await sql`
        SELECT * FROM course_enrollments 
        WHERE course_id = ${courseId} AND user_id = ${userId}
      `

      if (existingEnrollments.length > 0) {
        return new Response(
          JSON.stringify({ success: false, message: '您已經報名過此課程' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
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

      return new Response(
        JSON.stringify({
          success: true,
          message: '課程報名成功',
          data: {
            enrollment: enrollment[0]
          }
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )

    } catch (dbError: any) {
      console.error('[Course Enroll] 數據庫操作失敗:', dbError)
      return new Response(
        JSON.stringify({
          success: false,
          message: '數據庫操作失敗',
          details: dbError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

  } catch (error: any) {
    console.error('[Course Enroll] 課程報名失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '課程報名失敗',
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