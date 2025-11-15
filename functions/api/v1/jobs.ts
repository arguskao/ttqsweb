/**
 * Jobs API - 工作列表和創建
 * GET /api/v1/jobs - 獲取工作列表（支持篩選）
 * POST /api/v1/jobs - 創建工作（需要雇主權限）
 */

import { withErrorHandler, validateToken, parseJwtToken, checkPermission, validateDatabaseUrl, handleDatabaseError, createSuccessResponse, ApiError, ErrorCode } from '../../utils/error-handler'

interface Context {
  request: Request
  env: {
    DATABASE_URL?: string
    JWT_SECRET?: string
  }
}

interface JobSearchParams {
  jobType?: string
  location?: string
  search?: string
  salaryMin?: number
  salaryMax?: number
  experienceLevel?: string
  educationLevel?: string
  remoteWork?: boolean
  employerId?: number
  isActive?: boolean
  page?: number
  limit?: number
}

// GET /api/v1/jobs - 獲取工作列表
async function handleGet(context: Context): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)
  
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 解析查詢參數
    const params: JobSearchParams = {
      jobType: url.searchParams.get('jobType') || undefined,
      location: url.searchParams.get('location') || undefined,
      search: url.searchParams.get('search') || undefined,
      salaryMin: url.searchParams.get('salaryMin') ? parseInt(url.searchParams.get('salaryMin')!) : undefined,
      salaryMax: url.searchParams.get('salaryMax') ? parseInt(url.searchParams.get('salaryMax')!) : undefined,
      experienceLevel: url.searchParams.get('experienceLevel') || undefined,
      educationLevel: url.searchParams.get('educationLevel') || undefined,
      remoteWork: url.searchParams.get('remoteWork') === 'true' ? true : undefined,
      employerId: url.searchParams.get('employerId') ? parseInt(url.searchParams.get('employerId')!) : undefined,
      isActive: url.searchParams.get('isActive') !== 'false', // 默認只顯示活躍的
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '9')
    }

    // 構建 WHERE 條件
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (params.isActive !== undefined) {
      conditions.push(`j.is_active = $${paramIndex}`)
      values.push(params.isActive)
      paramIndex++
    }

    if (params.jobType) {
      conditions.push(`j.job_type = $${paramIndex}`)
      values.push(params.jobType)
      paramIndex++
    }

    if (params.location) {
      conditions.push(`j.location ILIKE $${paramIndex}`)
      values.push(`%${params.location}%`)
      paramIndex++
    }

    if (params.search) {
      conditions.push(`(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex})`)
      values.push(`%${params.search}%`)
      paramIndex++
    }

    if (params.salaryMin !== undefined) {
      conditions.push(`j.salary_min >= $${paramIndex}`)
      values.push(params.salaryMin)
      paramIndex++
    }

    if (params.salaryMax !== undefined) {
      conditions.push(`j.salary_max <= $${paramIndex}`)
      values.push(params.salaryMax)
      paramIndex++
    }

    if (params.experienceLevel) {
      conditions.push(`j.experience_level = $${paramIndex}`)
      values.push(params.experienceLevel)
      paramIndex++
    }

    if (params.educationLevel) {
      conditions.push(`j.education_level = $${paramIndex}`)
      values.push(params.educationLevel)
      paramIndex++
    }

    if (params.remoteWork !== undefined) {
      conditions.push(`j.remote_work = $${paramIndex}`)
      values.push(params.remoteWork)
      paramIndex++
    }

    if (params.employerId) {
      conditions.push(`j.employer_id = $${paramIndex}`)
      values.push(params.employerId)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 獲取總數
    let countQuery = `SELECT COUNT(*) as count FROM jobs j ${whereClause}`
    // 手動替換參數
    values.forEach((val, idx) => {
      countQuery = countQuery.replace(`$${idx + 1}`, typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : String(val))
    })
    const countResult = await sql.unsafe(countQuery)
    const total = parseInt(countResult[0]?.count || '0')

    // 獲取數據
    const offset = (params.page! - 1) * params.limit!
    let dataQuery = `
      SELECT 
        j.*,
        u.first_name as employer_first_name,
        u.last_name as employer_last_name,
        u.email as employer_email
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    // 手動替換參數
    const allValues = [...values, params.limit, offset]
    allValues.forEach((val, idx) => {
      dataQuery = dataQuery.replace(`$${idx + 1}`, typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : String(val))
    })
    const jobs = await sql.unsafe(dataQuery)

    return createSuccessResponse({
      data: jobs,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit!)
      }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Jobs')
  }
}

// POST /api/v1/jobs - 創建工作
async function handlePost(context: Context): Promise<Response> {
  const { request, env } = context
  
  // 驗證權限
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  checkPermission(payload.userType, ['employer', 'admin'])

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    const body = await request.json() as any

    // 驗證必填字段
    if (!body.title || !body.description || !body.location) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '標題、描述和地點為必填項')
    }

    // 創建工作
    const result = await sql`
      INSERT INTO jobs (
        employer_id,
        title,
        description,
        job_type,
        location,
        salary_min,
        salary_max,
        experience_level,
        education_level,
        remote_work,
        requirements,
        benefits,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${payload.userId},
        ${body.title},
        ${body.description},
        ${body.jobType || 'full_time'},
        ${body.location},
        ${body.salaryMin || null},
        ${body.salaryMax || null},
        ${body.experienceLevel || null},
        ${body.educationLevel || null},
        ${body.remoteWork || false},
        ${body.requirements || null},
        ${body.benefits || null},
        ${body.isActive !== false},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Create Job')
  }
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Jobs')
export const onRequestPost = withErrorHandler(handlePost, 'Create Job')
