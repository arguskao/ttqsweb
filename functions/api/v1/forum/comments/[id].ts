/**
 * Forum Comment Detail API - 討論區評論詳情
 * PUT /api/v1/forum/comments/[id] - 更新評論
 * DELETE /api/v1/forum/comments/[id] - 刪除評論
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const commentId = parseInt(params.id)
  
  if (isNaN(commentId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的評論 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    const existing = await sql`
      SELECT * FROM forum_comments WHERE id = ${commentId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '評論不存在')
    }

    if (existing[0].created_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此評論')
    }

    const result = await sql`
      UPDATE forum_comments SET
        content = COALESCE(${body.content}, content),
        updated_at = NOW()
      WHERE id = ${commentId}
      RETURNING *
    `

    const comment = result[0]
    return createSuccessResponse({
      id: comment.id,
      topicId: comment.topic_id,
      content: comment.content,
      createdBy: comment.created_by,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Forum Comment')
  }
}

async function handleDelete(context: Context): Promise<Response> {
  const { request, params, env } = context
  const commentId = parseInt(params.id)
  
  if (isNaN(commentId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的評論 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const existing = await sql`
      SELECT * FROM forum_comments WHERE id = ${commentId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '評論不存在')
    }

    if (existing[0].created_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限刪除此評論')
    }

    await sql`DELETE FROM forum_comments WHERE id = ${commentId}`

    return createSuccessResponse({ message: '評論已刪除' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Delete Forum Comment')
  }
}

export const onRequestPut = withErrorHandler(handlePut, 'Update Forum Comment')
export const onRequestDelete = withErrorHandler(handleDelete, 'Delete Forum Comment')
