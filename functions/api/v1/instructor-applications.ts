/**
 * Cloudflare Pages Function for Instructor Applications
 * 處理講師申請的 API 端點
 */

interface Env {
    DATABASE_URL?: string
    JWT_SECRET?: string
    ENVIRONMENT?: string
}

export const onRequest: PagesFunction<Env> = async context => {
  const { request, env } = context

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

  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  console.log(`[InstructorApp] ${method} ${url.pathname}`)

  try {
    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL

    if (!databaseUrl) {
      console.error('[InstructorApp] DATABASE_URL 未配置')
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

    // 創建新申請：POST /instructor-applications
    if (method === 'POST') {
      console.log('[InstructorApp] 處理新申請提交')

      try {
        const body = await request.json() as any
        console.log('[InstructorApp] 接收到的數據:', body)

        const { bio, qualifications, specialization, years_of_experience, target_audiences } = body

        if (!bio || !qualifications || !specialization || years_of_experience === undefined) {
          console.log('[InstructorApp] 驗證失敗，缺少必填欄位')
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '請填寫所有必填欄位' }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        // 從 Authorization header 獲取用戶 ID
        const authHeader = request.headers.get('Authorization') || ''
        console.log('[InstructorApp] Authorization header:', authHeader ? '存在' : '不存在')

        if (!authHeader.startsWith('Bearer ')) {
          console.log('[InstructorApp] 認證失敗，沒有有效的 Bearer token')
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '需要提供認證 token' }
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        const token = authHeader.substring(7)
        const parts = token.split('.')
        if (parts.length !== 3) {
          console.log('[InstructorApp] Token 格式無效')
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '無效的認證 token' }
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        const payload = JSON.parse(atob(parts[1]))
        const userId = payload.userId
        console.log('[InstructorApp] 解析出的用戶 ID:', userId)

        if (!userId) {
          console.log('[InstructorApp] Token 中沒有用戶 ID')
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '無效的認證 token' }
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        // 先檢查表是否存在，如果不存在就創建
        const tableCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'instructor_applications'
          ) as table_exists
        `

        if (!tableCheck[0]?.table_exists) {
          console.log('[InstructorApp] 創建 instructor_applications 表')
          await sql`
            CREATE TABLE IF NOT EXISTS instructor_applications (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              bio TEXT NOT NULL,
              qualifications TEXT NOT NULL,
              specialization VARCHAR(255) NOT NULL,
              years_of_experience INTEGER NOT NULL DEFAULT 0,
              target_audiences TEXT,
              status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
              submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              reviewed_at TIMESTAMP NULL,
              reviewed_by INTEGER REFERENCES users(id),
              review_notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              average_rating DECIMAL(3,2) DEFAULT 0.00,
              total_ratings INTEGER DEFAULT 0,
              is_active BOOLEAN DEFAULT true
            )
          `
        }

        // 檢查是否已有申請
        console.log('[InstructorApp] 檢查現有申請，用戶 ID:', userId)
        const existingApps = await sql`
          SELECT id FROM instructor_applications 
          WHERE user_id = ${userId} AND status IN ('pending', 'approved')
        `
        console.log('[InstructorApp] 現有申請數量:', existingApps.length)

        if (existingApps.length > 0) {
          console.log('[InstructorApp] 用戶已有進行中的申請')
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'CONFLICT', message: '您已經有進行中的申請' }
            }),
            {
              status: 409,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        // 創建新申請
        console.log('[InstructorApp] 開始創建新申請')
        const result = await sql`
          INSERT INTO instructor_applications (
            user_id, bio, qualifications, specialization, years_of_experience, 
            target_audiences, status, submitted_at, created_at, updated_at
          )
          VALUES (
            ${userId}, ${bio}, ${qualifications}, ${specialization}, ${years_of_experience},
            ${target_audiences || ''}, 'pending', NOW(), NOW(), NOW()
          )
          RETURNING *
        `
        console.log('[InstructorApp] 申請創建成功，ID:', result[0]?.id)

        return new Response(
          JSON.stringify({
            success: true,
            data: result[0]
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      } catch (dbError: any) {
        console.error('[InstructorApp] 創建申請失敗:', dbError.message, dbError.stack)
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'DB_ERROR',
              message: 'Database error',
              details: dbError.message
            }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      }
    }

    // 其他方法暫不支持
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

  } catch (error: any) {
    console.error('[InstructorApp] 處理錯誤:', error.message)
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
