/**
 * User Favorites API - 用戶收藏管理
 * GET /api/v1/users/[userId]/favorites - 獲取用戶收藏的工作列表
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { userId: string }
}

async function handleGet(context: Context): Promise<Response> {
  const { request, params, env } = context
  const userId = parseInt(params.userId)
  
  if (isNaN(userId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的用戶 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 只能查看自己的收藏
  if (payload.userId !== userId && payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '無權限查看此用戶的收藏')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM job_favorites 
      WHERE user_id = ${userId}
    `
    const total = parseInt(countResult[0]?.count || '0')

    const favorites = await sql`
      SELECT 
        jf.created_at as favorited_at,
        j.*
      FROM job_favorites jf
      LEFT JOIN jobs j ON jf.job_id = j.id
      WHERE jf.user_id = ${userId}
      ORDER BY jf.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const formattedFavorites = favorites.map((fav: any) => ({
      jobId: fav.id,
      title: fav.title,
      company: fav.company,
      location: fav.location,
      salary: fav.salary,
      type: fav.type,
      description: fav.description,
      requirements: fav.requirements,
      status: fav.status,
      favoritedAt: fav.favorited_at,
      createdAt: fav.created_at
    }))

    return createSuccessResponse({
      favorites: formattedFavorites,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get User Favorites')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get User Favorites')
