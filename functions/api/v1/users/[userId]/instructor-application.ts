/**
 * Cloudflare Pages Function for User Instructor Application
 * 處理用戶講師申請查詢的 API 端點
 */

interface Env {
    DATABASE_URL?: string
    JWT_SECRET?: string
    ENVIRONMENT?: string
}

export const onRequest: PagesFunction<Env> = async context => {
  const { request, env, params } = context

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  const method = request.method.toUpperCase()
  const userId = params.userId as string

  console.log(`[UserInstructorApp] ${method} /users/${userId}/instructor-application`)

  // 只處理 GET 請求
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${method} not allowed` }
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }

  try {
    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL

    if (!databaseUrl) {
      console.error('[UserInstructorApp] DATABASE_URL 未配置')
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'DB_ERROR', message: 'Database not configured' }
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const sql = neon(databaseUrl)

    // 驗證用戶 ID
    const userIdNum = parseInt(userId)
    if (isNaN(userIdNum)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid user ID' }
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // 檢查表是否存在
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instructor_applications'
      ) as table_exists
    `

    if (!tableCheck[0]?.table_exists) {
      return new Response(
        JSON.stringify({
          success: true,
          data: null
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // 查詢用戶的申請
    const applications = await sql`
      SELECT * FROM instructor_applications 
      WHERE user_id = ${userIdNum}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (applications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: null
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: applications[0]
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )

  } catch (error: any) {
    console.error('[UserInstructorApp] 處理錯誤:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Server error' }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}
