/**
 * Jobs by Location API
 * GET /api/v1/jobs/location/:location
 */

import {
  withErrorHandler,
  validateDatabaseUrl,
  handleDatabaseError,
  createSuccessResponse
} from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { location: string }
}

async function handleJobsByLocation(context: Context): Promise<Response> {
  const { request, env, params } = context
  const location = decodeURIComponent(params.location)

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const locationPattern = `%${location}%`

    // 獲取總數
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM jobs
      WHERE status = 'active' 
        AND location ILIKE ${locationPattern}
    `
    const total = parseInt(countResult[0].total)

    // 獲取工作列表
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
        j.view_count,
        j.created_at,
        j.updated_at
      FROM jobs j
      WHERE j.status = 'active' 
        AND j.location ILIKE ${locationPattern}
      ORDER BY j.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
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
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    return createSuccessResponse({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Jobs by Location')
  }
}

export const onRequestGet = withErrorHandler(handleJobsByLocation, 'Get Jobs by Location')
