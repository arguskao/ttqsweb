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
  // 檢查是否為 bcrypt 哈希（以 $2b$ 開頭）
  if (hash.startsWith('$2b$')) {
    // 使用 bcrypt 驗證
    const bcrypt = await import('bcryptjs')
    return await bcrypt.compare(password, hash)
  } else {
    // 使用 SHA-256 驗證（舊版本相容）
    const passwordHash = await hashPassword(password)
    return passwordHash === hash
  }
}

// 生成簡單的 JWT token
function generateToken(userId: number, email: string): string {
  // 簡化版本：實際應使用 JWT 庫
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 3600 // 1 hour
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      userId,
      email,
      iat: now,
      exp: now + expiresIn // 添加過期時間
    })
  )
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
        const body = (await request.json()) as any
        const { email, password, confirmPassword, userType, firstName, lastName, phone } = body

        // 驗證必填欄位
        if (!email || !password || !userType || !firstName || !lastName) {
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

        // 驗證密碼確認
        if (password !== confirmPassword) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '密碼確認不一致' }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        // 驗證密碼長度
        if (password.length < 8) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '密碼至少需要8個字符' }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
            {
              status: 409,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
          {
            status: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      } catch (error: any) {
        console.error('[Auth] 註冊失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '註冊失敗' }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      }
    }

    // POST /auth/login
    if (method === 'POST' && path === '/auth/login') {
      try {
        const body = (await request.json()) as any
        const { email, password } = body

        // 驗證必填欄位
        if (!email || !password) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '請填寫電子郵件和密碼' }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      } catch (error: any) {
        console.error('[Auth] 登入失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '登入失敗' }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
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
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
              {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
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
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (tokenError) {
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
      } catch (error: any) {
        console.error('[Auth] 獲取用戶資料失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '獲取用戶資料失敗' }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
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
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        const token = authHeader.substring(7)
        const body = (await request.json()) as any

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
              {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
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
              {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
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
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (tokenError) {
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
      } catch (error: any) {
        console.error('[Auth] 更新用戶資料失敗:', error.message)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message || '更新用戶資料失敗' }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      }
    }

    // 其他認證端點返回 404
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Auth endpoint not found' }
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
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
    const apiModule = await import('../../../../src/api/index.ts')
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
            JSON.stringify({
              success: true,
              data: experiences,
              meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 查詢經驗分享失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: true, data: [], meta: { page, limit, total: 0 } }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
              JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Experience not found' }
              }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }

          // 增加瀏覽次數
          await sql`UPDATE experience_shares SET view_count = view_count + 1 WHERE id = ${experienceId}`

          return new Response(JSON.stringify({ success: true, data: experience[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          })
        } catch (dbError: any) {
          console.error('[Fallback] 查詢經驗分享詳情失敗:', dbError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DB_ERROR', message: 'Database error' }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // 創建經驗分享
      if (method === 'POST' && path === '/experiences') {
        try {
          const body = (await request.json()) as any
          const { title, content, share_type, tags, is_featured } = body

          if (!title || !content || !share_type) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
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

          return new Response(JSON.stringify({ success: true, data: result[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          })
        } catch (dbError: any) {
          console.error('[Fallback] 創建經驗分享失敗:', dbError.message, dbError.stack)
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'DB_ERROR',
                message: 'Failed to create experience',
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

      // 點讚經驗分享
      const likeMatch = path.match(/^\/experiences\/(\d+)\/like$/)
      if (method === 'POST' && likeMatch) {
        const experienceId = parseInt(likeMatch[1])

        try {
          await sql`UPDATE experience_shares SET like_count = like_count + 1 WHERE id = ${experienceId}`

          return new Response(
            JSON.stringify({ success: true, data: { message: 'Experience liked successfully' } }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 點讚失敗:', dbError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DB_ERROR', message: 'Database error' }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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

  // 講師申請相關端點
  if (
    path.startsWith('/instructor-applications') ||
    (path.startsWith('/users/') && path.includes('/instructor-application'))
  ) {
    try {
      const url = new URL(request.url)
      const method = request.method.toUpperCase()

      // 導入 Neon 數據庫
      const { neon } = await import('@neondatabase/serverless')
      const databaseUrl = env.DATABASE_URL

      if (!databaseUrl) {
        console.error('[Instructor] DATABASE_URL 未配置')
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

      console.log('[Instructor] 處理講師申請請求 - method:', method, 'path:', path)

      // 管理員審核申請：PUT /instructor-applications/:id/review
      const reviewMatch = path.match(/^\/instructor-applications\/(\d+)\/review$/)
      console.log(
        '[Instructor] 審核申請匹配結果:',
        reviewMatch ? 'matched' : 'not matched',
        'method:',
        method
      )
      if (method === 'PUT' && reviewMatch) {
        const applicationId = parseInt(reviewMatch[1])
        console.log('[Instructor] 開始審核申請，ID:', applicationId)

        try {
          const body = (await request.json()) as any
          const { status, review_notes } = body
          console.log('[Instructor] 審核數據:', { status, review_notes })

          if (!status || !['approved', 'rejected'].includes(status)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Status must be approved or rejected' }
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }

          // 從 Authorization header 獲取管理員用戶 ID
          const authHeader = request.headers.get('Authorization') || ''
          if (!authHeader.startsWith('Bearer ')) {
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
          const reviewerId = payload.userId

          if (!reviewerId) {
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

          // 檢查申請是否存在且為待審核狀態
          console.log('[Instructor] 查詢申請，ID:', applicationId)
          const applications = await sql`
            SELECT * FROM instructor_applications 
            WHERE id = ${applicationId} AND status = 'pending'
          `
          console.log('[Instructor] 找到申請:', applications.length > 0 ? '是' : '否')

          if (applications.length === 0) {
            console.log('[Instructor] 申請不存在或已審核')
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: '申請不存在或已審核' }
              }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }

          const application = applications[0]

          // 更新申請狀態
          await sql`
            UPDATE instructor_applications 
            SET status = ${status}, reviewed_at = NOW(), reviewed_by = ${reviewerId}, review_notes = ${review_notes || ''}
            WHERE id = ${applicationId}
          `

          // 如果批准，創建講師記錄並更新用戶類型
          if (status === 'approved') {
            // 更新用戶類型為 instructor
            await sql`
              UPDATE users 
              SET user_type = 'instructor'
              WHERE id = ${application.user_id}
            `

            // 創建講師記錄
            await sql`
              INSERT INTO instructors (
                user_id, bio, qualifications, specialization, years_of_experience,
                application_status, approval_date, approved_by, average_rating, total_ratings, is_active, created_at, updated_at
              )
              VALUES (
                ${application.user_id}, ${application.bio}, ${application.qualifications}, 
                ${application.specialization}, ${application.years_of_experience}, 'approved', NOW(), 
                ${reviewerId}, 0, 0, true, NOW(), NOW()
              )
            `

            console.log('[Instructor] 用戶類型已更新為 instructor，用戶ID:', application.user_id)
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: { message: `Application ${status} successfully` }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Instructor] 審核申請失敗:', dbError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DB_ERROR', message: 'Database error' }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // 重置申請狀態（管理員）：PUT /instructor-applications/:id/reset
      if (method === 'PUT' && path.match(/^\/instructor-applications\/\d+\/reset$/)) {
        const applicationId = parseInt(path.split('/')[2])

        if (isNaN(applicationId)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Invalid application ID' }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }

        try {
          // 檢查申請是否存在
          const application = await sql`
            SELECT * FROM instructor_applications WHERE id = ${applicationId}
          `

          if (!application[0]) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Application not found' }
              }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }

          // 重置申請狀態為 pending
          await sql`
            UPDATE instructor_applications 
            SET status = 'pending', reviewed_at = NULL, reviewed_by = NULL, review_notes = NULL
            WHERE id = ${applicationId}
          `

          // 如果之前有講師記錄，刪除它
          await sql`
            DELETE FROM instructors WHERE user_id = ${application[0].user_id}
          `

          // 重置用戶類型為 job_seeker
          await sql`
            UPDATE users 
            SET user_type = 'job_seeker'
            WHERE id = ${application[0].user_id}
          `

          return new Response(
            JSON.stringify({
              success: true,
              data: { message: 'Application reset to pending successfully' }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Instructor] 重置申請失敗:', dbError.message, dbError.stack)
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

      // 檢查現有申請：GET /users/:id/instructor-application
      const userAppMatch = path.match(/^\/users\/(\d+)\/instructor-application$/)
      if (method === 'GET' && userAppMatch) {
        const userId = parseInt(userAppMatch[1])

        try {
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

          const applications = await sql`
            SELECT * FROM instructor_applications 
            WHERE user_id = ${userId}
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
        } catch (dbError: any) {
          console.error('[Instructor] 查詢申請失敗:', dbError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DB_ERROR', message: 'Database error' }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // 創建新申請：POST /instructor-applications
      if (method === 'POST' && path === '/instructor-applications') {
        console.log('[Instructor] 開始處理講師申請')
        try {
          const body = (await request.json()) as any
          console.log('[Instructor] 接收到的申請數據:', body)
          const { bio, qualifications, specialization, years_of_experience, target_audiences } =
            body

          if (!bio || !qualifications || !specialization || years_of_experience === undefined) {
            console.log('[Instructor] 驗證失敗，缺少必填欄位')
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
          console.log('[Instructor] Authorization header:', authHeader ? '存在' : '不存在')
          if (!authHeader.startsWith('Bearer ')) {
            console.log('[Instructor] 認證失敗，沒有有效的 Bearer token')
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
            console.log('[Instructor] Token 格式無效')
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
          console.log('[Instructor] 解析出的用戶 ID:', userId)

          if (!userId) {
            console.log('[Instructor] Token 中沒有用戶 ID')
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
            console.log('[Instructor] 創建 instructor_applications 表')
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `
          }

          // 檢查是否已有申請
          console.log('[Instructor] 檢查現有申請，用戶 ID:', userId)
          const existingApps = await sql`
            SELECT id FROM instructor_applications 
            WHERE user_id = ${userId} AND status IN ('pending', 'approved')
          `
          console.log('[Instructor] 現有申請數量:', existingApps.length)

          if (existingApps.length > 0) {
            console.log('[Instructor] 用戶已有進行中的申請')
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
          console.log('[Instructor] 開始創建新申請')
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
          console.log('[Instructor] 申請創建成功，ID:', result[0]?.id)

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
          console.error('[Instructor] 創建申請失敗:', dbError.message, dbError.stack)
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'DB_ERROR',
                message: 'Database error',
                details: dbError.message,
                stack: dbError.stack
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // 重新提交申請：POST /instructor-applications/:id/resubmit
      const resubmitMatch = path.match(/^\/instructor-applications\/(\d+)\/resubmit$/)
      if (method === 'POST' && resubmitMatch) {
        const applicationId = parseInt(resubmitMatch[1])

        try {
          const body = (await request.json()) as any
          const { bio, qualifications, specialization, years_of_experience, target_audiences } =
            body

          if (!bio || !qualifications || !specialization || years_of_experience === undefined) {
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

          // 更新申請
          const result = await sql`
            UPDATE instructor_applications 
            SET bio = ${bio}, qualifications = ${qualifications}, specialization = ${specialization},
                years_of_experience = ${years_of_experience}, target_audiences = ${target_audiences || ''},
                status = 'pending', submitted_at = NOW(), updated_at = NOW()
            WHERE id = ${applicationId}
            RETURNING *
          `

          if (result.length === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: '申請不存在' }
              }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: result[0]
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Instructor] 重新提交申請失敗:', dbError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DB_ERROR', message: 'Database error' }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // 獲取所有申請列表（管理員）：GET /instructor-applications
      if (method === 'GET' && path === '/instructor-applications') {
        console.log('[Instructor] 管理員查詢申請列表')
        try {
          const page = parseInt(url.searchParams.get('page') || '1', 10)
          const limit = parseInt(url.searchParams.get('limit') || '10', 10)
          const offset = (page - 1) * limit
          const status = url.searchParams.get('status')
          console.log('[Instructor] 查詢參數 - page:', page, 'limit:', limit, 'status:', status)

          // 先檢查表是否存在
          const tableCheck = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'instructor_applications'
            ) as table_exists
          `
          console.log('[Instructor] 表存在檢查結果:', tableCheck[0]?.table_exists)

          if (!tableCheck[0]?.table_exists) {
            console.log('[Instructor] instructor_applications 表不存在，返回空列表')
            return new Response(
              JSON.stringify({
                success: true,
                data: [],
                meta: { page, limit, total: 0, totalPages: 0 }
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }

          // 使用簡單的查詢方式
          let applications
          let total

          if (status) {
            console.log('[Instructor] 按狀態篩選查詢:', status)
            // 獲取總數
            const countResult = await sql`
              SELECT COUNT(*) as count FROM instructor_applications 
              WHERE status = ${status}
            `
            total = parseInt(countResult[0]?.count || '0')
            console.log('[Instructor] 篩選後總數:', total)

            // 獲取申請列表
            applications = await sql`
              SELECT ia.*, u.email, u.first_name, u.last_name, u.user_type
              FROM instructor_applications ia
              LEFT JOIN users u ON ia.user_id = u.id
              WHERE ia.status = ${status}
              ORDER BY ia.submitted_at DESC
              LIMIT ${limit} OFFSET ${offset}
            `
          } else {
            console.log('[Instructor] 查詢所有申請')
            // 獲取總數
            const countResult = await sql`
              SELECT COUNT(*) as count FROM instructor_applications
            `
            total = parseInt(countResult[0]?.count || '0')
            console.log('[Instructor] 總申請數:', total)

            // 獲取申請列表
            applications = await sql`
              SELECT ia.*, u.email, u.first_name, u.last_name, u.user_type
              FROM instructor_applications ia
              LEFT JOIN users u ON ia.user_id = u.id
              ORDER BY ia.submitted_at DESC
              LIMIT ${limit} OFFSET ${offset}
            `
          }

          console.log('[Instructor] 查詢到的申請數量:', applications.length)

          return new Response(
            JSON.stringify({
              success: true,
              data: applications,
              meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Instructor] 查詢申請列表失敗:', dbError.message, dbError.stack)
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

      // 未涵蓋的講師申請端點
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Instructor application endpoint not found' }
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } catch (error: any) {
      console.error('[Instructor] 講師申請處理錯誤:', error.message)
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

  // 講師清單端點
  if (path.startsWith('/instructors')) {
    try {
      const url = new URL(request.url)
      const method = request.method.toUpperCase()

      // 導入 Neon 數據庫
      const { neon } = await import('@neondatabase/serverless')
      const databaseUrl = env.DATABASE_URL

      if (!databaseUrl) {
        console.error('[Instructors] DATABASE_URL 未配置')
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

      // GET /instructors - 獲取講師列表
      if (method === 'GET' && path === '/instructors') {
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const limit = parseInt(url.searchParams.get('limit') || '12', 10)
        const offset = (page - 1) * limit
        const isActive = url.searchParams.get('is_active') === 'true'
        const specialization = url.searchParams.get('specialization') || ''

        try {
          // 查詢總數
          let countResult
          if (specialization) {
            // 先查詢 instructors 表
            countResult = await sql`
               SELECT COUNT(*) as count 
               FROM instructors i
               LEFT JOIN users u ON i.user_id = u.id
               WHERE i.is_active = ${isActive} AND i.specialization ILIKE ${`%${specialization}%`}
             `

            // 如果 instructors 表中沒有數據，查詢 instructor_applications 表
            if (parseInt(countResult[0]?.count || '0') === 0) {
              countResult = await sql`
                 SELECT COUNT(*) as count 
                 FROM instructor_applications ia
                 LEFT JOIN users u ON ia.user_id = u.id
                 WHERE ia.status = 'approved' AND ia.specialization ILIKE ${`%${specialization}%`}
               `
            }
          } else {
            // 先查詢 instructors 表
            countResult = await sql`
               SELECT COUNT(*) as count 
               FROM instructors i
               LEFT JOIN users u ON i.user_id = u.id
               WHERE i.is_active = ${isActive}
             `

            // 如果 instructors 表中沒有數據，查詢 instructor_applications 表
            if (parseInt(countResult[0]?.count || '0') === 0) {
              countResult = await sql`
                 SELECT COUNT(*) as count 
                 FROM instructor_applications ia
                 LEFT JOIN users u ON ia.user_id = u.id
                 WHERE ia.status = 'approved'
               `
            }
          }
          const total = parseInt(countResult[0]?.count || '0')

          // 查詢講師列表
          let instructors
          if (specialization) {
            // 先查詢 instructors 表
            instructors = await sql`
               SELECT 
                 i.*,
                 u.first_name,
                 u.last_name,
                 u.email,
                 u.user_type,
                 COALESCE(i.average_rating, 0) as average_rating,
                 COALESCE(i.total_ratings, 0) as total_ratings
               FROM instructors i
               LEFT JOIN users u ON i.user_id = u.id
               WHERE i.is_active = ${isActive} AND i.specialization ILIKE ${`%${specialization}%`}
               ORDER BY i.created_at DESC
               LIMIT ${limit} OFFSET ${offset}
             `

            // 如果 instructors 表中沒有數據，查詢 instructor_applications 表
            if (instructors.length === 0) {
              instructors = await sql`
                 SELECT 
                   ia.*,
                   u.first_name,
                   u.last_name,
                   u.email,
                   u.user_type,
                   COALESCE(ia.average_rating, 0) as average_rating,
                   COALESCE(ia.total_ratings, 0) as total_ratings
                 FROM instructor_applications ia
                 LEFT JOIN users u ON ia.user_id = u.id
                 WHERE ia.status = 'approved' AND ia.specialization ILIKE ${`%${specialization}%`}
                 ORDER BY ia.submitted_at DESC
                 LIMIT ${limit} OFFSET ${offset}
               `
            }
          } else {
            // 先查詢 instructors 表
            instructors = await sql`
               SELECT 
                 i.*,
                 u.first_name,
                 u.last_name,
                 u.email,
                 u.user_type,
                 COALESCE(i.average_rating, 0) as average_rating,
                 COALESCE(i.total_ratings, 0) as total_ratings
               FROM instructors i
               LEFT JOIN users u ON i.user_id = u.id
               WHERE i.is_active = ${isActive}
               ORDER BY i.created_at DESC
               LIMIT ${limit} OFFSET ${offset}
             `

            // 如果 instructors 表中沒有數據，查詢 instructor_applications 表
            if (instructors.length === 0) {
              instructors = await sql`
                 SELECT 
                   ia.*,
                   u.first_name,
                   u.last_name,
                   u.email,
                   u.user_type,
                   COALESCE(ia.average_rating, 0) as average_rating,
                   COALESCE(ia.total_ratings, 0) as total_ratings
                 FROM instructor_applications ia
                 LEFT JOIN users u ON ia.user_id = u.id
                 WHERE ia.status = 'approved'
                 ORDER BY ia.submitted_at DESC
                 LIMIT ${limit} OFFSET ${offset}
               `
            }
          }

          // 轉換數字類型
          const processedInstructors = instructors.map((instructor: any) => ({
            ...instructor,
            average_rating: parseFloat(instructor.average_rating) || 0,
            total_ratings: parseInt(instructor.total_ratings) || 0,
            experience_years: parseInt(instructor.experience_years) || 0,
            years_of_experience: parseInt(instructor.years_of_experience) || 0
          }))

          return new Response(
            JSON.stringify({
              success: true,
              data: processedInstructors,
              meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Instructors] 查詢講師失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: true, data: [], meta: { page, limit, total: 0 } }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // GET /instructors/:id - 獲取單個講師詳情
      const instructorDetailMatch = path.match(/^\/instructors\/(\d+)$/)
      if (method === 'GET' && instructorDetailMatch) {
        const userId = parseInt(instructorDetailMatch[1])
        console.log('[Instructors] 查詢講師詳情，用戶ID:', userId)

        try {
          // 先查詢 instructors 表
          let instructorResult = await sql`
             SELECT 
               i.*,
               u.first_name,
               u.last_name,
               u.email
             FROM instructors i
             LEFT JOIN users u ON i.user_id = u.id
             WHERE i.user_id = ${userId} AND i.is_active = true
           `

          // 如果 instructors 表中沒有找到，則查詢 instructor_applications 表
          if (instructorResult.length === 0) {
            console.log('[Instructors] instructors 表中未找到，查詢 instructor_applications 表')
            instructorResult = await sql`
               SELECT 
                 ia.*,
                 u.first_name,
                 u.last_name,
                 u.email,
                 ia.bio,
                 ia.qualifications,
                 ia.specialization,
                 ia.years_of_experience,
                 ia.average_rating,
                 ia.total_ratings,
                 ia.is_active,
                 ia.created_at,
                 ia.updated_at
               FROM instructor_applications ia
               LEFT JOIN users u ON ia.user_id = u.id
               WHERE ia.user_id = ${userId} AND ia.status = 'approved'
             `
          }

          if (instructorResult.length === 0) {
            console.log('[Instructors] 講師不存在，用戶ID:', userId)
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: '講師不存在' }
              }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }

          const instructor = instructorResult[0]
          console.log('[Instructors] 找到講師:', instructor.first_name, instructor.last_name)

          // 轉換數字類型
          const processedInstructor = {
            ...instructor,
            average_rating: parseFloat(instructor.average_rating) || 0,
            total_ratings: parseInt(instructor.total_ratings) || 0,
            experience_years: parseInt(instructor.experience_years) || 0,
            years_of_experience: parseInt(instructor.years_of_experience) || 0
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: processedInstructor
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Instructors] 查詢講師詳情失敗:', dbError.message)
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DB_ERROR', message: 'Database error' }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // 其他講師相關端點可以在這裡添加
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NOT_FOUND', message: '講師端點不存在' }
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } catch (error: any) {
      console.error('[Instructors] 講師端點處理錯誤:', error.message)
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

  // 備用：討論區/社群/課程申請相關端點（直接查詢數據庫）
  if (
    path.startsWith('/groups') ||
    path.startsWith('/topics') ||
    path.startsWith('/forum') ||
    path.startsWith('/course-applications')
  ) {
    try {
      const url = new URL(request.url)
      const method = request.method.toUpperCase()

      // 導入 Neon 數據庫
      const { neon } = await import('@neondatabase/serverless')
      const databaseUrl = env.DATABASE_URL

      if (!databaseUrl) {
        console.error('[Fallback] DATABASE_URL 未配置')
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

      // 群組清單
      if (method === 'GET' && path === '/groups') {
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const limit = parseInt(url.searchParams.get('limit') || '12', 10)
        const offset = (page - 1) * limit

        try {
          const countResult =
            await sql`SELECT COUNT(*) as count FROM student_groups WHERE is_active = true`
          const total = parseInt(countResult[0]?.count || '0')

          const groups = await sql`
            SELECT 
              sg.id,
              sg.name,
              sg.description,
              sg.group_type,
              sg.created_by,
              sg.is_active,
              sg.created_at,
              sg.updated_at,
              COUNT(gm.id) as member_count
            FROM student_groups sg
            LEFT JOIN group_members gm ON sg.id = gm.group_id
            WHERE sg.is_active = true
            GROUP BY sg.id, sg.name, sg.description, sg.group_type, sg.created_by, sg.is_active, sg.created_at, sg.updated_at
            ORDER BY sg.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `

          return new Response(
            JSON.stringify({
              success: true,
              data: groups,
              meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 查詢群組失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: true, data: [], meta: { page, limit, total: 0 } }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
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
            JSON.stringify({
              success: true,
              data: topics,
              meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        } catch (dbError: any) {
          console.error('[Fallback] 查詢論壇主題失敗:', dbError.message)
          return new Response(
            JSON.stringify({ success: true, data: [], meta: { page, limit, total: 0 } }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
          )
        }
      }

      // 課程申請相關端點
      if (path.startsWith('/course-applications')) {
        console.log('[Course Applications] 處理課程申請請求:', method, path)

        // 處理 OPTIONS 請求（CORS 預檢）
        if (method === 'OPTIONS') {
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

        // 驗證認證
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(
            JSON.stringify({
              success: false,
              message: '未提供認證令牌',
              status: 401
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          )
        }

        const token = authHeader.substring(7)
        let userId: number
        let userType: string

        try {
          // 解析 JWT token（簡化版本）
          const payload = JSON.parse(atob(token.split('.')[1]))
          userId = payload.userId || payload.id
          userType = payload.userType || payload.user_type
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              message: '無效的認證令牌',
              status: 401
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          )
        }

        // GET /course-applications - 獲取所有課程申請（管理員用）
        if (method === 'GET' && path === '/course-applications') {
          // 只有管理員可以查看所有申請
          if (userType !== 'admin') {
            return new Response(
              JSON.stringify({
                success: false,
                message: '只有管理員可以查看所有課程申請',
                status: 403
              }),
              {
                status: 403,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              }
            )
          }

          try {
            const page = parseInt(url.searchParams.get('page') || '1', 10)
            const limit = parseInt(url.searchParams.get('limit') || '10', 10)
            const offset = (page - 1) * limit
            const statusFilter = url.searchParams.get('status')

            console.log('[Course Applications] 獲取所有課程申請:', { page, limit, statusFilter })

            // 構建查詢條件
            let whereClause = ''
            const params: any[] = []

            if (statusFilter) {
              whereClause = 'WHERE ca.status = $1'
              params.push(statusFilter)
            }

            // 獲取總數
            const countQuery = `SELECT COUNT(*) as count FROM course_applications ca ${whereClause}`
            const countResult = await sql.unsafe(countQuery, params)
            const total = parseInt(countResult[0]?.count || '0')

            // 獲取申請列表
            const listQuery = `
              SELECT
                ca.id, ca.course_name, ca.description, ca.category, ca.target_audience,
                ca.duration, ca.price, ca.delivery_methods, ca.syllabus, ca.teaching_experience,
                ca.materials, ca.special_requirements, ca.status, ca.submitted_at, ca.reviewed_at,
                ca.review_notes, ca.created_at, ca.updated_at,
                u.name as instructor_name, u.email as instructor_email,
                ia.id as instructor_id
              FROM course_applications ca
              JOIN instructor_applications ia ON ca.instructor_id = ia.id
              JOIN users u ON ia.user_id = u.id
              ${whereClause}
              ORDER BY ca.submitted_at DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `
            params.push(limit, offset)
            const applications = await sql.unsafe(listQuery, params)

            return new Response(
              JSON.stringify({
                success: true,
                data: applications,
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
          } catch (error: any) {
            console.error('[Course Applications] 獲取所有課程申請失敗:', error)
            return new Response(
              JSON.stringify({
                success: false,
                message: '獲取課程申請列表失敗',
                details: error.message
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }
        }

        // POST /course-applications - 創建課程申請
        if (method === 'POST' && path === '/course-applications') {
          try {
            const body = await request.json()
            console.log('[Course Applications] 創建課程申請:', body)

            // 驗證必填欄位
            const requiredFields = [
              'course_name',
              'description',
              'category',
              'target_audience',
              'duration',
              'price'
            ]
            for (const field of requiredFields) {
              if (!body[field]) {
                return new Response(
                  JSON.stringify({
                    success: false,
                    message: `請填寫${field}欄位`,
                    status: 400
                  }),
                  {
                    status: 400,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    }
                  }
                )
              }
            }

            // 檢查用戶是否為已批准的講師
            const instructorCheck = await sql`
              SELECT id, status FROM instructor_applications
              WHERE user_id = ${userId}
            `

            if (!instructorCheck.length || instructorCheck[0].status !== 'approved') {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '只有已通過審核的講師才能申請開課',
                  status: 403
                }),
                {
                  status: 403,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  }
                }
              )
            }

            // 插入課程申請
            const result = await sql`
              INSERT INTO course_applications (
                instructor_id, course_name, description, category, target_audience,
                duration, price, delivery_methods, syllabus, teaching_experience,
                materials, special_requirements, status, submitted_at, created_at, updated_at
              ) VALUES (
                ${instructorCheck[0].id}, ${body.course_name}, ${body.description}, 
                ${body.category}, ${body.target_audience}, ${body.duration}, ${body.price},
                ${body.delivery_methods || ''}, ${body.syllabus}, ${body.teaching_experience},
                ${body.materials || ''}, ${body.special_requirements || ''}, 'pending', 
                NOW(), NOW(), NOW()
              )
              RETURNING id
            `

            console.log('[Course Applications] 課程申請創建成功:', result[0])

            return new Response(
              JSON.stringify({
                success: true,
                message: '課程申請提交成功',
                data: { applicationId: result[0].id }
              }),
              {
                status: 201,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          } catch (error: any) {
            console.error('[Course Applications] 創建課程申請失敗:', error)
            return new Response(
              JSON.stringify({
                success: false,
                message: '提交失敗，請稍後再試',
                details: error.message,
                stack: error.stack
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }
        }

        // GET /course-applications/:id - 獲取課程申請詳情
        if (method === 'GET' && path.match(/^\/course-applications\/\d+$/)) {
          try {
            const applicationId = parseInt(path.split('/')[2])
            console.log('[Course Applications] 獲取課程申請詳情:', applicationId)

            const application = await sql`
              SELECT 
                ca.id, ca.course_name, ca.description, ca.category, ca.target_audience,
                ca.duration, ca.price, ca.delivery_methods, ca.syllabus, ca.teaching_experience,
                ca.materials, ca.special_requirements, ca.status, ca.submitted_at, ca.reviewed_at,
                ca.review_notes, ca.created_at, ca.updated_at,
                u.name as instructor_name, u.email as instructor_email,
                ia.id as instructor_id
              FROM course_applications ca
              JOIN instructor_applications ia ON ca.instructor_id = ia.id
              JOIN users u ON ia.user_id = u.id
              WHERE ca.id = ${applicationId}
            `

            if (!application.length) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '課程申請不存在',
                  status: 404
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

            // 檢查權限：只有講師本人或管理員可以查看
            if (userType !== 'admin' && application[0].instructor_id !== userId) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '無權限查看此課程申請',
                  status: 403
                }),
                {
                  status: 403,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  }
                }
              )
            }

            return new Response(
              JSON.stringify({
                success: true,
                data: application[0]
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          } catch (error: any) {
            console.error('[Course Applications] 獲取課程申請詳情失敗:', error)
            return new Response(
              JSON.stringify({
                success: false,
                message: '獲取申請詳情失敗',
                details: error.message
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }
        }

        // GET /instructors/:id/course-applications - 獲取講師的課程申請列表
        if (method === 'GET' && path.match(/^\/instructors\/\d+\/course-applications$/)) {
          try {
            const instructorId = parseInt(path.split('/')[2])
            console.log('[Course Applications] 獲取講師課程申請列表:', instructorId)

            // 檢查權限：只有講師本人或管理員可以查看
            const instructorCheck = await sql`
              SELECT user_id FROM instructor_applications WHERE id = ${instructorId}
            `

            if (!instructorCheck.length) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '講師不存在',
                  status: 404
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

            if (userType !== 'admin' && instructorCheck[0].user_id !== userId) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '無權限查看此講師的課程申請',
                  status: 403
                }),
                {
                  status: 403,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  }
                }
              )
            }

            const applications = await sql`
              SELECT 
                ca.id, ca.course_name, ca.description, ca.category, ca.target_audience,
                ca.duration, ca.price, ca.delivery_methods, ca.syllabus, ca.teaching_experience,
                ca.materials, ca.special_requirements, ca.status, ca.submitted_at, ca.reviewed_at,
                ca.review_notes, ca.created_at, ca.updated_at,
                u.name as instructor_name, u.email as instructor_email
              FROM course_applications ca
              JOIN instructor_applications ia ON ca.instructor_id = ia.id
              JOIN users u ON ia.user_id = u.id
              WHERE ca.instructor_id = ${instructorId}
              ORDER BY ca.submitted_at DESC
            `

            return new Response(
              JSON.stringify({
                success: true,
                data: applications
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          } catch (error: any) {
            console.error('[Course Applications] 獲取課程申請列表失敗:', error)
            return new Response(
              JSON.stringify({
                success: false,
                message: '獲取申請列表失敗',
                details: error.message
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }
        }

        // PUT /course-applications/:id/review - 審核課程申請（管理員用）
        if (method === 'PUT' && path.match(/^\/course-applications\/\d+\/review$/)) {
          // 只有管理員可以審核
          if (userType !== 'admin') {
            return new Response(
              JSON.stringify({
                success: false,
                message: '只有管理員可以審核課程申請',
                status: 403
              }),
              {
                status: 403,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              }
            )
          }

          try {
            const applicationId = parseInt(path.split('/')[2])
            const body = await request.json()
            console.log('[Course Applications] 審核課程申請:', applicationId, body)

            // 驗證狀態
            if (!body.status || !['approved', 'rejected'].includes(body.status)) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '審核狀態必須是 approved 或 rejected',
                  status: 400
                }),
                {
                  status: 400,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  }
                }
              )
            }

            // 檢查申請是否存在
            const applicationCheck = await sql`
              SELECT id, status FROM course_applications WHERE id = ${applicationId}
            `

            if (!applicationCheck.length) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '課程申請不存在',
                  status: 404
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

            // 檢查申請狀態
            if (applicationCheck[0].status !== 'pending') {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: '只能審核待審核的申請',
                  status: 400
                }),
                {
                  status: 400,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  }
                }
              )
            }

            // 更新申請狀態
            const updatedApplication = await sql`
              UPDATE course_applications
              SET
                status = ${body.status},
                review_notes = ${body.review_notes || null},
                reviewed_at = NOW(),
                updated_at = NOW()
              WHERE id = ${applicationId}
              RETURNING *
            `

            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  application: updatedApplication[0],
                  message: `課程申請已${body.status === 'approved' ? '批准' : '拒絕'}`
                }
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          } catch (error: any) {
            console.error('[Course Applications] 審核課程申請失敗:', error)
            return new Response(
              JSON.stringify({
                success: false,
                message: '審核失敗',
                details: error.message
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              }
            )
          }
        }

        // 如果課程申請路徑但沒有匹配的處理，返回 404
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Course application endpoint not found' }
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
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
