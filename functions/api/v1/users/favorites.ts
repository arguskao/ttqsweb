interface Env {
  DATABASE_URL?: string
}

interface Context {
  request: Request
  env: Env
}

function unauthorized(message: string): Response {
  return new Response(JSON.stringify({ success: false, message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return unauthorized('未提供認證 token')
    const token = authHeader.substring(7)
    let userId: number
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.userId || payload.user_id || payload.id || payload.sub
      if (!userId) return unauthorized('無效的 token')
      // 移除用戶類型限制，允許所有登入用戶查看自己的收藏
    } catch {
      return unauthorized('無效的 token')
    }

    const { neon } = await import('@neondatabase/serverless')
    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ success: false, message: 'Database URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    const sql = neon(env.DATABASE_URL)

    await sql`
      CREATE TABLE IF NOT EXISTS job_favorites (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, user_id)
      );
    `

    const favorites = await sql`
      SELECT jf.job_id, jf.created_at, j.title, j.location, j.salary_min, j.salary_max
      FROM job_favorites jf
      LEFT JOIN jobs j ON j.id = jf.job_id
      WHERE jf.user_id = ${userId}
      ORDER BY jf.created_at DESC
    `

    return new Response(
      JSON.stringify({ success: true, data: favorites }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: '取得收藏清單失敗' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}


