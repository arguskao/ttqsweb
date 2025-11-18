/**
 * Popular Courses API
 * GET /api/v1/courses/popular
 */

import {
  withErrorHandler,
  validateDatabaseUrl,
  handleDatabaseError,
  createSuccessResponse
} from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

async function handlePopular(context: Context): Promise<Response> {
  const { request, env } = context

  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '10')

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.instructor_id,
        c.duration_hours,
        c.price,
        c.category,
        c.difficulty_level,
        c.is_published,
        c.created_at,
        COUNT(DISTINCT e.id) as enrollment_count,
        AVG(r.rating) as average_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_reviews r ON r.course_id = c.id
      WHERE c.is_published = true
      GROUP BY c.id
      ORDER BY enrollment_count DESC, average_rating DESC NULLS LAST
      LIMIT ${limit}
    `

    const courses = result.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      instructorId: row.instructor_id,
      durationHours: row.duration_hours,
      price: row.price,
      category: row.category,
      difficultyLevel: row.difficulty_level,
      isPublished: row.is_published,
      createdAt: row.created_at,
      enrollmentCount: parseInt(row.enrollment_count) || 0,
      averageRating: parseFloat(row.average_rating) || null,
      reviewCount: parseInt(row.review_count) || 0
    }))

    return createSuccessResponse(courses)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Popular Courses')
  }
}

export const onRequestGet = withErrorHandler(handlePopular, 'Get Popular Courses')
