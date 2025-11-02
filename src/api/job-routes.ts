import { validateIntParam } from '../utils/param-validation'

import { BaseRepository } from './database'
import { ValidationError, NotFoundError } from './errors'
import { withAuth } from './middleware-helpers'
import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'

// Job listing interface
interface Job {
  id: number
  employer_id: number
  title: string
  description: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  job_type: 'full_time' | 'part_time' | 'internship' | null
  requirements: string | null
  is_active: boolean
  created_at: Date
  expires_at: Date | null
  updated_at: Date
}

// Job application interface
interface JobApplication {
  id: number
  job_id: number
  applicant_id: number
  application_date: Date
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  cover_letter: string | null
  resume_url: string | null
}

// Job repository
class JobRepository extends BaseRepository<Job> {
  constructor() {
    super('jobs')
  }

  // Find active jobs with filters
  async findActiveWithFilters(filters: {
    jobType?: string
    location?: string
    salaryMin?: number
    salaryMax?: number
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: Job[]; meta: any }> {
    const { jobType, location, salaryMin, salaryMax, search, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const whereConditions: string[] = [
      'is_active = true',
      "COALESCE(approval_status, 'approved') = 'approved'" // 只顯示已審核通過的工作
    ]
    const values: any[] = []
    let paramIndex = 1

    if (jobType) {
      whereConditions.push(`job_type = $${paramIndex}`)
      values.push(jobType)
      paramIndex++
    }

    if (location) {
      whereConditions.push(`location ILIKE $${paramIndex}`)
      values.push(`%${location}%`)
      paramIndex++
    }

    if (salaryMin) {
      whereConditions.push(`salary_min >= $${paramIndex}`)
      values.push(salaryMin)
      paramIndex++
    }

    if (salaryMax) {
      whereConditions.push(`salary_max <= $${paramIndex}`)
      values.push(salaryMax)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      values.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const { db } = await import('../utils/database')
    const countResult = await db.queryOne({
      text: `SELECT COUNT(*) as count FROM jobs WHERE ${whereClause}`,
      values
    })
    const total = parseInt((countResult as any)?.count || '0', 10)

    // Get paginated data
    const data = await db.queryMany({
      text: `
                SELECT * FROM jobs
                WHERE ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `,
      values: [...values, limit, offset]
    })

    return {
      data: data as Job[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // Get jobs by employer
  async findByEmployer(employerId: number): Promise<Job[]> {
    const { db } = await import('../utils/database')
    return await db.queryMany({
      text: `
                SELECT * FROM jobs
                WHERE employer_id = $1
                ORDER BY created_at DESC
            `,
      values: [employerId]
    })
  }
}

// Initialize repository
const jobRepo = new JobRepository()

// Setup job routes
export function setupJobRoutes(router: ApiRouter): void {
  // Get all jobs (public, with optional filters)
  router.get('/api/v1/jobs', async (req: ApiRequest): Promise<ApiResponse> => {
    const {
      page = '1',
      limit = '10',
      job_type,
      location,
      salary_min,
      salary_max,
      search
    } = req.query ?? {}

    const filters = {
      jobType: job_type,
      location,
      salaryMin: salary_min ? parseInt(salary_min) : undefined,
      salaryMax: salary_max ? parseInt(salary_max) : undefined,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    }

    const result = await jobRepo.findActiveWithFilters(filters)

    return {
      success: true,
      data: {
        jobs: result.data
      },
      meta: result.meta
    }
  })

  // Get employer's jobs (requires employer authentication) - Must come before /:id route
  router.get(
    '/api/v1/jobs/employer',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      if ((req.user?.userType || req.user?.user_type) !== 'employer') {
        throw new ValidationError('只有雇主可以訪問此端點')
      }

      const jobs = await jobRepo.findByEmployer(req.user!.id)

      return {
        success: true,
        data: {
          jobs
        }
      }
    })
  )

  // Get job by ID
  router.get('/api/v1/jobs/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    const jobId = validateIntParam(req.params?.id, 'id')

    const job = await jobRepo.findById(jobId)

    if (!job) {
      throw new NotFoundError('職缺不存在')
    }

    return {
      success: true,
      data: job
    }
  })
}
