/**
 * TTQS Training Plan Detail API - TTQS 訓練計劃詳情
 * GET /api/v1/ttqs/plans/[id] - 獲取訓練計劃詳情
 * PUT /api/v1/ttqs/plans/[id] - 更新訓練計劃
 */

import { withErrorHandler, validateToken, parseJwtToken, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params: { id: string }
}

// GET - 獲取訓練計劃詳情
async function handleGet(context: Context): Promise<Response> {
  const { params, env } = context
  const planId = parseInt(params.id)
  
  if (isNaN(planId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的計劃 ID')
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const result = await sql`
      SELECT 
        tp.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        u.email as creator_email
      FROM ttqs_plans tp
      LEFT JOIN users u ON tp.created_by = u.id
      WHERE tp.id = ${planId}
    `

    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '訓練計劃不存在')
    }

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
      updatedAt: plan.updated_at,
      creator: {
        firstName: plan.creator_first_name,
        lastName: plan.creator_last_name,
        email: plan.creator_email
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get TTQS Plan Detail')
  }
}

// PUT - 更新訓練計劃
async function handlePut(context: Context): Promise<Response> {
  const { request, params, env } = context
  const planId = parseInt(params.id)
  
  if (isNaN(planId)) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, '無效的計劃 ID')
  }

  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    const existing = await sql`
      SELECT * FROM ttqs_plans WHERE id = ${planId}
    `
    if (existing.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '訓練計劃不存在')
    }

    if (existing[0].created_by !== payload.userId && payload.userType !== 'admin') {
      throw new ApiError(ErrorCode.FORBIDDEN, '無權限修改此訓練計劃')
    }

    const result = await sql`
      UPDATE ttqs_plans SET
        title = COALESCE(${body.title}, title),
        description = COALESCE(${body.description}, description),
        start_date = COALESCE(${body.startDate}, start_date),
        end_date = COALESCE(${body.endDate}, end_date),
        status = COALESCE(${body.status}, status),
        target_audience = COALESCE(${body.targetAudience}, target_audience),
        objectives = COALESCE(${body.objectives}, objectives),
        budget = COALESCE(${body.budget}, budget),
        updated_at = NOW()
      WHERE id = ${planId}
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
    handleDatabaseError(dbError, 'Update TTQS Plan')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get TTQS Plan Detail')
export const onRequestPut = withErrorHandler(handlePut, 'Update TTQS Plan')
