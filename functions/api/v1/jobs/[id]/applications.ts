/**
 * Job Applications API - 工作申請
 * GET /api/v1/jobs/[id]/applications - 獲取工作的所有申請（雇主）
 * POST /api/v1/jobs/[id]/applications - 申請工作
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../../functions/utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// GET - 獲取工作的所有申請（雇主查看）
async function handleGet(context: Context): Promise<Response> {
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
    // 檢查是否為工作的雇主或管理員
    const job = await sql`SELECT employer_id FROM jobs WHERE id = ${jobId}`
    
    if (job.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工作不存在')
    }

    if (job[0].employer_id !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此工作的申請')
    }

    // 獲取所有申請
    const applications = await sql`
      SELECT 
        ja.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      WHERE ja.job_id = ${jobId}
      ORDER BY ja.created_at DESC
    `

    return createSuccessResponse(applications)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Job Applications')
  }
}

// POST - 申請工作
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
    // 檢查工作是否存在且活躍
    const job = await sql`SELECT * FROM jobs WHERE id = ${jobId} AND is_active = true`
    
    if (job.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工作不存在或已關閉')
    }

    // 檢查是否已經申請過
    const existing = await sql`
      SELECT id FROM job_applications 
      WHERE job_id = ${jobId} AND user_id = ${payload.userId}
    `
    
    if (existing.length > 0) {
      throw new ApiError(ErrorCode.CONFLICT, '您已經申請過此工作')
    }

    const body = await request.json() as any

    // 創建申請
    const result = await sql`
      INSERT INTO job_applications (
        job_id,
        user_id,
        cover_letter,
        resume_url,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${jobId},
        ${payload.userId},
        ${body.coverLetter || null},
        ${body.resumeUrl || null},
        'pending',
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Apply for Job')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Job Applications')
export const onRequestPost = withErrorHandler(handlePost, 'Apply for Job')
