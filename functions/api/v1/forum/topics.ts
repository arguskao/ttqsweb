/**
 * 論壇主題 API 端點
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
    if (parts.length !== 3 || !parts[1]) return null

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

// GET /api/v1/forum/topics - 獲取討論主題列表
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
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit
    const groupId = url.searchParams.get('group_id')
    const category = url.searchParams.get('category')
    const sortBy = url.searchParams.get('sortBy') || 'latest'

    // 根據條件構建不同的查詢（使用 tagged template）
    let topics: any[]
    let total: number

    if (groupId && category) {
      const groupIdNum = parseInt(groupId)
      const countResult = await sql`SELECT COUNT(*) as count FROM forum_topics WHERE group_id = ${groupIdNum} AND category = ${category}`
      total = parseInt(countResult[0]?.count || '0', 10)

      topics = await sql`
        SELECT t.*, u.first_name, u.last_name
        FROM forum_topics t
        LEFT JOIN users u ON t.author_id = u.id
        WHERE t.group_id = ${groupIdNum} AND t.category = ${category}
        ORDER BY t.is_pinned DESC, t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (groupId) {
      const groupIdNum = parseInt(groupId)
      const countResult = await sql`SELECT COUNT(*) as count FROM forum_topics WHERE group_id = ${groupIdNum}`
      total = parseInt(countResult[0]?.count || '0', 10)

      topics = await sql`
        SELECT t.*, u.first_name, u.last_name
        FROM forum_topics t
        LEFT JOIN users u ON t.author_id = u.id
        WHERE t.group_id = ${groupIdNum}
        ORDER BY t.is_pinned DESC, t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (category) {
      const countResult = await sql`SELECT COUNT(*) as count FROM forum_topics WHERE category = ${category}`
      total = parseInt(countResult[0]?.count || '0', 10)

      topics = await sql`
        SELECT t.*, u.first_name, u.last_name
        FROM forum_topics t
        LEFT JOIN users u ON t.author_id = u.id
        WHERE t.category = ${category}
        ORDER BY t.is_pinned DESC, t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      const countResult = await sql`SELECT COUNT(*) as count FROM forum_topics`
      total = parseInt(countResult[0]?.count || '0', 10)

      topics = await sql`
        SELECT t.*, u.first_name, u.last_name
        FROM forum_topics t
        LEFT JOIN users u ON t.author_id = u.id
        ORDER BY t.is_pinned DESC, t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // 根據排序方式重新排序（在記憶體中）
    if (sortBy === 'popular') {
      topics.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    } else if (sortBy === 'unanswered') {
      topics = topics.filter(t => (t.reply_count || 0) === 0)
    }

    return Response.json({
      success: true,
      data: topics.map((t: any) => ({
        ...t,
        authorName: `${t.first_name || ''} ${t.last_name || ''}`.trim()
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Forum] 獲取討論主題失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取討論主題失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/forum/topics - 刪除討論主題（管理員）
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
        { success: false, error: { message: '只有管理員可以刪除討論主題' } },
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
    const topicId = url.searchParams.get('id')

    if (!topicId) {
      return Response.json(
        { success: false, error: { message: '討論主題 ID 為必填' } },
        { status: 400 }
      )
    }

    // 檢查討論主題是否存在
    const existing = await sql`
      SELECT id, title FROM forum_topics WHERE id = ${parseInt(topicId)}
    `

    if (existing.length === 0) {
      return Response.json(
        { success: false, error: { message: '討論主題不存在' } },
        { status: 404 }
      )
    }

    // 刪除相關的回覆
    await sql`DELETE FROM forum_replies WHERE topic_id = ${parseInt(topicId)}`
    
    // 刪除討論主題
    await sql`DELETE FROM forum_topics WHERE id = ${parseInt(topicId)}`

    return Response.json({
      success: true,
      message: '討論主題已刪除'
    })
  } catch (error: any) {
    console.error('[Forum] 刪除討論主題失敗:', error)
    return Response.json(
      { success: false, error: { message: '刪除討論主題失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// POST /api/v1/forum/topics - 創建新討論主題
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
    if (!body.title || !body.content || !body.category) {
      return Response.json(
        { success: false, error: { message: '標題、內容和分類為必填' } },
        { status: 400 }
      )
    }

    // 創建討論主題
    const result = await sql`
      INSERT INTO forum_topics (title, content, category, group_id, author_id)
      VALUES (
        ${body.title},
        ${body.content},
        ${body.category},
        ${body.groupId || null},
        ${user.userId}
      )
      RETURNING *
    `

    return Response.json({
      success: true,
      data: result[0]
    })
  } catch (error: any) {
    console.error('[Forum] 創建討論主題失敗:', error)
    return Response.json(
      { success: false, error: { message: '創建討論主題失敗', details: error.message } },
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
