/**
 * Document Validation API - 驗證文檔是否可下載
 * GET /api/v1/documents/[id]/validate - 驗證文檔
 */

import { withErrorHandler, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string }
  params: { id: string }
}

// GET - 驗證文檔
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
      SELECT id, is_active, is_public 
      FROM documents 
      WHERE id = ${documentId}
    `

    if (result.length === 0) {
      return createSuccessResponse({
        isValid: false,
        reason: '文檔不存在'
      })
    }

    const document = result[0]

    if (!document.is_active) {
      return createSuccessResponse({
        isValid: false,
        reason: '文檔已停用'
      })
    }

    return createSuccessResponse({
      isValid: true
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Validate Document')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Validate Document')
