/**
 * Document Detail API - 文檔詳情
 * GET /api/v1/documents/[id] - 獲取文檔詳情
 * PUT /api/v1/documents/[id] - 更新文檔
 * DELETE /api/v1/documents/[id] - 刪除文檔
 */

import { withErrorHandler, validateToken, parseJwtToken, checkPermission, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../functions/utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// GET - 獲取文檔詳情
async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const documentId = parseInt(params.id)
  
  if (isNaN(documentId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的文檔 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        d.*,
        u.first_name as uploader_first_name,
        u.last_name as uploader_last_name,
        u.email as uploader_email
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ${documentId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '文檔不存在')
    }

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Document Detail')
  }
}

// PUT - 更新文檔
async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const documentId = parseInt(params.id)
  
  if (isNaN(documentId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的文檔 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查文檔是否存在
    const existing = await sql`SELECT * FROM documents WHERE id = ${documentId}`
    
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '文檔不存在')
    }

    // 檢查權限：上傳者或管理員
    if (existing[0].uploaded_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此文檔')
    }

    const body = await request.json() as any

    // 更新文檔
    const result = await sql`
      UPDATE documents SET
        title = COALESCE(${body.title}, title),
        description = COALESCE(${body.description}, description),
        category = COALESCE(${body.category}, category),
        updated_at = NOW()
      WHERE id = ${documentId}
      RETURNING *
    `

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Document')
  }
}

// DELETE - 刪除文檔
async function handleDelete(context: Context): Promise<Response> {
  const { request, params, env } = context
  const documentId = parseInt(params.id)
  
  if (isNaN(documentId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的文檔 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查文檔是否存在
    const existing = await sql`SELECT * FROM documents WHERE id = ${documentId}`
    
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '文檔不存在')
    }

    // 檢查權限：上傳者或管理員
    if (existing[0].uploaded_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限刪除此文檔')
    }

    await sql`DELETE FROM documents WHERE id = ${documentId}`

    return createSuccessResponse({ message: '文檔已刪除' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Delete Document')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Document Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update Document')
export const onRequestDelete = withErrorHandler(handleDelete, 'Delete Document')
