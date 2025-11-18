/**
 * Pending Approval Jobs API
 * GET /api/v1/jobs/pending-approval
 */

import {
  withErrorHandler,
  validateToken,
  parseJwtToken,
  validateDatabaseUrl,
  handleDatabaseError,
  createSuccessResponse,
  ApiError,
  ErrorCode
} from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

async function handlePendingApproval(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證管理員權限
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  if (payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '需要管理員權限')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        j.id,
        j.title,
        j.company_name,
        j.location,
        j.job_type,
        j.salary_min,
        j.salary_max,
        j.description,
        j.requirements,
        j.benefits,
        j.contact_email,
        j.contact_phone,
        j.posted_by,
        j.status,
        j.created_at,
        j.updated_at,
        u.email as poster_email,
        u.first_name as poster_first_name,
        u.last_name as poster_last_name
      FROM jobs j
      LEFT JOIN users u ON u.id = j.posted_by
      WHERE j.status = 'pending'
      ORDER BY j.created_at DESC
    `

    const jobs = result.map((row: any) => ({
      id: row.id,
      title: row.title,
      companyName: row.company_name,
      location: row.location,
      jobType: row.job_type,
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      description: row.description,
      requirements: row.requirements,
      benefits: row.benefits,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      postedBy: row.posted_by,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      poster: {
        email: row.poster_email,
        firstName: row.poster_first_name,
        lastName: row.poster_last_name
      }
    }))

    return createSuccessResponse(jobs)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Pending Approval Jobs')
  }
}

export const onRequestGet = withErrorHandler(handlePendingApproval, 'Get Pending Approval Jobs')
