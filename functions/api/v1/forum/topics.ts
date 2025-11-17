/**
 * Forum Topics API - 討論區主題管理
 * GET /api/v1/forum/topics - 獲取主題列表
 * POST /api/v1/forum/topics - 創建主題
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取主題列表
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const category = url.searchParams.get('category')
    const offset = (page - 1) * limit

    let countResult
    if (category) {
      countResult = await sql`
        SELECT COUNT(*) as count 
        FROM forum_topics 
        WHERE category = ${category}
      `
    } else {
      countResult = await sql`
        SELECT COUNT(*) as count 
        FROM forum_topics
      `
    }
    const total = parseInt(countResult[0]?.count || '0')

    let topics
    if (category) {
      topics = await sql`
        SELECT *
        FROM forum_topics
        WHERE category = ${category}
        ORDER BY is_pinned DESC, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      topics = await sql`
        SELECT *
        FROM forum_topics
        ORDER BY is_pinned DESC, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const formattedTopics = topics.map((topic: any) => ({
      id: topic.id,
      title: topic.title,
      content: topic.content,
      category: topic.category,
      isPinned: topic.is_pinned,
      isLocked: topic.is_locked,
      viewCount: topic.view_count,
      commentCount: 0, // 暫時設為 0，避免子查詢問題
      createdBy: topic.created_by,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at,
      authorName: '匿名用戶' // 暫時固定，避免 JOIN 問題
    }))

    return createSuccessResponse({
      topics: formattedTopics,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Forum Topics')
  }
}

// POST - 創建主題
async function handlePost(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    if (!body.title || !body.content) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '標題和內容為必填項')
    }

    const result = await sql`
      INSERT INTO forum_topics (
        title,
        content,
        category,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${body.title},
        ${body.content},
        ${body.category || 'general'},
        ${payload.userId},
        NOW(),
        NOW()
      )
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
    handleDatabaseError(dbError, 'Create Forum Topic')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Forum Topics')
export const onRequestPost = withErrorHandler(handlePost, 'Create Forum Topic')
