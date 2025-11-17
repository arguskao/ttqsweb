/**
 * Forum Comments API - 討論區評論管理
 * GET /api/v1/forum/topics/[topicId]/comments - 獲取評論列表
 * POST /api/v1/forum/topics/[topicId]/comments - 創建評論
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { topicId: string }
}

async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const topicId = parseInt(params.topicId)
  
  if (isNaN(topicId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的主題 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const comments = await sql`
      SELECT 
        fc.*,
        u.first_name,
        u.last_name,
        u.email
      FROM forum_comments fc
      LEFT JOIN users u ON fc.created_by = u.id
      WHERE fc.topic_id = ${topicId}
      ORDER BY fc.created_at ASC
    `

    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      topicId: comment.topic_id,
      content: comment.content,
      createdBy: comment.created_by,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      // 向後兼容：提供 authorName
      authorName: `${comment.first_name || ''} ${comment.last_name || ''}`.trim() || '匿名用戶',
      author: {
        firstName: comment.first_name,
        lastName: comment.last_name,
        email: comment.email
      }
    }))

    return createSuccessResponse({ comments: formattedComments })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Forum Comments')
  }
}

async function handlePost(context: Context): Promise<Response> {
  const { request, params, env } = context
  const topicId = parseInt(params.topicId)
  
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

    if (!body.content) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '評論內容為必填項')
    }

    // 檢查主題是否存在且未鎖定
    const topic = await sql`
      SELECT * FROM forum_topics WHERE id = ${topicId}
    `
    if (topic.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '主題不存在')
    }
    if (topic[0].is_locked) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '主題已鎖定，無法評論')
    }

    const result = await sql`
      INSERT INTO forum_comments (
        topic_id,
        content,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${topicId},
        ${body.content},
        ${payload.userId},
        NOW(),
        NOW()
      )
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
    handleDatabaseError(dbError, 'Create Forum Comment')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Forum Comments')
export const onRequestPost = withErrorHandler(handlePost, 'Create Forum Comment')
