/**
 * 經驗分享按讚 API 端點
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

// POST /api/v1/experiences/:experienceId/like - 按讚
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
    const experienceId = parseInt(params.experienceId, 10)

    if (isNaN(experienceId)) {
      return Response.json(
        { success: false, error: { message: '無效的經驗分享 ID' } },
        { status: 400 }
      )
    }

    // 檢查經驗分享是否存在
    const experience = await sql`
      SELECT id FROM experience_shares WHERE id = ${experienceId}
    `

    if (experience.length === 0) {
      return Response.json(
        { success: false, error: { message: '經驗分享不存在' } },
        { status: 404 }
      )
    }

    // 增加按讚數
    await sql`
      UPDATE experience_shares 
      SET like_count = like_count + 1
      WHERE id = ${experienceId}
    `

    return Response.json({
      success: true,
      message: '按讚成功'
    })
  } catch (error: any) {
    console.error('[Experiences] 按讚失敗:', error)
    return Response.json(
      { success: false, error: { message: '按讚失敗', details: error.message } },
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
