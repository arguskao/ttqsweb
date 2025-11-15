/**
 * Document Download API - 文檔下載
 * GET /api/v1/documents/[id]/download - 下載文檔並記錄下載次數
 */

import { withErrorHandler, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string }
  params: { id: string }
}

// GET - 下載文檔
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
    // 獲取文檔信息
    const result = await sql`
      SELECT * FROM documents 
      WHERE id = ${documentId} AND is_active = true
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '文檔不存在或不可下載')
    }

    const document = result[0]

    // 增加下載次數
    await sql`
      UPDATE documents 
      SET download_count = COALESCE(download_count, 0) + 1
      WHERE id = ${documentId}
    `

    return createSuccessResponse({
      file_url: document.file_url,
      file_name: document.original_name || document.title,
      file_type: document.file_type
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Download Document')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Download Document')
