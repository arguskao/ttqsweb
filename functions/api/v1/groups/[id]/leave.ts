/**
 * Group Leave API - 離開學習小組
 * DELETE /api/v1/groups/[id]/leave - 離開小組
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handleDelete(context: Context): Promise<Response> {
  const { request, params, env } = context
  const groupId = parseInt(params.id)
  
  if (isNaN(groupId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的小組 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查是否是成員
    const member = await sql`
      SELECT * FROM group_members 
      WHERE group_id = ${groupId} AND user_id = ${payload.userId}
    `
    if (member.length === 0) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '您不是該小組成員')
    }

    // 檢查是否是創建者
    const group = await sql`
      SELECT * FROM groups WHERE id = ${groupId}
    `
    if (group[0].created_by === payload.userId) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '創建者不能離開小組，請刪除小組')
    }

    // 離開小組
    await sql`
      DELETE FROM group_members 
      WHERE group_id = ${groupId} AND user_id = ${payload.userId}
    `

    return createSuccessResponse({ message: '已離開小組' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Leave Group')
  }
}

export const onRequestDelete = withErrorHandler(handleDelete, 'Leave Group')
