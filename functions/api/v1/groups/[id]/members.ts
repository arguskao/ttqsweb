/**
 * Group Members API - 小組成員管理
 * GET /api/v1/groups/[id]/members - 獲取小組成員列表
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handleGet(context: Context): Promise<Response> {
  const { request, params, env } = context
  const groupId = parseInt(params.id)
  
  if (isNaN(groupId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的小組 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const members = await sql`
      SELECT 
        gm.*,
        u.first_name,
        u.last_name,
        u.email
      FROM group_members gm
      LEFT JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ${groupId}
      ORDER BY gm.joined_at ASC
    `

    const formattedMembers = members.map((member: any) => ({
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
      user: {
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email
      }
    }))

    return createSuccessResponse({ members: formattedMembers })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Group Members')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Group Members')
