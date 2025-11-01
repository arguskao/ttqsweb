/**
 * 管理員經驗分享管理 API
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
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

// GET /api/v1/admin/experiences - 獲取所有經驗分享（管理員）
export async function onRequestGet(context: Context): Promise<Response> {
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

    // 檢查是否為管理員
    if (user.userType !== 'admin') {
      return Response.json(
        { success: false, error: { message: '只有管理員可以管理經驗分享' } },
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
    const url = new URL(request.url)

    // 獲取查詢參數
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    // 獲取所有經驗分享（用於管理）
    const countResult = await sql`
      SELECT COUNT(*) as count FROM experience_shares
    `
    const total = parseInt(countResult[0]?.count || '0', 10)

    const experiences = await sql`
      SELECT 
        e.*,
        u.first_name,
        u.last_name,
        e.like_count as likes_count,
        e.comment_count as comments_count
      FROM experience_shares e
      LEFT JOIN users u ON e.author_id = u.id
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return Response.json({
      success: true,
      data: experiences.map((e: any) => ({
        ...e,
        authorName: `${e.first_name || ''} ${e.last_name || ''}`.trim()
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[AdminExperiences] 獲取經驗分享失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取經驗分享失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/admin/experiences - 刪除經驗分享（管理員）
export async function onRequestDelete(context: Context): Promise<Response> {
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

    // 檢查是否為管理員
    if (user.userType !== 'admin') {
      return Response.json(
        { success: false, error: { message: '只有管理員可以刪除經驗分享' } },
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
    const url = new URL(request.url)
    const experienceId = url.searchParams.get('id')

    if (!experienceId) {
      return Response.json(
        { success: false, error: { message: '經驗分享 ID 為必填' } },
        { status: 400 }
      )
    }

    // 檢查經驗分享是否存在
    const existing = await sql`
      SELECT id, title FROM experience_shares WHERE id = ${parseInt(experienceId)}
    `

    if (existing.length === 0) {
      return Response.json(
        { success: false, error: { message: '經驗分享不存在' } },
        { status: 404 }
      )
    }

    // 刪除相關的評論記錄
    await sql`DELETE FROM experience_comments WHERE share_id = ${parseInt(experienceId)}`
    
    // 刪除經驗分享
    await sql`DELETE FROM experience_shares WHERE id = ${parseInt(experienceId)}`

    return Response.json({
      success: true,
      message: '經驗分享已刪除'
    })
  } catch (error: any) {
    console.error('[AdminExperiences] 刪除經驗分享失敗:', error)
    return Response.json(
      { success: false, error: { message: '刪除經驗分享失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// PUT /api/v1/admin/experiences - 更新經驗分享精選狀態（管理員）
export async function onRequestPut(context: Context): Promise<Response> {
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

    // 檢查是否為管理員
    if (user.userType !== 'admin') {
      return Response.json(
        { success: false, error: { message: '只有管理員可以管理經驗分享' } },
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
    const body = (await request.json()) as any

    // 驗證必填欄位
    if (!body.id || body.is_featured === undefined) {
      return Response.json(
        { success: false, error: { message: '經驗分享 ID 和精選狀態為必填' } },
        { status: 400 }
      )
    }

    // 檢查經驗分享是否存在
    const existing = await sql`
      SELECT * FROM experience_shares WHERE id = ${body.id}
    `

    if (existing.length === 0) {
      return Response.json(
        { success: false, error: { message: '經驗分享不存在' } },
        { status: 404 }
      )
    }

    // 更新精選狀態
    const result = await sql`
      UPDATE experience_shares 
      SET 
        is_featured = ${body.is_featured},
        updated_at = NOW()
      WHERE id = ${body.id}
      RETURNING *
    `

    return Response.json({
      success: true,
      data: result[0],
      message: body.is_featured ? '已設為精選' : '已取消精選'
    })
  } catch (error: any) {
    console.error('[AdminExperiences] 更新精選狀態失敗:', error)
    return Response.json(
      { success: false, error: { message: '更新精選狀態失敗', details: error.message } },
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}