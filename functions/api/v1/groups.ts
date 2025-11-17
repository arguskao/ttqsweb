/**
 * 群組 API 端點
 * 處理群組的 CRUD 操作
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
  data?: {
    user?: {
      userId: number
      email: string
      userType: string
    }
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
    // 簡單的 JWT 解析（不驗證簽名，因為在 Cloudflare Workers 中驗證較複雜）
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    
    const payload = JSON.parse(atob(parts[1]))
    
    // 檢查過期時間
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }
    
    return payload
  } catch (error) {
    console.error('[Auth] Token 解析失敗:', error)
    return null
  }
}

// GET /api/v1/groups - 獲取群組列表
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
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = (page - 1) * limit

    // 獲取總數
    const countResult = await sql`
      SELECT COUNT(*) as count FROM student_groups WHERE is_active = true
    `
    const total = parseInt(countResult[0]?.count || '0', 10)

    // 獲取群組列表（包含成員數量）
    const groups = await sql`
      SELECT 
        g.*,
        COUNT(gm.id) as member_count
      FROM student_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.is_active = true
      GROUP BY g.id
      ORDER BY g.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return Response.json({
      success: true,
      data: groups.map(g => ({
        ...g,
        memberCount: parseInt(g.member_count || '0', 10)
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Groups] 獲取群組列表失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取群組列表失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// POST /api/v1/groups - 創建新群組
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
    const body = await request.json() as any

    // 驗證必填欄位
    if (!body.name || !body.description) {
      return Response.json(
        { success: false, error: { message: '群組名稱和描述為必填' } },
        { status: 400 }
      )
    }

    // 創建群組
    const result = await sql`
      INSERT INTO student_groups (name, description, group_type, created_by)
      VALUES (
        ${body.name},
        ${body.description},
        ${body.groupType || 'course'},
        ${user.userId}
      )
      RETURNING *
    `

    const newGroup = result[0]

    // 自動將創建者加入群組並設為管理員
    await sql`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (${newGroup.id}, ${user.userId}, 'admin')
    `

    return Response.json({
      success: true,
      data: newGroup,
      message: '群組創建成功'
    })
  } catch (error: any) {
    console.error('[Groups] 創建群組失敗:', error)
    return Response.json(
      { success: false, error: { message: '創建群組失敗', details: error.message } },
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
