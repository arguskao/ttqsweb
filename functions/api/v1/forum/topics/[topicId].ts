/**
 * 單個討論主題 API 端點
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

// GET /api/v1/forum/topics/[topicId] - 獲取單個討論主題詳情
export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env, params } = context

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
    const topicId = parseInt(params.topicId, 10)

    if (isNaN(topicId)) {
      return Response.json(
        { success: false, error: { message: '無效的主題 ID' } },
        { status: 400 }
      )
    }

    // 獲取主題詳情
    const topics = await sql`
      SELECT 
        t.*,
        u.first_name,
        u.last_name
      FROM forum_topics t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ${topicId}
    `

    if (topics.length === 0) {
      return Response.json(
        { success: false, error: { message: '討論主題不存在' } },
        { status: 404 }
      )
    }

    const topic = topics[0]

    // 獲取回覆
    const replies = await sql`
      SELECT 
        r.*,
        u.first_name,
        u.last_name
      FROM forum_replies r
      LEFT JOIN users u ON r.author_id = u.id
      WHERE r.topic_id = ${topicId}
      ORDER BY r.created_at ASC
    `

    // 增加瀏覽次數
    await sql`
      UPDATE forum_topics 
      SET view_count = COALESCE(view_count, 0) + 1
      WHERE id = ${topicId}
    `

    return Response.json({
      success: true,
      data: {
        ...topic,
        author_name: `${topic.first_name || ''} ${topic.last_name || ''}`.trim(),
        replies: replies.map((r: any) => ({
          ...r,
          authorName: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          likeCount: r.like_count || 0,
          isSolution: r.is_solution || false
        }))
      }
    })
  } catch (error: any) {
    console.error('[Forum] 獲取討論主題詳情失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取討論主題詳情失敗', details: error.message } },
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