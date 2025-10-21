// 重構的工作服務 - 使用 Neon 數據庫
import { neonDb } from '../utils/neon-database'

// Job interface
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
  updated_at: Date
  expires_at: Date | null
}

// Job service class
export class JobServiceNeon {
  // 獲取工作列表（帶分頁和篩選）
  async getJobs(
    options: {
      page?: number
      limit?: number
      jobType?: string
      location?: string
      search?: string
      salaryMin?: number
      salaryMax?: number
    } = {}
  ): Promise<{ data: any[]; meta: any }> {
    const { page = 1, limit = 9, jobType, location, search, salaryMin, salaryMax } = options
    const offset = (page - 1) * limit

    try {
      // 構建 WHERE 條件
      let whereConditions = [
        'j.is_active = true',
        '(j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)'
      ]
      let params: any[] = []
      let paramIndex = 1

      if (jobType) {
        whereConditions.push(`j.job_type = $${paramIndex}`)
        params.push(jobType)
        paramIndex++
      }

      if (location) {
        whereConditions.push(`j.location ILIKE $${paramIndex}`)
        params.push(`%${location}%`)
        paramIndex++
      }

      if (search) {
        whereConditions.push(`(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }

      if (salaryMin) {
        whereConditions.push(`j.salary_min >= $${paramIndex}`)
        params.push(salaryMin)
        paramIndex++
      }

      if (salaryMax) {
        whereConditions.push(`j.salary_max <= $${paramIndex}`)
        params.push(salaryMax)
        paramIndex++
      }

      const whereClause = whereConditions.join(' AND ')

      // 獲取總數
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM jobs j 
        WHERE ${whereClause}
      `
      const countResult = await neonDb.queryOne(countQuery, params)
      const total = parseInt(countResult?.count || '0', 10)

      // 獲取分頁數據
      const dataQuery = `
        SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as employer_name
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE ${whereClause}
        ORDER BY j.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      const jobs = await neonDb.queryMany(dataQuery, [...params, limit, offset])

      // 格式化數據
      const formattedJobs = jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        jobType: job.job_type,
        employerName: job.employer_name || 'Unknown Employer',
        createdAt: job.created_at,
        expiresAt: job.expires_at,
        hasApplied: false // TODO: 實際檢查用戶是否已申請
      }))

      return {
        data: formattedJobs,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Job service error:', error)
      throw new Error('Failed to fetch jobs')
    }
  }

  // 根據 ID 獲取工作
  async getJobById(id: number): Promise<any | null> {
    try {
      const query = `
        SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as employer_name,
          u.email as employer_email
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE j.id = $1
      `
      const job = await neonDb.queryOne(query, [id])

      if (!job) return null

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        jobType: job.job_type,
        requirements: job.requirements,
        employerName: job.employer_name || 'Unknown Employer',
        employerEmail: job.employer_email,
        createdAt: job.created_at,
        expiresAt: job.expires_at,
        isActive: job.is_active
      }
    } catch (error) {
      console.error('Get job by ID error:', error)
      throw new Error('Failed to fetch job')
    }
  }

  // 根據雇主 ID 獲取工作
  async getJobsByEmployer(employerId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as employer_name,
          u.email as employer_email
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE j.employer_id = $1 AND j.is_active = true
        ORDER BY j.created_at DESC
      `
      const jobs = await neonDb.query(query, [employerId])

      return jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        jobType: job.job_type,
        requirements: job.requirements,
        employerName: job.employer_name || 'Unknown Employer',
        employerEmail: job.employer_email,
        createdAt: job.created_at,
        expiresAt: job.expires_at,
        isActive: job.is_active
      }))
    } catch (error) {
      console.error('Get jobs by employer error:', error)
      throw new Error('Failed to fetch employer jobs')
    }
  }
}

// 導出實例
export const jobServiceNeon = new JobServiceNeon()
export default jobServiceNeon
