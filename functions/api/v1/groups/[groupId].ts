/**
 * 單個群組 API 端點
 * 處理特定群組的操作（刪除等）
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

// GET /api/v1/groups/:groupId - 獲取單個群組詳情
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
    const groupId = parseInt(params.groupId, 10)

    if (isNaN(groupId)) {
      return Response.json(
        { success: false, error: { message: '無效的群組 ID' } },
        { status: 400 }
      )
    }

    // 獲取群組資訊（包含成員數量）
    const groups = await sql`
      SELECT 
        g.*,
        COUNT(gm.id) as member_count
      FROM student_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id = ${groupId} AND g.is_active = true
      GROUP BY g.id
    `

    if (groups.length === 0) {
      return Response.json(
        { success: false, error: { message: '群組不存在' } },
        { status: 404 }
      )
    }

    const group = groups[0]

    return Response.json({
      success: true,
      data: {
        ...group,
        memberCount: parseInt(group.member_count || '0', 10)
      }
    })
  } catch (error: any) {
    console.error('[Groups] 獲取群組詳情失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取群組詳情失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/groups/:groupId - 刪除群組（僅管理員）
export async function onRequestDelete(context: Context): Promise<Response> {
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

    // 檢查是否為管理員
    if (user.userType !== 'admin') {
      return Response.json(
        { success: false, error: { message: '只有管理員可以刪除群組' } },
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
    const groupId = parseInt(params.groupId, 10)

    if (isNaN(groupId)) {
      return Response.json(
        { success: false, error: { message: '無效的群組 ID' } },
        { status: 400 }
      )
    }

    // 檢查群組是否存在
    const group = await sql`
      SELECT id FROM student_groups WHERE id = ${groupId}
    `

    if (group.length === 0) {
      return Response.json(
        { success: false, error: { message: '群組不存在' } },
        { status: 404 }
      )
    }

    // 軟刪除：將 is_active 設為 false
    await sql`
      UPDATE student_groups 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${groupId}
    `

    return Response.json({
      success: true,
      message: '群組已刪除'
    })
  } catch (error: any) {
    console.error('[Groups] 刪除群組失敗:', error)
    return Response.json(
      { success: false, error: { message: '刪除群組失敗', details: error.message } },
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
