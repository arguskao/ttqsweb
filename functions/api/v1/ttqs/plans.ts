/**
 * TTQS Training Plans API - TTQS 訓練計劃管理
 * GET /api/v1/ttqs/plans - 獲取訓練計劃列表
 * POST /api/v1/ttqs/plans - 創建訓練計劃
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

// GET - 獲取訓練計劃列表
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)
  
  const token = validateToken(request.headers.get('Authorization'))
  parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status')
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    if (status) {
      whereClause += ` AND status = '${status}'`
    }

    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM ttqs_plans 
      ${sql.unsafe(whereClause)}
    `
    const total = parseInt(countResult[0]?.count || '0')

    const plans = await sql`
      SELECT 
        tp.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name
      FROM ttqs_plans tp
      LEFT JOIN users u ON tp.created_by = u.id
      ${sql.unsafe(whereClause)}
      ORDER BY tp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const formattedPlans = plans.map((plan: any) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      startDate: plan.start_date,
      endDate: plan.end_date,
      status: plan.status,
      targetAudience: plan.target_audience,
      objectives: plan.objectives,
      budget: plan.budget,
      createdBy: plan.created_by,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      creatorName: plan.creator_first_name && plan.creator_last_name
        ? `${plan.creator_first_name} ${plan.creator_last_name}`
        : null
    }))

    return createSuccessResponse({
      plans: formattedPlans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get TTQS Plans')
  }
}

// POST - 創建訓練計劃
async function handlePost(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    if (!body.title) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '標題為必填項')
    }

    const result = await sql`
      INSERT INTO ttqs_plans (
        title,
        description,
        start_date,
        end_date,
        status,
        target_audience,
        objectives,
        budget,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${body.title},
        ${body.description || null},
        ${body.startDate || null},
        ${body.endDate || null},
        ${body.status || 'draft'},
        ${body.targetAudience || null},
        ${body.objectives || null},
        ${body.budget || null},
        ${payload.userId},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const plan = result[0]
    return createSuccessResponse({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      startDate: plan.start_date,
      endDate: plan.end_date,
      status: plan.status,
      targetAudience: plan.target_audience,
      objectives: plan.objectives,
      budget: plan.budget,
      createdBy: plan.created_by,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Create TTQS Plan')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get TTQS Plans')
export const onRequestPost = withErrorHandler(handlePost, 'Create TTQS Plan')
