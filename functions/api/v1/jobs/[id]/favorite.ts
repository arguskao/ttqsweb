interface Env {
  DATABASE_URL?: string
}

interface Context {
  request: Request
  env: Env
  params: { id: string }
}

async function getUserFromAuth(request: Request): Promise<{ id: number; userType?: string }> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ success: false, message: '未提供認證 token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  const token = authHeader.substring(7)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.userId || payload.user_id || payload.id || payload.sub
    if (!userId) throw new Error('Token payload missing user id')
    return { id: Number(userId), userType: payload.userType || payload.role }
  } catch {
    throw new Response(JSON.stringify({ success: false, message: '無效的 token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

async function ensureTables(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS job_favorites (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, user_id)
    );
  `
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env, params } = context
  try {
    const jobId = parseInt(params.id, 10)
    if (!jobId) {
      return new Response(JSON.stringify({ success: false, message: '無效的工作ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    const { neon } = await import('@neondatabase/serverless')
    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ success: false, message: 'Database URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    const sql = neon(env.DATABASE_URL)
    await ensureTables(sql)

    const user = await getUserFromAuth(request)
    if (user.userType !== 'job_seeker') {
      return new Response(JSON.stringify({ success: false, message: '僅求職者可使用收藏功能' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // 插入收藏（若已存在則忽略）
    try {
      await sql`INSERT INTO job_favorites (job_id, user_id) VALUES (${jobId}, ${user.id}) ON CONFLICT (job_id, user_id) DO NOTHING;`
    } catch (e) {}

    return new Response(JSON.stringify({ success: true, data: { jobId } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (res: any) {
    if (res instanceof Response) return res
    return new Response(JSON.stringify({ success: false, message: '收藏工作失敗' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

export async function onRequestDelete(context: Context): Promise<Response> {
  const { request, env, params } = context
  try {
    const jobId = parseInt(params.id, 10)
    const { neon } = await import('@neondatabase/serverless')
    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ success: false, message: 'Database URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    const sql = neon(env.DATABASE_URL)
    await ensureTables(sql)
    const user = await getUserFromAuth(request)
    if (user.userType !== 'job_seeker') {
      return new Response(JSON.stringify({ success: false, message: '僅求職者可使用收藏功能' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    await sql`DELETE FROM job_favorites WHERE job_id = ${jobId} AND user_id = ${user.id}`
    return new Response(JSON.stringify({ success: true, data: { jobId } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (res: any) {
    if (res instanceof Response) return res
    return new Response(JSON.stringify({ success: false, message: '取消收藏失敗' }), {
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
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}


