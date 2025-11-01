/**
 * 討論主題回覆 API 端點
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
  params: {
    topicId: string
  }
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

// POST /api/v1/forum/topics/[topicId]/replies - 創建回覆
export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env, params } = context

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
    const topicId = parseInt(params.topicId, 10)

    if (isNaN(topicId)) {
      return Response.json(
        { success: false, error: { message: '無效的主題 ID' } },
        { status: 400 }
      )
    }

    const body = (await request.json()) as any

    // 驗證必填欄位
    if (!body.content) {
      return Response.json(
        { success: false, error: { message: '回覆內容為必填' } },
        { status: 400 }
      )
    }

    // 檢查主題是否存在且未鎖定
    const topics = await sql`
      SELECT id, is_locked FROM forum_topics WHERE id = ${topicId}
    `

    if (topics.length === 0) {
      return Response.json(
        { success: false, error: { message: '討論主題不存在' } },
        { status: 404 }
      )
    }

    if (topics[0].is_locked) {
      return Response.json(
        { success: false, error: { message: '該主題已被鎖定，無法回覆' } },
        { status: 403 }
      )
    }

    // 創建回覆
    const result = await sql`
      INSERT INTO forum_replies (topic_id, author_id, content)
      VALUES (${topicId}, ${user.userId}, ${body.content})
      RETURNING *
    `

    // 更新主題的回覆數量
    await sql`
      UPDATE forum_topics 
      SET reply_count = COALESCE(reply_count, 0) + 1,
          updated_at = NOW()
      WHERE id = ${topicId}
    `

    // 獲取用戶資訊
    const users = await sql`
      SELECT first_name, last_name FROM users WHERE id = ${user.userId}
    `

    const userData = users[0] || {}

    return Response.json({
      success: true,
      data: {
        ...result[0],
        authorName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        likeCount: 0,
        isSolution: false
      }
    })
  } catch (error: any) {
    console.error('[Forum] 創建回覆失敗:', error)
    return Response.json(
      { success: false, error: { message: '創建回覆失敗', details: error.message } },
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