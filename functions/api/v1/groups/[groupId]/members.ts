/**
 * 群組成員 API 端點
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

// GET /api/v1/groups/:groupId/members - 獲取群組成員列表
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

    // 獲取群組成員列表
    const members = await sql`
      SELECT 
        gm.id,
        gm.role,
        gm.joined_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ${groupId}
      ORDER BY gm.joined_at ASC
    `

    return Response.json({
      success: true,
      data: members.map(m => ({
        id: m.id,
        userId: m.user_id,
        userName: `${m.first_name} ${m.last_name}`,
        email: m.email,
        role: m.role,
        joinedAt: m.joined_at
      }))
    })
  } catch (error: any) {
    console.error('[Groups] 獲取成員列表失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取成員列表失敗', details: error.message } },
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
