/**
 * 經驗分享詳情 API 端點
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
  params: {
    experienceId: string
  }
}

// GET /api/v1/experiences/:experienceId - 獲取經驗分享詳情
export async function onRequestGet(context: Context): Promise<Response> {
  const { env, params } = context

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
    const experienceId = parseInt(params.experienceId, 10)

    if (isNaN(experienceId)) {
      return Response.json(
        { success: false, error: { message: '無效的經驗分享 ID' } },
        { status: 400 }
      )
    }

    // 獲取經驗分享詳情
    const experiences = await sql`
      SELECT 
        e.*,
        u.first_name,
        u.last_name
      FROM experience_shares e
      LEFT JOIN users u ON e.author_id = u.id
      WHERE e.id = ${experienceId}
    `

    if (experiences.length === 0) {
      return Response.json(
        { success: false, error: { message: '經驗分享不存在' } },
        { status: 404 }
      )
    }

    const experience = experiences[0]

    // 增加瀏覽次數
    await sql`
      UPDATE experience_shares 
      SET view_count = view_count + 1
      WHERE id = ${experienceId}
    `

    // 獲取評論
    const comments = await sql`
      SELECT 
        c.*,
        u.first_name,
        u.last_name
      FROM experience_comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.share_id = ${experienceId}
      ORDER BY c.created_at ASC
    `

    return Response.json({
      success: true,
      data: {
        ...experience,
        authorName: `${experience.first_name || ''} ${experience.last_name || ''}`.trim(),
        view_count: (experience.view_count || 0) + 1,
        comments: comments.map((c: any) => ({
          ...c,
          authorName: `${c.first_name || ''} ${c.last_name || ''}`.trim()
        }))
      }
    })
  } catch (error: any) {
    console.error('[Experiences] 獲取經驗分享詳情失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取經驗分享詳情失敗', details: error.message } },
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
