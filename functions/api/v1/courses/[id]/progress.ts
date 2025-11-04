/**
 * 課程學習進度 API 端點
 * 處理 /api/v1/courses/:id/progress 路由
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
    console.log('[Course Progress] 查詢學習進度, Course ID:', params.id)

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Course Progress] DATABASE_URL 未配置')
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
        JSON.stringify({ success: false, message: '需要登入才能查看學習進度' }),
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
      
      console.log('[Course Progress] 用戶 ID:', userId)
    } catch (error) {
      console.error('[Course Progress] Token 解析失敗:', error)
      return new Response(
        JSON.stringify({ success: false, message: '無效的認證 token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    try {
      // 查詢用戶的課程報名記錄
      const enrollments = await sql`
        SELECT 
          ce.*,
          c.title as course_title,
          c.description as course_description
        FROM course_enrollments ce
        JOIN courses c ON ce.course_id = c.id
        WHERE ce.course_id = ${courseId} AND ce.user_id = ${userId}
      `

      if (enrollments.length === 0) {
        // 若未報名，回傳課程基本資料與 0% 進度，狀態為 not_enrolled（避免前端 404 體驗不佳）
        const courses = await sql`
          SELECT id, title, description FROM courses WHERE id = ${courseId}
        `
        const course = courses[0] || { id: courseId, title: '課程', description: '' }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: null,
              user_id: userId,
              course_id: course.id,
              course_title: course.title,
              course_description: course.description,
              enrollment_date: null,
              completion_date: null,
              progress_percentage: 0,
              final_score: null,
              status: 'not_enrolled'
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const enrollment = enrollments[0]
      console.log('[Course Progress] 找到報名記錄:', enrollment.id)

      return new Response(
        JSON.stringify({
          success: true,
          data: enrollment
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )

    } catch (dbError: any) {
      console.error('[Course Progress] 數據庫查詢失敗:', dbError)
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
    console.error('[Course Progress] 查詢學習進度失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取學習進度失敗',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}