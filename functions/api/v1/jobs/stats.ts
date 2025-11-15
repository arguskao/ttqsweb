/**
 * Jobs Statistics API - 工作統計
 * GET /api/v1/jobs/stats - 獲取工作統計數據
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取工作統計
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  parseJwtToken(token) // 驗證 token

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 總工作數
    const totalJobs = await sql`
      SELECT COUNT(*) as count FROM jobs WHERE is_active = true
    `

    // 按類型統計
    const byType = await sql`
      SELECT job_type, COUNT(*) as count 
      FROM jobs 
      WHERE is_active = true 
      GROUP BY job_type
    `

    // 按地點統計
    const byLocation = await sql`
      SELECT location, COUNT(*) as count 
      FROM jobs 
      WHERE is_active = true 
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `

    // 最近 30 天新增工作
    const recentJobs = await sql`
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `

    // 申請統計
    const applicationStats = await sql`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(DISTINCT user_id) as unique_applicants,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM job_applications
    `

    return createSuccessResponse({
      totalJobs: parseInt(totalJobs[0]?.count || '0'),
      recentJobs: parseInt(recentJobs[0]?.count || '0'),
      byType,
      byLocation,
      applications: applicationStats[0]
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Jobs Statistics')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Jobs Statistics')
