/**
 * Job Detail API - 工作詳情
 * GET /api/v1/jobs/[id] - 獲取工作詳情
 * PUT /api/v1/jobs/[id] - 更新工作
 * DELETE /api/v1/jobs/[id] - 刪除工作
 */

import { withErrorHandler, validateToken, parseJwtToken, checkPermission, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// GET - 獲取工作詳情
async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const jobId = parseInt(params.id)
  
  if (isNaN(jobId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的工作 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        j.*,
        u.first_name as employer_first_name,
        u.last_name as employer_last_name,
        u.email as employer_email,
        COUNT(DISTINCT ja.id) as application_count
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.id = ${jobId}
      GROUP BY j.id, u.id
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工作不存在')
    }

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Job Detail')
  }
}

// PUT - 更新工作
async function handlePut(context: Context): Promise<Response> {
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
    // 檢查工作是否存在且屬於當前用戶
    const existing = await sql`SELECT * FROM jobs WHERE id = ${jobId}`
    
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工作不存在')
    }

    if (existing[0].employer_id !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此工作')
    }

    const body = await request.json() as any

    // 更新工作
    const result = await sql`
      UPDATE jobs SET
        title = COALESCE(${body.title}, title),
        description = COALESCE(${body.description}, description),
        job_type = COALESCE(${body.jobType}, job_type),
        location = COALESCE(${body.location}, location),
        salary_min = COALESCE(${body.salaryMin}, salary_min),
        salary_max = COALESCE(${body.salaryMax}, salary_max),
        experience_level = COALESCE(${body.experienceLevel}, experience_level),
        education_level = COALESCE(${body.educationLevel}, education_level),
        remote_work = COALESCE(${body.remoteWork}, remote_work),
        requirements = COALESCE(${body.requirements}, requirements),
        benefits = COALESCE(${body.benefits}, benefits),
        is_active = COALESCE(${body.isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${jobId}
      RETURNING *
    `

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Job')
  }
}

// DELETE - 刪除工作
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
    // 檢查工作是否存在且屬於當前用戶
    const existing = await sql`SELECT * FROM jobs WHERE id = ${jobId}`
    
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工作不存在')
    }

    if (existing[0].employer_id !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限刪除此工作')
    }

    // 刪除工作（級聯刪除相關申請）
    await sql`DELETE FROM jobs WHERE id = ${jobId}`

    return createSuccessResponse({ message: '工作已刪除' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Delete Job')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Job Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update Job')
export const onRequestDelete = withErrorHandler(handleDelete, 'Delete Job')
