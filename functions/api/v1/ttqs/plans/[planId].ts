/**
 * 訓練計劃詳細 API 端點
 * 使用 Neon tagged template 語法
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
  params: {
    planId: string
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

// GET /api/v1/ttqs/plans/:planId - 獲取訓練計劃詳情
export async function onRequestGet(context: Context): Promise<Response> {
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
    const planId = parseInt(params.planId, 10)

    if (isNaN(planId)) {
      return Response.json(
        { success: false, error: { message: '無效的訓練計劃 ID' } },
        { status: 400 }
      )
    }

    // 查詢訓練計劃
    const plans = await sql`
      SELECT 
        tp.*,
        u.first_name,
        u.last_name
      FROM training_plans tp
      LEFT JOIN users u ON tp.created_by = u.id
      WHERE tp.id = ${planId}
    `

    if (plans.length === 0) {
      return Response.json(
        { success: false, error: { message: '訓練計劃不存在' } },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: {
        ...plans[0],
        creatorName: `${plans[0].first_name || ''} ${plans[0].last_name || ''}`.trim()
      }
    })
  } catch (error: any) {
    console.error('[Training Plans] 獲取訓練計劃詳情失敗:', error)
    return Response.json(
      { success: false, error: { message: '獲取訓練計劃詳情失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// PUT /api/v1/ttqs/plans/:planId - 更新訓練計劃
export async function onRequestPut(context: Context): Promise<Response> {
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
    const planId = parseInt(params.planId, 10)
    const body = (await request.json()) as any

    if (isNaN(planId)) {
      return Response.json(
        { success: false, error: { message: '無效的訓練計劃 ID' } },
        { status: 400 }
      )
    }

    // 檢查訓練計劃是否存在
    const existing = await sql`
      SELECT * FROM training_plans WHERE id = ${planId}
    `

    if (existing.length === 0) {
      return Response.json(
        { success: false, error: { message: '訓練計劃不存在' } },
        { status: 404 }
      )
    }

    // 檢查權限：只有創建者或管理員可以更新
    const plan = existing[0]
    const isCreator = plan.created_by === user.userId
    const isAdmin = user.userType === 'admin'

    if (!isCreator && !isAdmin) {
      return Response.json(
        { success: false, error: { message: '無權限更新此訓練計劃' } },
        { status: 403 }
      )
    }

    // 處理日期欄位：空字串轉換為 null
    const startDate = body.start_date !== undefined 
      ? (body.start_date && body.start_date.trim() !== '' ? body.start_date : null)
      : plan.start_date
    const endDate = body.end_date !== undefined
      ? (body.end_date && body.end_date.trim() !== '' ? body.end_date : null)
      : plan.end_date

    // 更新訓練計劃
    const result = await sql`
      UPDATE training_plans 
      SET 
        title = COALESCE(${body.title || null}, title),
        description = COALESCE(${body.description || null}, description),
        objectives = COALESCE(${body.objectives || null}, objectives),
        target_audience = COALESCE(${body.target_audience || null}, target_audience),
        duration_weeks = COALESCE(${body.duration_weeks ? parseInt(body.duration_weeks) : null}, duration_weeks),
        start_date = ${startDate},
        end_date = ${endDate},
        status = COALESCE(${body.status || null}, status),
        updated_at = NOW()
      WHERE id = ${planId}
      RETURNING *
    `

    return Response.json({
      success: true,
      data: result[0]
    })
  } catch (error: any) {
    console.error('[Training Plans] 更新訓練計劃失敗:', error)
    return Response.json(
      { success: false, error: { message: '更新訓練計劃失敗', details: error.message } },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/ttqs/plans/:planId - 刪除訓練計劃（僅限管理員）
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
        { success: false, error: { message: '只有管理員可以刪除訓練計劃' } },
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
    const planId = parseInt(params.planId, 10)

    if (isNaN(planId)) {
      return Response.json(
        { success: false, error: { message: '無效的訓練計劃 ID' } },
        { status: 400 }
      )
    }

    // 檢查訓練計劃是否存在
    const existing = await sql`
      SELECT id, title FROM training_plans WHERE id = ${planId}
    `

    if (existing.length === 0) {
      return Response.json(
        { success: false, error: { message: '訓練計劃不存在' } },
        { status: 404 }
      )
    }

    // 刪除訓練計劃（注意：需要先刪除相關的執行記錄等）
    await sql`DELETE FROM training_plans WHERE id = ${planId}`

    return Response.json({
      success: true,
      message: '訓練計劃已刪除'
    })
  } catch (error: any) {
    console.error('[Training Plans] 刪除訓練計劃失敗:', error)
    return Response.json(
      { success: false, error: { message: '刪除訓練計劃失敗', details: error.message } },
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

