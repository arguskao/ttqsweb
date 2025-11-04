/**
 * 用戶課程報名記錄 API 端點
 * 處理 /api/v1/users/enrollments 路由
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
    console.log('[User Enrollments] 查詢用戶報名記錄')

    // 從 Authorization header 獲取 token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: '未提供認證 token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const token = authHeader.substring(7)

    // 驗證 token 並獲取用戶 ID
    // 這裡簡化處理，實際應該驗證 JWT token
    // 暫時從 token 中解析用戶 ID（這只是臨時方案）
    let userId: number
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.userId
      console.log('[User Enrollments] 用戶 ID:', userId)
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, message: '無效的 token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[User Enrollments] DATABASE_URL 未配置')
      return new Response(
        JSON.stringify({ success: false, message: 'Database URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const sql = neon(databaseUrl)

    try {
      // 查詢用戶的所有報名記錄，包含課程信息
      const enrollments = await sql`
        SELECT 
          ce.id,
          ce.user_id,
          ce.course_id,
          ce.enrollment_date,
          ce.completion_date,
          ce.progress_percentage,
          ce.final_score,
          ce.status,
          c.title as course_title,
          c.course_type,
          c.duration_hours
        FROM course_enrollments ce
        LEFT JOIN courses c ON ce.course_id = c.id
        WHERE ce.user_id = ${userId}
        ORDER BY ce.enrollment_date DESC
      `

      console.log('[User Enrollments] 找到報名記錄:', enrollments.length)

      // 轉換為前端期望的格式
      const formattedEnrollments = enrollments.map((enrollment: any) => ({
        id: enrollment.id,
        userId: enrollment.user_id,
        courseId: enrollment.course_id,
        courseTitle: enrollment.course_title,
        courseType: enrollment.course_type,
        durationHours: enrollment.duration_hours,
        enrollmentDate: enrollment.enrollment_date,
        completionDate: enrollment.completion_date,
        progressPercentage: enrollment.progress_percentage || 0,
        finalScore: enrollment.final_score,
        status: enrollment.status || 'enrolled'
      }))

      return new Response(
        JSON.stringify({
          success: true,
          data: formattedEnrollments
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } catch (dbError: any) {
      console.error('[User Enrollments] 數據庫查詢失敗:', dbError)
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
    console.error('[User Enrollments] 查詢報名記錄失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取報名記錄失敗',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      'Access-Control-Max-Age': '86400'
    }
  })
}
