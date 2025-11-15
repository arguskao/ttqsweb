/**
 * Job Application Detail API - 工作申請詳情
 * GET /api/v1/job-applications/[id] - 獲取申請詳情
 * PUT /api/v1/job-applications/[id] - 更新申請狀態
 * DELETE /api/v1/job-applications/[id] - 撤回申請
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../functions/utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// GET - 獲取申請詳情
async function handleGet(context: Context): Promise<Response> {
  const { request, params, env } = context
  const applicationId = parseInt(params.id)
  
  if (isNaN(applicationId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的申請 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        ja.*,
        j.title as job_title,
        j.description as job_description,
        j.company_name,
        j.location,
        j.employer_id,
        u.first_name,
        u.last_name,
        u.email
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN users u ON ja.user_id = u.id
      WHERE ja.id = ${applicationId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '申請不存在')
    }

    const application = result[0]

    // 檢查權限：申請人或雇主或管理員
    if (
      application.user_id !== payload.userId &&
      application.employer_id !== payload.userId &&
      payload.userType !== 'admin'
    ) {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此申請')
    }

    return createSuccessResponse(application)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Job Application Detail')
  }
}

// PUT - 更新申請狀態（雇主操作）
async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const applicationId = parseInt(params.id)
  
  if (isNaN(applicationId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的申請 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查申請是否存在
    const existing = await sql`
      SELECT ja.*, j.employer_id
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = ${applicationId}
    `
    
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '申請不存在')
    }

    // 檢查權限：雇主或管理員
    if (existing[0].employer_id !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此申請')
    }

    const body = await request.json() as any

    // 更新狀態
    const result = await sql`
      UPDATE job_applications SET
        status = COALESCE(${body.status}, status),
        notes = COALESCE(${body.notes}, notes),
        updated_at = NOW()
      WHERE id = ${applicationId}
      RETURNING *
    `

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Update Job Application')
  }
}

// DELETE - 撤回申請（申請人操作）
async function handleDelete(context: Context): Promise<Response> {
  const { request, params, env } = context
  const applicationId = parseInt(params.id)
  
  if (isNaN(applicationId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的申請 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 檢查申請是否存在且屬於當前用戶
    const existing = await sql`
      SELECT * FROM job_applications WHERE id = ${applicationId}
    `
    
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '申請不存在')
    }

    if (existing[0].user_id !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限刪除此申請')
    }

    // 只能撤回 pending 狀態的申請
    if (existing[0].status !== 'pending') {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '只能撤回待處理的申請')
    }

    await sql`DELETE FROM job_applications WHERE id = ${applicationId}`

    return createSuccessResponse({ message: '申請已撤回' })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Delete Job Application')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Job Application Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update Job Application')
export const onRequestDelete = withErrorHandler(handleDelete, 'Delete Job Application')
