/**
 * Group Detail API - 學習小組詳情
 * GET /api/v1/groups/[id] - 獲取小組詳情
 * PUT /api/v1/groups/[id] - 更新小組
 * DELETE /api/v1/groups/[id] - 刪除小組
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const groupId = parseInt(params.id)
  
  if (isNaN(groupId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的小組 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        g.*,
        u.first_name,
        u.last_name,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ${groupId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '小組不存在')
    }

    const group = result[0]
    return createSuccessResponse({
      id: group.id,
      name: group.name,
      description: group.description,
      maxMembers: group.max_members,
      memberCount: parseInt(group.member_count || '0'),
      createdBy: group.created_by,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      creator: {
        firstName: group.first_name,
        lastName: group.last_name
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Group Detail')
  }
}

async function handlePut(context: Context): Promise<Response> {
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
    const body = await request.json() as any

    const existing = await sql`
      SELECT * FROM groups WHERE id = ${groupId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '小組不存在')
    }

    if (existing[0].created_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此小組')
    }

    const result = await sql`
      UPDATE groups SET
        name = COALESCE(${body.name}, name),
        description = COALESCE(${body.description}, description),
        max_members = COALESCE(${body.maxMembers}, max_members),
        updated_at = NOW()
      WHERE id = ${groupId}
      RETURNING *
    `

    const group = result[0]
    return createSuccessResponse({
      id: group.id,
      name: group.name,
      description: group.description,
      maxMembers: group.max_members,
      createdBy: group.created_by,
      createdAt: group.created_at,
      updatedAt: group.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Group')
  }
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
    const existing = await sql`
      SELECT * FROM groups WHERE id = ${groupId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '小組不存在')
    }

    if (existing[0].created_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限刪除此小組')
    }

    await sql`DELETE FROM group_members WHERE group_id = ${groupId}`
    await sql`DELETE FROM groups WHERE id = ${groupId}`

    return createSuccessResponse({ message: '小組已刪除' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Delete Group')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Group Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update Group')
export const onRequestDelete = withErrorHandler(handleDelete, 'Delete Group')
