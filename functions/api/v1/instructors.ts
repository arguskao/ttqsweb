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
    const specialization = url.searchParams.get('specialization') || null
    const isActive = url.searchParams.get('is_active')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 基礎查詢，只查詢已核准且活躍的講師
    let whereConditions = `WHERE ia.status = 'approved' AND ia.is_active = true`
    
    // 添加搜尋條件
    if (search) {
      whereConditions += ` AND (u.first_name ILIKE '%${search}%' OR u.last_name ILIKE '%${search}%' OR ia.bio ILIKE '%${search}%')`
    }
    
    // 添加專業領域過濾
    if (specialization) {
      whereConditions += ` AND ia.specialization ILIKE '%${specialization}%'`
    }

    // 計算總數
    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM instructor_applications ia
      JOIN users u ON u.id = ia.user_id
      WHERE ia.status = 'approved' AND ia.is_active = true
      ${search ? sql`AND (u.first_name ILIKE ${`%${search}%`} OR u.last_name ILIKE ${`%${search}%`} OR ia.bio ILIKE ${`%${search}%`})` : sql``}
      ${specialization ? sql`AND ia.specialization ILIKE ${`%${specialization}%`}` : sql``}
    `
    const total = parseInt(countResult[0]?.count || '0')

    // 獲取講師列表
    const instructors = await sql`
      SELECT 
        ia.id,
        ia.user_id,
        u.first_name,
        u.last_name,
        u.email,
        ia.bio,
        ia.qualifications,
        ia.specialization,
        ia.years_of_experience,
        ia.average_rating,
        ia.total_ratings,
        ia.is_active,
        ia.status as application_status,
        ia.submitted_at,
        ia.created_at
      FROM instructor_applications ia
      JOIN users u ON u.id = ia.user_id
      WHERE ia.status = 'approved' AND ia.is_active = true
      ${search ? sql`AND (u.first_name ILIKE ${`%${search}%`} OR u.last_name ILIKE ${`%${search}%`} OR ia.bio ILIKE ${`%${search}%`})` : sql``}
      ${specialization ? sql`AND ia.specialization ILIKE ${`%${specialization}%`}` : sql``}
      ORDER BY ia.average_rating DESC, ia.created_at DESC
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
    console.error('Get Instructors Error:', dbError)
    return handleDatabaseError(dbError, 'Get Instructors')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Instructors')
