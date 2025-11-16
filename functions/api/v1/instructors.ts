/**
 * Instructors API - 講師列表
 * GET /api/v1/instructors - 獲取講師列表
 */

import { withErrorHandler, validateDatabaseUrl, handleDatabaseError, createSuccessResponse } from '../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string }
}

// GET - 獲取講師列表
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)
  
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 解析查詢參數
    const search = url.searchParams.get('search') || null
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 計算總數
    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM users
      WHERE user_type = 'instructor'
        ${search ? sql`AND (first_name ILIKE ${`%${search}%`} OR last_name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})` : sql``}
    `
    const total = parseInt(countResult[0]?.count || '0')

    // 獲取講師列表
    const instructors = await sql`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.bio,
        u.avatar_url,
        u.created_at,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT e.id) as student_count
      FROM users u
      LEFT JOIN courses c ON u.id = c.instructor_id AND c.is_active = true
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE u.user_type = 'instructor'
        ${search ? sql`AND (u.first_name ILIKE ${`%${search}%`} OR u.last_name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})` : sql``}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return createSuccessResponse({
      instructors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Instructors')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Instructors')
