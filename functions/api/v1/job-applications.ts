/**
 * Job Applications Management API - 工作申請管理
 * GET /api/v1/job-applications - 獲取用戶的所有申請
 * POST /api/v1/job-applications - 提交工作申請
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取用戶的所有申請
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const applications = await sql`
      SELECT 
        ja.*,
        j.title as job_title,
        j.company_name,
        j.location,
        j.job_type,
        u.first_name as employer_first_name,
        u.last_name as employer_last_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN users u ON j.employer_id = u.id
      WHERE ja.user_id = ${payload.userId}
      ORDER BY ja.created_at DESC
    `

    return createSuccessResponse(applications)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Job Applications')
  }
}

// POST - 提交工作申請
async function handlePost(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    // 驗證必填字段
    if (!body.jobId) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '工作 ID 為必填項')
    }

    const jobId = parseInt(body.jobId)
    if (isNaN(jobId)) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的工作 ID')
    }

    // 檢查工作是否存在
    const job = await sql`SELECT * FROM jobs WHERE id = ${jobId} AND is_active = true`
    if (job.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工作不存在或已關閉')
    }

    // 檢查是否已經申請過
    const existing = await sql`
      SELECT * FROM job_applications 
      WHERE job_id = ${jobId} AND user_id = ${payload.userId}
    `
    if (existing.length > 0) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '您已經申請過此工作')
    }

    // 創建申請
    const result = await sql`
      INSERT INTO job_applications (
        job_id,
        user_id,
        cover_letter,
        resume_url,
        status,
        created_at
      ) VALUES (
        ${jobId},
        ${payload.userId},
        ${body.coverLetter || null},
        ${body.resumeUrl || null},
        'pending',
        NOW()
      )
      RETURNING *
    `

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Submit Job Application')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Job Applications')
export const onRequestPost = withErrorHandler(handlePost, 'Submit Job Application')
