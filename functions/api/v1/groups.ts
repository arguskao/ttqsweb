/**
 * Groups API - 學習小組管理
 * GET /api/v1/groups - 獲取小組列表
 * POST /api/v1/groups - 創建小組
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取小組列表
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const countResult = await sql`
      SELECT COUNT(*) as count FROM groups
    `
    const total = parseInt(countResult[0]?.count || '0')

    const groups = await sql`
      SELECT 
        g.*,
        u.first_name,
        u.last_name,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      ORDER BY g.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const formattedGroups = groups.map((group: any) => ({
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
    }))

    return createSuccessResponse({
      groups: formattedGroups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Groups')
  }
}

// POST - 創建小組
async function handlePost(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    if (!body.name) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '小組名稱為必填項')
    }

    const result = await sql`
      INSERT INTO groups (
        name,
        description,
        max_members,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${body.name},
        ${body.description || null},
        ${body.maxMembers || 50},
        ${payload.userId},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const group = result[0]

    // 自動加入創建者為成員
    await sql`
      INSERT INTO group_members (
        group_id,
        user_id,
        role,
        joined_at
      ) VALUES (
        ${group.id},
        ${payload.userId},
        'admin',
        NOW()
      )
    `

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
    handleDatabaseError(dbError, 'Create Group')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Groups')
export const onRequestPost = withErrorHandler(handlePost, 'Create Group')
