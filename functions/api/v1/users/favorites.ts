/**
 * User Favorites API - 用戶收藏的工作
 * GET /api/v1/users/favorites - 獲取用戶收藏的工作列表
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取用戶收藏的工作
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const favorites = await sql`
      SELECT 
        jf.id,
        jf.job_id,
        jf.created_at,
        j.title,
        j.company_name,
        j.location,
        j.salary_min,
        j.salary_max,
        j.job_type,
        j.is_active
      FROM job_favorites jf
      LEFT JOIN jobs j ON j.id = jf.job_id
      WHERE jf.user_id = ${payload.userId}
      ORDER BY jf.created_at DESC
    `

    return createSuccessResponse(favorites)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Favorites')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Favorites')


