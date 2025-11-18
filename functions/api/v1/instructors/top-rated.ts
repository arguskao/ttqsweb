/**
 * Top Rated Instructors API
 * GET /api/v1/instructors/top-rated
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

async function handleTopRated(context: Context): Promise<Response> {
  const { request, env } = context

  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '10')

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        ia.id,
        ia.user_id,
        ia.bio,
        ia.qualifications,
        ia.specialization,
        ia.years_of_experience,
        ia.average_rating,
        ia.total_ratings,
        ia.is_active,
        u.first_name,
        u.last_name,
        u.email
      FROM instructor_applications ia
      JOIN users u ON u.id = ia.user_id
      WHERE ia.status = 'approved' 
        AND ia.is_active = true
        AND ia.average_rating IS NOT NULL
      ORDER BY ia.average_rating DESC, ia.total_ratings DESC
      LIMIT ${limit}
    `

    const instructors = result.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      bio: row.bio,
      qualifications: row.qualifications,
      specialization: row.specialization,
      yearsOfExperience: row.years_of_experience,
      averageRating: row.average_rating,
      totalRatings: row.total_ratings,
      isActive: row.is_active,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email
    }))

    return createSuccessResponse(instructors)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Top Rated Instructors')
  }
}

export const onRequestGet = withErrorHandler(handleTopRated, 'Get Top Rated Instructors')
