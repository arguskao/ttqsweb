/**
 * Job Applications Management API - 工作申請管理
 * GET /api/v1/job-applications - 獲取用戶的所有申請
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse } from '../../../functions/utils/error-handler'

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

export const onRequestGet = withErrorHandler(handleGet, 'Get User Job Applications')
