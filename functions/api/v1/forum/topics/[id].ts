/**
 * Forum Topic Detail API - 討論區主題詳情
 * GET /api/v1/forum/topics/[id] - 獲取主題詳情
 * PUT /api/v1/forum/topics/[id] - 更新主題
 * DELETE /api/v1/forum/topics/[id] - 刪除主題
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// GET - 獲取主題詳情
async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const topicId = parseInt(params.id)
  
  if (isNaN(topicId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的主題 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 增加瀏覽次數
    await sql`
      UPDATE forum_topics 
      SET view_count = view_count + 1 
      WHERE id = ${topicId}
    `

    const result = await sql`
      SELECT 
        ft.*,
        u.first_name,
        u.last_name,
        u.email
      FROM forum_topics ft
      LEFT JOIN users u ON ft.created_by = u.id
      WHERE ft.id = ${topicId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '主題不存在')
    }

    const topic = result[0]
    return createSuccessResponse({
      id: topic.id,
      title: topic.title,
      content: topic.content,
      category: topic.category,
      isPinned: topic.is_pinned,
      isLocked: topic.is_locked,
      viewCount: topic.view_count,
      createdBy: topic.created_by,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at,
      author: {
        firstName: topic.first_name,
        lastName: topic.last_name,
        email: topic.email
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Forum Topic Detail')
  }
}

// PUT - 更新主題
async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const topicId = parseInt(params.id)
  
  if (isNaN(topicId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的主題 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    const existing = await sql`
      SELECT * FROM forum_topics WHERE id = ${topicId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '主題不存在')
    }

    if (existing[0].created_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此主題')
    }

    const result = await sql`
      UPDATE forum_topics SET
        title = COALESCE(${body.title}, title),
        content = COALESCE(${body.content}, content),
        category = COALESCE(${body.category}, category),
        updated_at = NOW()
      WHERE id = ${topicId}
      RETURNING *
    `

    const topic = result[0]
    return createSuccessResponse({
      id: topic.id,
      title: topic.title,
      content: topic.content,
      category: topic.category,
      isPinned: topic.is_pinned,
      isLocked: topic.is_locked,
      viewCount: topic.view_count,
      createdBy: topic.created_by,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Forum Topic')
  }
}

// DELETE - 刪除主題
async function handleDelete(context: Context): Promise<Response> {
  const { request, params, env } = context
  const topicId = parseInt(params.id)
  
  if (isNaN(topicId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的主題 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const existing = await sql`
      SELECT * FROM forum_topics WHERE id = ${topicId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '主題不存在')
    }

    if (existing[0].created_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限刪除此主題')
    }

    // 刪除相關評論
    await sql`DELETE FROM forum_comments WHERE topic_id = ${topicId}`
    
    // 刪除主題
    await sql`DELETE FROM forum_topics WHERE id = ${topicId}`

    return createSuccessResponse({ message: '主題已刪除' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Delete Forum Topic')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Forum Topic Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update Forum Topic')
export const onRequestDelete = withErrorHandler(handleDelete, 'Delete Forum Topic')
