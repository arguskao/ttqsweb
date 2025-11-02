/**
 * 訓練計劃 API 端點
 * 使用 Neon tagged template 語法
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

// GET /api/v1/ttqs/plans - 獲取訓練計劃列表
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
    const status = url.searchParams.get('status')

    // 根據條件查詢
    let plans: any[]
    let total: number

    if (status) {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM training_plans WHERE status = ${status}
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      plans = await sql`
        SELECT 
          tp.*,
          u.first_name,
          u.last_name
        FROM training_plans tp
        LEFT JOIN users u ON tp.created_by = u.id
        WHERE tp.status = ${status}
        ORDER BY tp.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM training_plans
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      plans = await sql`
        SELECT 
          tp.*,
          u.first_name,
          u.last_name
        FROM training_plans tp
        LEFT JOIN users u ON tp.created_by = u.id
        ORDER BY tp.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return Response.json({
      success: true,
      data: plans.map((p: any) => ({
        ...p,
        creatorName: `${p.first_name || ''} ${p.last_name || ''}`.trim()
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Training Plans] 獲取訓練計劃失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取訓練計劃失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// POST /api/v1/ttqs/plans - 創建新訓練計劃
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
    const body = (await request.json()) as any

    // 驗證必填欄位
    if (!body.title || !body.objectives) {
      return Response.json(
        { success: false, error: { message: '標題和目標為必填' } },
        { status: 400 }
      )
    }

    // 處理日期欄位：空字串轉換為 null
    const startDate = body.start_date && body.start_date.trim() !== '' ? body.start_date : null
    const endDate = body.end_date && body.end_date.trim() !== '' ? body.end_date : null

    // 創建訓練計劃
    const result = await sql`
      INSERT INTO training_plans (
        title,
        description,
        objectives,
        target_audience,
        duration_weeks,
        start_date,
        end_date,
        created_by,
        status
      )
      VALUES (
        ${body.title},
        ${body.description || null},
        ${body.objectives},
        ${body.target_audience || null},
        ${body.duration_weeks ? parseInt(body.duration_weeks) : null},
        ${startDate},
        ${endDate},
        ${user.userId},
        ${body.status || 'draft'}
      )
      RETURNING *
    `

    return Response.json({
      success: true,
      data: result[0]
    })
  } catch (error: any) {
    console.error('[Training Plans] 創建訓練計劃失敗:', error)
    return Response.json(
      { success: false, error: { message: '創建訓練計劃失敗', details: error.message } },
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

