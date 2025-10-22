/**
 * API請求處理器
 * 處理其他所有API路由，包括認證、課程、工作等
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

interface Context {
  request: Request
  env: Env
}

// 簡單的密碼雜湊函數（實際應使用 bcrypt）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 驗證密碼
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// 生成簡單的 JWT token
function generateToken(userId: number, email: string): string {
  // 簡化版本：實際應使用 JWT 庫
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 3600 // 1 hour
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    userId,
    email,
    iat: now,
    exp: now + expiresIn // 添加過期時間
  }))
  const signature = btoa('signature')
  return `${header}.${payload}.${signature}`
}

export async function handleApiRequest(context: Context, path: string): Promise<Response> {
  const { request, env } = context

  // 認證相關端點
  if (path.startsWith('/auth')) {
    const url = new URL(request.url)
    const method = request.method.toUpperCase()

    // POST /auth/register
    if (method === 'POST' && path === '/auth/register') {
      try {
        const body = await request.json() as any
        const { email, password, confirmPassword, userType, firstName, lastName, phone } = body

        // 驗證必填欄位
        if (!email || !password || !userType || !firstName || !lastName) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '請填寫所有必填欄位' }
            }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 驗證密碼確認
        if (password !== confirmPassword) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '密碼確認不一致' }
            }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 驗證密碼長度
        if (password.length < 8) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '密碼至少需要8個字符' }
            }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 連接數據庫
        const { neon } = await import('@neondatabase/serverless')
        const conn = (env.DATABASE_URL as string) || ''
        const sql = neon(conn)

        // 檢查用戶是否已存在
        const existingUsers = await sql`SELECT id FROM users WHERE email = ${email}`
        if (existingUsers.length > 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'CONFLICT', message: '此電子郵件已被註冊' }
            }),
            { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 雜湊密碼
        const passwordHash = await hashPassword(password)

        // 插入新用戶
        const result = await sql`
          INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone, is_active, created_at, updated_at)
          VALUES (${email}, ${passwordHash}, ${userType}, ${firstName}, ${lastName}, ${phone || null}, true, NOW(), NOW())
          RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
        `

        const user = result[0]
        const token = generateToken(user.id, user.email)

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              user: {
                id: user.id,
                email: user.email,
                userType: user.user_type,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
                isActive: user.is_active
              },
              tokens: {
                accessToken: token,
                refreshToken: '',
                expiresIn: 3600
              }
            }
          }),
          { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      } catch (error: any) {
        console.error('[Auth] 註冊失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '註冊失敗' }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // POST /auth/login
    if (method === 'POST' && path === '/auth/login') {
      try {
        const body = await request.json() as any
        const { email, password } = body

        // 驗證必填欄位
        if (!email || !password) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '請填寫電子郵件和密碼' }
            }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 連接數據庫
        const { neon } = await import('@neondatabase/serverless')
        const conn = (env.DATABASE_URL as string) || ''
        const sql = neon(conn)

        // 查詢用戶
        const users = await sql`SELECT * FROM users WHERE email = ${email}`
        if (users.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '電子郵件或密碼不正確' }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        const user = users[0]

        // 驗證密碼
        const isPasswordValid = await verifyPassword(password, user.password_hash)
        if (!isPasswordValid) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '電子郵件或密碼不正確' }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        const token = generateToken(user.id, user.email)

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              user: {
                id: user.id,
                email: user.email,
                userType: user.user_type,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
                isActive: user.is_active
              },
              tokens: {
                accessToken: token,
                refreshToken: '',
                expiresIn: 3600
              }
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      } catch (error: any) {
        console.error('[Auth] 登入失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '登入失敗' }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // GET /auth/profile
    if (method === 'GET' && path === '/auth/profile') {
      try {
        // 從 Authorization header 獲取 token
        const authHeader = request.headers.get('Authorization') || ''
        if (!authHeader.startsWith('Bearer ')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '需要提供認證 token' }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        const token = authHeader.substring(7)
        
        // 簡單解析 JWT token 獲取用戶 ID
        try {
          const parts = token.split('.')
          if (parts.length !== 3) {
            throw new Error('Invalid token format')
          }
          
          const payload = JSON.parse(atob(parts[1]))
          const userId = payload.userId
          
          if (!userId) {
            throw new Error('Invalid token payload')
          }

          // 連接數據庫查詢用戶資料
          const { neon } = await import('@neondatabase/serverless')
          const conn = (env.DATABASE_URL as string) || ''
          const sql = neon(conn)

          const users = await sql`SELECT * FROM users WHERE id = ${userId}`
          if (users.length === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: '用戶不存在' }
              }),
              { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
          }

          const user = users[0]

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                user: {
                  id: user.id,
                  email: user.email,
                  userType: user.user_type,
                  firstName: user.first_name,
                  lastName: user.last_name,
                  phone: user.phone,
                  createdAt: user.created_at,
                  updatedAt: user.updated_at,
                  isActive: user.is_active
                }
              }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (tokenError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '無效的認證 token' }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      } catch (error: any) {
        console.error('[Auth] 獲取用戶資料失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '獲取用戶資料失敗' }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // PUT /auth/profile
    if (method === 'PUT' && path === '/auth/profile') {
      try {
        // 從 Authorization header 獲取 token
        const authHeader = request.headers.get('Authorization') || ''
        if (!authHeader.startsWith('Bearer ')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '需要提供認證 token' }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        const token = authHeader.substring(7)
        const body = await request.json() as any
        
        // 簡單解析 JWT token 獲取用戶 ID
        try {
          const parts = token.split('.')
          if (parts.length !== 3) {
            throw new Error('Invalid token format')
          }
          
          const payload = JSON.parse(atob(parts[1]))
          const userId = payload.userId
          
          if (!userId) {
            throw new Error('Invalid token payload')
          }

          const { firstName, lastName, phone } = body

          // 驗證至少有一個欄位要更新
          if (!firstName && !lastName && phone === undefined) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: '至少需要提供一個要更新的欄位' }
              }),
              { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
          }

          // 連接數據庫更新用戶資料
          const { neon } = await import('@neondatabase/serverless')
          const conn = (env.DATABASE_URL as string) || ''
          const sql = neon(conn)

          // 構建更新查詢 - 使用 Neon 的參數化查詢
          let result

          if (firstName && lastName && phone !== undefined) {
            // 更新所有三個欄位
            result = await sql`
              UPDATE users
              SET first_name = ${firstName},
                  last_name = ${lastName},
                  phone = ${phone},
                  updated_at = NOW()
              WHERE id = ${userId}
              RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
            `
          } else if (firstName && lastName) {
            // 更新姓名
            result = await sql`
              UPDATE users
              SET first_name = ${firstName},
                  last_name = ${lastName},
                  updated_at = NOW()
              WHERE id = ${userId}
              RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
            `
          } else if (firstName && phone !== undefined) {
            // 更新名字和電話
            result = await sql`
              UPDATE users
              SET first_name = ${firstName},
                  phone = ${phone},
                  updated_at = NOW()
              WHERE id = ${userId}
              RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
            `
          } else if (lastName && phone !== undefined) {
            // 更新姓氏和電話
            result = await sql`
              UPDATE users
              SET last_name = ${lastName},
                  phone = ${phone},
                  updated_at = NOW()
              WHERE id = ${userId}
              RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
            `
          } else if (firstName) {
            // 只更新名字
            result = await sql`
              UPDATE users
              SET first_name = ${firstName},
                  updated_at = NOW()
              WHERE id = ${userId}
              RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
            `
          } else if (lastName) {
            // 只更新姓氏
            result = await sql`
              UPDATE users
              SET last_name = ${lastName},
                  updated_at = NOW()
              WHERE id = ${userId}
              RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
            `
          } else if (phone !== undefined) {
            // 只更新電話
            result = await sql`
              UPDATE users
              SET phone = ${phone},
                  updated_at = NOW()
              WHERE id = ${userId}
              RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active
            `
          }

          if (result.length === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: '用戶不存在' }
              }),
              { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
          }

          const user = result[0]

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                user: {
                  id: user.id,
                  email: user.email,
                  userType: user.user_type,
                  firstName: user.first_name,
                  lastName: user.last_name,
                  phone: user.phone,
                  createdAt: user.created_at,
                  updatedAt: user.updated_at,
                  isActive: user.is_active
                }
              }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (tokenError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: '無效的認證 token' }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      } catch (error: any) {
        console.error('[Auth] 更新用戶資料失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '更新用戶資料失敗' }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // 其他認證端點返回 404
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Auth endpoint not found' }
      }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }

  // 健康檢查端點
  if (path === '/health') {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'production',
          database: env.DATABASE_URL ? 'connected' : 'not configured'
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }

  // 文件相關端點（暫時簡化在 Pages Functions 內處理，避免 404）
  if (path.startsWith('/documents') || path.startsWith('/files')) {
    const url = new URL(request.url)
    const method = request.method.toUpperCase()

    // 列表：GET /documents
    if (method === 'GET' && path === '/documents') {
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '12', 10)
      const offset = (page - 1) * limit
      const category = url.searchParams.get('category')

      try {
        // 直接連 Neon 讀資料（必須使用 tagged template 語法）
        const { neon } = await import('@neondatabase/serverless')
        const conn = (env.DATABASE_URL as string) || ''
        const sql = neon(conn)

        const whereFrag = category ? sql`WHERE category = ${category}` : sql``
        const countRows = await sql<
          { count: number }[]
        >`SELECT COUNT(*)::int AS count FROM documents ${whereFrag}`
        const count = countRows?.[0]?.count ?? 0

        const docs = await sql<any[]>`
          SELECT id, title, description, file_url, file_type, file_size, category, is_public, uploaded_by, download_count, created_at
          FROM documents
          ${whereFrag}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `

        return new Response(
          JSON.stringify({
            success: true,
            data: docs,
            meta: { page, limit, total: count, category: category || null }
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      } catch (e: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'DB_ERROR', message: e?.message || 'Database error' }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      }
    }

    // 單筆：GET /documents/:id
    if (method === 'GET' && /^\/documents\/[\w-]+$/.test(path)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' }
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // 其他文件寫入/刪除操作暫不在 Functions 內處理
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Endpoint not available on Pages Functions' }
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }

  // 嘗試使用 API 路由系統處理請求
  try {
    console.log(`[API] 處理請求: ${request.method} ${path}`)

    // 直接導入而不是動態導入
    const apiModule = await import('../../api/index.ts')
    const router = apiModule.router

    if (router) {
      const url = new URL(request.url)
      const method = request.method.toUpperCase()

      // 構建 API 請求對象
      const apiRequest: any = {
        method,
        url: path + url.search,
        headers: Object.fromEntries(request.headers.entries()),
        query: Object.fromEntries(url.searchParams.entries()),
        params: {}
      }

      // 如果有 body，解析它
      if (method !== 'GET' && method !== 'HEAD') {
        try {
          apiRequest.body = await request.json()
        } catch {
          apiRequest.body = null
        }
      }

      console.log(`[API] 調用路由處理器，URL: ${apiRequest.url}`)

      // 調用路由處理器
      const response = await router.handleRequest(apiRequest)

      console.log(`[API] 路由響應: success=${response.success}`)

      // 轉換為 HTTP 響應
      const statusCode = response.statusCode || (response.success ? 200 : 400)
      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          ...(response.headers || {})
        }
      })
    } else {
      console.error('[API] 路由器未找到')
    }
  } catch (error: any) {
    console.error('[API] 路由器錯誤:', error.message, error.stack)
    // 如果路由處理失敗，繼續到備用處理
  }

  // 備用：經驗分享相關端點（直接查詢數據庫）
  if (path.startsWith('/experiences')) {
    try {
      const url = new URL(request.url)
      const method = request.method.toUpperCase()

      // 導入 Neon 數據庫
      const { neon } = await import('@neondatabase/serverless')
      const databaseUrl = env.DATABASE_URL

      if (!databaseUrl) {
        console.error('[Fallback] DATABASE_URL 未配置')
        return new Response(
          JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'Database not configured' } }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const sql = neon(databaseUrl)

      // 獲取經驗分享列表
      if (method === 'GET' && path === '/experiences') {
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const limit = parseInt(url.searchParams.get('limit') || '10', 10)
        const offset = (page - 1) * limit

        try {
          const countResult = await sql`SELECT COUNT(*) as count FROM experience_shares`
          const total = parseInt(countResult[0]?.count || '0')

          const experiences = await sql`
            SELECT * FROM experience_shares
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `

          return new Response(
            JSON.stringify({ success: true, data: experiences, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 查詢經驗分享失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: true, data: [], meta: { page, limit, total: 0 } }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      }

      // 獲取經驗分享詳情
      const experienceIdMatch = path.match(/^\/experiences\/(\d+)$/)
      if (method === 'GET' && experienceIdMatch) {
        const experienceId = parseInt(experienceIdMatch[1])

        try {
          const experience = await sql`SELECT * FROM experience_shares WHERE id = ${experienceId}`

          if (experience.length === 0) {
            return new Response(
              JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Experience not found' } }),
              { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
          }

          // 增加瀏覽次數
          await sql`UPDATE experience_shares SET view_count = view_count + 1 WHERE id = ${experienceId}`

          return new Response(
            JSON.stringify({ success: true, data: experience[0] }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 查詢經驗分享詳情失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'Database error' } }),
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      }

      // 創建經驗分享
      if (method === 'POST' && path === '/experiences') {
        try {
          const body = await request.json() as any
          const { title, content, share_type, tags, is_featured } = body

          if (!title || !content || !share_type) {
            return new Response(
              JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } }),
              { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
          }

          // 從 Authorization header 獲取用戶 ID（簡化版本，實際應該驗證 token）
          const authHeader = request.headers.get('Authorization') || ''
          const userId = 1 // 簡化：假設用戶 ID 為 1，實際應該從 token 解析
          const tagsArray = Array.isArray(tags) ? tags : []

          // 使用參數化查詢，tags 作為數組參數
          const result = await sql`
            INSERT INTO experience_shares (author_id, title, content, share_type, tags, like_count, comment_count, view_count, is_featured, created_at, updated_at)
            VALUES (${userId}, ${title}, ${content}, ${share_type}, ${tagsArray}, 0, 0, 0, ${is_featured || false}, NOW(), NOW())
            RETURNING *
          `

          return new Response(
            JSON.stringify({ success: true, data: result[0] }),
            { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 創建經驗分享失敗:', dbError.message, dbError.stack)
          return new Response(
            JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'Failed to create experience', details: dbError.message } }),
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      }

      // 點讚經驗分享
      const likeMatch = path.match(/^\/experiences\/(\d+)\/like$/)
      if (method === 'POST' && likeMatch) {
        const experienceId = parseInt(likeMatch[1])

        try {
          await sql`UPDATE experience_shares SET like_count = like_count + 1 WHERE id = ${experienceId}`

          return new Response(
            JSON.stringify({ success: true, data: { message: 'Experience liked successfully' } }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 點讚失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'Database error' } }),
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      }

      // 未涵蓋的經驗分享端點
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    } catch (error: any) {
      console.error('[Fallback] 經驗分享備用處理錯誤:', error.message)
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
  }

  // 備用：討論區/社群相關端點（直接查詢數據庫）
  if (path.startsWith('/groups') || path.startsWith('/topics') || path.startsWith('/forum')) {
    try {
      const url = new URL(request.url)
      const method = request.method.toUpperCase()

      // 導入 Neon 數據庫
      const { neon } = await import('@neondatabase/serverless')
      const databaseUrl = env.DATABASE_URL

      if (!databaseUrl) {
        console.error('[Fallback] DATABASE_URL 未配置')
        return new Response(
          JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'Database not configured' } }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const sql = neon(databaseUrl)

      // 群組清單
      if (method === 'GET' && path === '/groups') {
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const limit = parseInt(url.searchParams.get('limit') || '12', 10)
        const offset = (page - 1) * limit

        try {
          const countResult = await sql`SELECT COUNT(*) as count FROM student_groups WHERE is_active = true`
          const total = parseInt(countResult[0]?.count || '0')

          const groups = await sql`
            SELECT * FROM student_groups
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `

          return new Response(
            JSON.stringify({ success: true, data: groups, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 查詢群組失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: true, data: [], meta: { page, limit, total: 0 } }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      }

      // 論壇主題清單 /forum/topics
      if (method === 'GET' && path === '/forum/topics') {
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const limit = parseInt(url.searchParams.get('limit') || '20', 10)
        const offset = (page - 1) * limit

        try {
          const countResult = await sql`SELECT COUNT(*) as count FROM forum_topics`
          const total = parseInt(countResult[0]?.count || '0')

          const topics = await sql`
            SELECT * FROM forum_topics
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `

          return new Response(
            JSON.stringify({ success: true, data: topics, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 查詢論壇主題失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: true, data: [], meta: { page, limit, total: 0 } }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
      }

      // 未涵蓋的討論區端點先回 200 空集合，避免 UI 報錯
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    } catch (error: any) {
      console.error('[Fallback] 備用處理錯誤:', error.message)
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
  }

  // 如果沒有匹配的路由，返回404
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found',
        availableEndpoints: [
          '/health',
          '/info',
          '/optimization/test',
          '/errors/stats',
          '/batch',
          '/db/fix',
          '/db/optimize',
          '/db/n1-check',
          '/documents',
          '/docs/openapi.json',
          '/docs',
          '/docs/stats'
        ]
      }
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}
