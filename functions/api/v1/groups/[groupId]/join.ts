/**
 * 加入群組 API 端點
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
  params: {
    groupId: string
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

// POST /api/v1/groups/:groupId/join - 加入群組
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
    const groupId = parseInt(params.groupId, 10)

    if (isNaN(groupId)) {
      return Response.json(
        { success: false, error: { message: '無效的群組 ID' } },
        { status: 400 }
      )
    }

    // 檢查群組是否存在
    const group = await sql`
      SELECT id FROM student_groups WHERE id = ${groupId} AND is_active = true
    `

    if (group.length === 0) {
      return Response.json(
        { success: false, error: { message: '群組不存在' } },
        { status: 404 }
      )
    }

    // 檢查是否已經是成員
    const existingMember = await sql`
      SELECT id FROM group_members 
      WHERE group_id = ${groupId} AND user_id = ${user.userId}
    `

    if (existingMember.length > 0) {
      return Response.json(
        { success: false, error: { message: '您已經是該群組的成員' } },
        { status: 400 }
      )
    }

    // 加入群組
    await sql`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (${groupId}, ${user.userId}, 'member')
    `

    return Response.json({
      success: true,
      message: '成功加入群組'
    })
  } catch (error: any) {
    console.error('[Groups] 加入群組失敗:', error)
    return Response.json(
      { success: false, error: { message: '加入群組失敗', details: error.message } },
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
