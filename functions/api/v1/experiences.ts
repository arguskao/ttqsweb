/**
 * 經驗分享 API 端點
 * 使用 Neon tagged template 語法
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
}

// 驗證 JWT Token
async function verifyToken(request: Request, env: Env): Promise<any> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))

    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }

    return payload
  } catch (error) {
    console.error('[Auth] Token 解析失敗:', error)
    return null
  }
}

// GET /api/v1/experiences - 獲取經驗分享列表
export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      return Response.json(
        { success: false, error: { message: 'Database URL not configured' } },
        { status: 500 }
      )
    }

    const sql = neon(databaseUrl)
    const url = new URL(request.url)

    // 獲取查詢參數
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = (page - 1) * limit
    const featured = url.searchParams.get('featured')

    // 根據條件查詢
    let experiences: any[]
    let total: number

    if (featured === 'true') {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM experience_shares WHERE is_featured = true
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      experiences = await sql`
        SELECT 
          e.*,
          u.first_name,
          u.last_name
        FROM experience_shares e
        LEFT JOIN users u ON e.author_id = u.id
        WHERE e.is_featured = true
        ORDER BY e.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM experience_shares
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      experiences = await sql`
        SELECT 
          e.*,
          u.first_name,
          u.last_name
        FROM experience_shares e
        LEFT JOIN users u ON e.author_id = u.id
        ORDER BY e.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return Response.json({
      success: true,
      data: experiences.map((e: any) => ({
        ...e,
        authorName: `${e.first_name || ''} ${e.last_name || ''}`.trim()
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Experiences] 獲取經驗分享失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取經驗分享失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/experiences - 刪除經驗分享（管理員）
export async function onRequestDelete(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    // 驗證用戶身份
    const user = await verifyToken(request, env)
    if (!user || !user.userId) {
      return Response.json(
        { success: false, error: { message: '未授權，請先登入' } },
        { status: 401 }
      )
    }

    // 檢查是否為管理員
    if (user.userType !== 'admin') {
      return Response.json(
        { success: false, error: { message: '只有管理員可以刪除經驗分享' } },
        { status: 403 }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      return Response.json(
        { success: false, error: { message: 'Database URL not configured' } },
        { status: 500 }
      )
    }

    const sql = neon(databaseUrl)
    const url = new URL(request.url)
    const experienceId = url.searchParams.get('id')

    if (!experienceId) {
      return Response.json(
        { success: false, error: { message: '經驗分享 ID 為必填' } },
        { status: 400 }
      )
    }

    // 檢查經驗分享是否存在
    const existing = await sql`
      SELECT id, title FROM experience_shares WHERE id = ${parseInt(experienceId)}
    `

    if (existing.length === 0) {
      return Response.json(
        { success: false, error: { message: '經驗分享不存在' } },
        { status: 404 }
      )
    }

    // 刪除相關的評論記錄
    await sql`DELETE FROM experience_comments WHERE share_id = ${parseInt(experienceId)}`
    
    // 刪除經驗分享
    await sql`DELETE FROM experience_shares WHERE id = ${parseInt(experienceId)}`

    return Response.json({
      success: true,
      message: '經驗分享已刪除'
    })
  } catch (error: any) {
    console.error('[Experiences] 刪除經驗分享失敗:', error)
    return Response.json(
      { success: false, error: { message: '刪除經驗分享失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// POST /api/v1/experiences - 創建新經驗分享
export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    // 驗證用戶身份
    const user = await verifyToken(request, env)
    if (!user || !user.userId) {
      return Response.json(
        { success: false, error: { message: '未授權，請先登入' } },
        { status: 401 }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      return Response.json(
        { success: false, error: { message: 'Database URL not configured' } },
        { status: 500 }
      )
    }

    const sql = neon(databaseUrl)
    const body = (await request.json()) as any

    // 驗證必填欄位
    if (!body.title || !body.content) {
      return Response.json(
        { success: false, error: { message: '標題和內容為必填' } },
        { status: 400 }
      )
    }

    // 創建經驗分享
    const result = await sql`
      INSERT INTO experience_shares (title, content, share_type, tags, author_id)
      VALUES (
        ${body.title},
        ${body.content},
        ${body.category || body.share_type || 'success_story'},
        ${body.tags || []},
        ${user.userId}
      )
      RETURNING *
    `

    return Response.json({
      success: true,
      data: result[0]
    })
  } catch (error: any) {
    console.error('[Experiences] 創建經驗分享失敗:', error)
    return Response.json(
      { success: false, error: { message: '創建經驗分享失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// PUT /api/v1/experiences - 更新經驗分享（僅限管理員或作者）
export async function onRequestPut(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    // 驗證用戶身份
    const user = await verifyToken(request, env)
    if (!user || !user.userId) {
      return Response.json(
        { success: false, error: { message: '未授權，請先登入' } },
        { status: 401 }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      return Response.json(
        { success: false, error: { message: 'Database URL not configured' } },
        { status: 500 }
      )
    }

    const sql = neon(databaseUrl)
    const body = (await request.json()) as any

    // 驗證必填欄位
    if (!body.id) {
      return Response.json(
        { success: false, error: { message: '經驗分享 ID 為必填' } },
        { status: 400 }
      )
    }

    // 檢查經驗分享是否存在
    const existing = await sql`
      SELECT * FROM experience_shares WHERE id = ${body.id}
    `

    if (existing.length === 0) {
      return Response.json(
        { success: false, error: { message: '經驗分享不存在' } },
        { status: 404 }
      )
    }

    // 檢查權限：只有作者或管理員可以更新
    const experience = existing[0]
    const isAuthor = experience.author_id === user.userId
    const isAdmin = user.userType === 'instructor' // 講師可以管理精選

    if (!isAuthor && !isAdmin) {
      return Response.json(
        { success: false, error: { message: '無權限更新此經驗分享' } },
        { status: 403 }
      )
    }

    // 準備更新欄位
    const updateFields: any = {}
    
    if (body.title !== undefined) updateFields.title = body.title
    if (body.content !== undefined) updateFields.content = body.content
    if (body.share_type !== undefined) updateFields.share_type = body.share_type
    if (body.tags !== undefined) updateFields.tags = body.tags
    
    // 只有管理員可以設定精選
    if (body.is_featured !== undefined && isAdmin) {
      updateFields.is_featured = body.is_featured
    }

    // 如果沒有要更新的欄位
    if (Object.keys(updateFields).length === 0) {
      return Response.json(
        { success: false, error: { message: '沒有要更新的欄位' } },
        { status: 400 }
      )
    }

    // 執行更新 - 使用條件式更新
    let result: any[]
    
    if (updateFields.is_featured !== undefined && isAdmin) {
      // 管理員更新精選狀態
      result = await sql`
        UPDATE experience_shares 
        SET 
          title = COALESCE(${updateFields.title || null}, title),
          content = COALESCE(${updateFields.content || null}, content),
          share_type = COALESCE(${updateFields.share_type || null}, share_type),
          tags = COALESCE(${updateFields.tags || null}, tags),
          is_featured = ${updateFields.is_featured},
          updated_at = NOW()
        WHERE id = ${body.id}
        RETURNING *
      `
    } else {
      // 一般更新（不包含精選狀態）
      result = await sql`
        UPDATE experience_shares 
        SET 
          title = COALESCE(${updateFields.title || null}, title),
          content = COALESCE(${updateFields.content || null}, content),
          share_type = COALESCE(${updateFields.share_type || null}, share_type),
          tags = COALESCE(${updateFields.tags || null}, tags),
          updated_at = NOW()
        WHERE id = ${body.id}
        RETURNING *
      `
    }

    return Response.json({
      success: true,
      data: result[0]
    })
  } catch (error: any) {
    console.error('[Experiences] 更新經驗分享失敗:', error)
    return Response.json(
      { success: false, error: { message: '更新經驗分享失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// OPTIONS - CORS 預檢
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
