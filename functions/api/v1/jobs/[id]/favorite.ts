/**
 * Job Favorite API - 工作收藏
 * POST /api/v1/jobs/[id]/favorite - 收藏工作
 * DELETE /api/v1/jobs/[id]/favorite - 取消收藏
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// POST - 收藏工作
async function handlePost(context: Context): Promise<Response> {
  const { request, params, env } = context
  const jobId = parseInt(params.id)
  
  if (isNaN(jobId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的工作 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查工作是否存在
    const job = await sql`SELECT id FROM jobs WHERE id = ${jobId}`
    if (job.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工作不存在')
    }

    // 檢查是否已經收藏
    const existing = await sql`
      SELECT id FROM job_favorites 
      WHERE job_id = ${jobId} AND user_id = ${payload.userId}
    `

    if (existing.length > 0) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '已經收藏過此工作')
    }

    // 創建收藏
    const result = await sql`
      INSERT INTO job_favorites (job_id, user_id, created_at)
      VALUES (${jobId}, ${payload.userId}, NOW())
      RETURNING *
    `

    return createSuccessResponse({
      message: '收藏成功',
      favorite: result[0]
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Favorite Job')
  }
}

// DELETE - 取消收藏
async function handleDelete(context: Context): Promise<Response> {
  const { request, params, env } = context
  const jobId = parseInt(params.id)
  
  if (isNaN(jobId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的工作 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 刪除收藏
    const result = await sql`
      DELETE FROM job_favorites 
      WHERE job_id = ${jobId} AND user_id = ${payload.userId}
      RETURNING *
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '未收藏此工作')
    }

    return createSuccessResponse({
      message: '取消收藏成功'
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Unfavorite Job')
  }
}

export const onRequestPost = withErrorHandler(handlePost, 'Favorite Job')
export const onRequestDelete = withErrorHandler(handleDelete, 'Unfavorite Job')
