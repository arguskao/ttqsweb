/**
 * Documents API - 文檔管理
 * GET /api/v1/documents - 獲取文檔列表
 * POST /api/v1/documents - 上傳文檔
 */

import { withErrorHandler, validateToken, parseJwtToken, checkPermission, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../functions/utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取文檔列表
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)
  
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 解析查詢參數
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // 構建 WHERE 條件
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (category) {
      conditions.push(`category = $${paramIndex}`)
      values.push(category)
      paramIndex++
    }

    if (search) {
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      values.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 獲取總數
    const countQuery = `SELECT COUNT(*) as count FROM documents ${whereClause}`
    const countResult = await sql(countQuery, values)
    const total = parseInt(countResult[0]?.count || '0')

    // 獲取數據
    const offset = (page - 1) * limit
    const dataQuery = `
      SELECT 
        d.*,
        u.first_name as uploader_first_name,
        u.last_name as uploader_last_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const documents = await sql(dataQuery, [...values, limit, offset])

    return createSuccessResponse({
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Documents')
  }
}

// POST - 上傳文檔
async function handlePost(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    // 驗證必填字段
    if (!body.title || !body.fileUrl) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '標題和文件 URL 為必填項')
    }

    // 創建文檔記錄
    const result = await sql`
      INSERT INTO documents (
        title,
        description,
        file_url,
        file_type,
        file_size,
        category,
        original_name,
        file_path,
        uploaded_by,
        created_at
      ) VALUES (
        ${body.title},
        ${body.description || null},
        ${body.fileUrl},
        ${body.fileType || 'application/octet-stream'},
        ${body.fileSize || 0},
        ${body.category || 'general'},
        ${body.originalName || body.title},
        ${body.filePath || null},
        ${payload.userId},
        NOW()
      )
      RETURNING *
    `

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Upload Document')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Documents')
export const onRequestPost = withErrorHandler(handlePost, 'Upload Document')
