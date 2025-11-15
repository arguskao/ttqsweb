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
    const jobType = url.searchParams.get('jobType') || null
    const location = url.searchParams.get('location') || null
    const search = url.searchParams.get('search') || null
    const salaryMin = url.searchParams.get('salaryMin') ? parseInt(url.searchParams.get('salaryMin')!) : null
    const salaryMax = url.searchParams.get('salaryMax') ? parseInt(url.searchParams.get('salaryMax')!) : null
    const experienceLevel = url.searchParams.get('experienceLevel') || null
    const educationLevel = url.searchParams.get('educationLevel') || null
    const remoteWork = url.searchParams.get('remoteWork') === 'true' ? true : null
    const employerId = url.searchParams.get('employerId') ? parseInt(url.searchParams.get('employerId')!) : null
    const isActive = url.searchParams.get('isActive') !== 'false' // 默認只顯示活躍的
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '9')
    const offset = (page - 1) * limit

    // 使用 1=1 技巧構建動態查詢
    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM jobs j
      WHERE 1=1
        ${isActive !== null ? sql`AND j.is_active = ${isActive}` : sql``}
        ${jobType ? sql`AND j.job_type = ${jobType}` : sql``}
        ${location ? sql`AND j.location ILIKE ${`%${location}%`}` : sql``}
        ${search ? sql`AND (j.title ILIKE ${`%${search}%`} OR j.description ILIKE ${`%${search}%`})` : sql``}
        ${salaryMin !== null ? sql`AND j.salary_min >= ${salaryMin}` : sql``}
        ${salaryMax !== null ? sql`AND j.salary_max <= ${salaryMax}` : sql``}
        ${experienceLevel ? sql`AND j.experience_level = ${experienceLevel}` : sql``}
        ${educationLevel ? sql`AND j.education_level = ${educationLevel}` : sql``}
        ${remoteWork !== null ? sql`AND j.remote_work = ${remoteWork}` : sql``}
        ${employerId !== null ? sql`AND j.employer_id = ${employerId}` : sql``}
    `
    const total = parseInt(countResult[0]?.count || '0')

    // 獲取數據
    const jobs = await sql`
      SELECT 
        j.*,
        u.first_name as employer_first_name,
        u.last_name as employer_last_name,
        u.email as employer_email
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      WHERE 1=1
        ${isActive !== null ? sql`AND j.is_active = ${isActive}` : sql``}
        ${jobType ? sql`AND j.job_type = ${jobType}` : sql``}
        ${location ? sql`AND j.location ILIKE ${`%${location}%`}` : sql``}
        ${search ? sql`AND (j.title ILIKE ${`%${search}%`} OR j.description ILIKE ${`%${search}%`})` : sql``}
        ${salaryMin !== null ? sql`AND j.salary_min >= ${salaryMin}` : sql``}
        ${salaryMax !== null ? sql`AND j.salary_max <= ${salaryMax}` : sql``}
        ${experienceLevel ? sql`AND j.experience_level = ${experienceLevel}` : sql``}
        ${educationLevel ? sql`AND j.education_level = ${educationLevel}` : sql``}
        ${remoteWork !== null ? sql`AND j.remote_work = ${remoteWork}` : sql``}
        ${employerId !== null ? sql`AND j.employer_id = ${employerId}` : sql``}
      ORDER BY j.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return createSuccessResponse({
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
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
