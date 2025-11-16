/**
 * Group Join API - 加入學習小組
 * POST /api/v1/groups/[id]/join - 加入小組
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handlePost(context: Context): Promise<Response> {
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
    // 檢查小組是否存在
    const group = await sql`
      SELECT * FROM groups WHERE id = ${groupId}
    `
    if (group.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '小組不存在')
    }

    // 檢查是否已經是成員
    const existing = await sql`
      SELECT * FROM group_members 
      WHERE group_id = ${groupId} AND user_id = ${payload.userId}
    `
    if (existing.length > 0) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '您已經是該小組成員')
    }

    // 檢查小組是否已滿
    const memberCount = await sql`
      SELECT COUNT(*) as count FROM group_members WHERE group_id = ${groupId}
    `
    const count = parseInt(memberCount[0]?.count || '0')
    if (count >= group[0].max_members) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '小組已滿')
    }

    // 加入小組
    await sql`
      INSERT INTO group_members (
        group_id,
        user_id,
        role,
        joined_at
      ) VALUES (
        ${groupId},
        ${payload.userId},
        'member',
        NOW()
      )
    `

    return createSuccessResponse({ message: '成功加入小組' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Join Group')
  }
}

export const onRequestPost = withErrorHandler(handlePost, 'Join Group')
