/**
 * 經驗分享 API 端點 - 使用統一錯誤處理
 */
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateToken,
  parseJwtToken,
  checkPermission,
  validateDatabaseUrl,
  handleDatabaseError
} from '../../utils/error-handler'

interface Env {
  DATABASE_URL: string
}

interface Context {
  request: Request
  env: Env
}

// GET - 獲取經驗分享列表
async function handleGetExperiences(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 解析查詢參數
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '12', 10)
  const offset = (page - 1) * limit
  const featured = url.searchParams.get('featured')

  // 驗證分頁參數
  if (page < 1 || limit < 1 || limit > 100) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的分頁參數')
  }

  try {
    let experiences: any[]
    let total: number

    if (featured === 'true') {
      // 只獲取精選內容
      const countResult = await sql`
        SELECT COUNT(*) as count FROM experience_shares WHERE is_featured = true
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      experiences = await sql`
        SELECT 
          e.*,
          u.first_name,
          u.last_name
        FROM experience_shares e
        LEFT JOIN users u ON e.author_id = u.id
        WHERE e.is_featured = true
        ORDER BY e.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // 獲取所有內容
      const countResult = await sql`
        SELECT COUNT(*) as count FROM experience_shares
      `
      total = parseInt(countResult[0]?.count || '0', 10)

      experiences = await sql`
        SELECT 
          e.*,
          u.first_name,
          u.last_name
        FROM experience_shares e
        LEFT JOIN users u ON e.author_id = u.id
        ORDER BY e.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // 格式化回應
    const formattedExperiences = experiences.map((e: any) => ({
      ...e,
      authorName: `${e.first_name || ''} ${e.last_name || ''}`.trim()
    }))

    return createSuccessResponse(formattedExperiences, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })

  } catch (dbError) {
    handleDatabaseError(dbError, 'Experiences Query')
  }
}

// POST - 創建新經驗分享
async function handleCreateExperience(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 解析請求體
  const body = await request.json() as {
    title?: string
    content?: string
    category?: string
    share_type?: string
    tags?: string[]
  }

  // 驗證必填欄位
  if (!body.title || !body.content) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '標題和內容為必填')
  }

  try {
    // 創建經驗分享
    const result = await sql`
      INSERT INTO experience_shares (title, content, share_type, tags, author_id)
      VALUES (
        ${body.title},
        ${body.content},
        ${body.category || body.share_type || 'success_story'},
        ${body.tags || []},
        ${payload.userId}
      )
      RETURNING *
    `

    return createSuccessResponse(result[0], '經驗分享創建成功', 201)

  } catch (dbError) {
    handleDatabaseError(dbError, 'Experience Creation')
  }
}

// PUT - 更新經驗分享
async function handleUpdateExperience(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 解析請求體
  const body = await request.json() as {
    id?: number
    title?: string
    content?: string
    share_type?: string
    tags?: string[]
    is_featured?: boolean
  }

  // 驗證必填欄位
  if (!body.id) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '經驗分享 ID 為必填')
  }

  try {
    // 檢查經驗分享是否存在
    const existing = await sql`
      SELECT * FROM experience_shares WHERE id = ${body.id}
    `

    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '經驗分享不存在')
    }

    const experience = existing[0]

    // 檢查權限：只有作者或管理員/講師可以更新
    const isAuthor = experience.author_id === payload.userId
    const isAdmin = payload.userType === 'admin' || payload.userType === 'instructor'

    if (!isAuthor && !isAdmin) {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限更新此經驗分享')
    }

    // 檢查是否有要更新的欄位
    const hasUpdates = body.title !== undefined || 
                      body.content !== undefined || 
                      body.share_type !== undefined || 
                      body.tags !== undefined ||
                      (body.is_featured !== undefined && isAdmin)

    if (!hasUpdates) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '沒有要更新的欄位')
    }

    // 執行更新（使用動態 SQL）
    // 由於 Neon 的限制，我們需要使用條件更新
    let result: any[]
    
    if (body.is_featured !== undefined && isAdmin) {
      result = await sql`
        UPDATE experience_shares 
        SET 
          title = COALESCE(${body.title || null}, title),
          content = COALESCE(${body.content || null}, content),
          share_type = COALESCE(${body.share_type || null}, share_type),
          tags = COALESCE(${body.tags || null}, tags),
          is_featured = ${body.is_featured},
          updated_at = NOW()
        WHERE id = ${body.id}
        RETURNING *
      `
    } else {
      result = await sql`
        UPDATE experience_shares 
        SET 
          title = COALESCE(${body.title || null}, title),
          content = COALESCE(${body.content || null}, content),
          share_type = COALESCE(${body.share_type || null}, share_type),
          tags = COALESCE(${body.tags || null}, tags),
          updated_at = NOW()
        WHERE id = ${body.id}
        RETURNING *
      `
    }

    return createSuccessResponse(result[0], '經驗分享更新成功')

  } catch (dbError) {
    handleDatabaseError(dbError, 'Experience Update')
  }
}

// DELETE - 刪除經驗分享
async function handleDeleteExperience(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證 token 和權限（只有管理員可以刪除）
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  checkPermission(payload.userType, ['admin'])

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 獲取要刪除的 ID
  const url = new URL(request.url)
  const experienceId = url.searchParams.get('id')

  if (!experienceId) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '經驗分享 ID 為必填')
  }

  const id = parseInt(experienceId, 10)
  if (isNaN(id)) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的經驗分享 ID')
  }

  try {
    // 檢查經驗分享是否存在
    const existing = await sql`
      SELECT id, title FROM experience_shares WHERE id = ${id}
    `

    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '經驗分享不存在')
    }

    // 刪除相關的評論記錄
    await sql`DELETE FROM experience_comments WHERE share_id = ${id}`

    // 刪除經驗分享
    await sql`DELETE FROM experience_shares WHERE id = ${id}`

    return createSuccessResponse(
      { id, title: existing[0].title },
      '經驗分享已刪除'
    )

  } catch (dbError) {
    handleDatabaseError(dbError, 'Experience Deletion')
  }
}

// 導出處理函數
export const onRequestGet = withErrorHandler(handleGetExperiences, 'Experiences List')
export const onRequestPost = withErrorHandler(handleCreateExperience, 'Experience Create')
export const onRequestPut = withErrorHandler(handleUpdateExperience, 'Experience Update')
export const onRequestDelete = withErrorHandler(handleDeleteExperience, 'Experience Delete')

// OPTIONS 請求處理
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
