/**
 * 工作功能Repository類別
 * 提供數據庫操作接口
 */

import { BaseRepository } from '../database'

import type {
  Job,
  JobWithEmployer,
  JobStats,
  JobSearchParams,
  JobPaginationMeta,
  JobApplication,
  JobApplicationWithDetails,
  JobView,
  JobFavorite,
  JobAnalytics
} from './types'

// 工作Repository
export class JobRepository extends BaseRepository<Job> {
  constructor() {
    super('jobs')
  }

  // 搜索工作（帶篩選和分頁）
  async searchJobs(
    params: JobSearchParams
  ): Promise<{ data: JobWithEmployer[]; meta: JobPaginationMeta }> {
    const {
      jobType,
      location,
      search,
      salaryMin,
      salaryMax,
      experienceLevel,
      educationLevel,
      remoteWork,
      employerId,
      isActive,
      page = 1,
      limit = 9
    } = params

    const offset = (page - 1) * limit
    const whereConditions: string[] = []
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

    if (search) {
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex})`
      )
      values.push(`%${search}%`)
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

    if (experienceLevel) {
      whereConditions.push(`experience_level = $${paramIndex}`)
      values.push(experienceLevel)
      paramIndex++
    }

    if (educationLevel) {
      whereConditions.push(`education_level = $${paramIndex}`)
      values.push(educationLevel)
      paramIndex++
    }

    if (remoteWork !== undefined) {
      whereConditions.push(`remote_work = $${paramIndex}`)
      values.push(remoteWork)
      paramIndex++
    }

    if (employerId) {
      whereConditions.push(`employer_id = $${paramIndex}`)
      values.push(employerId)
      paramIndex++
    }

    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`)
      values.push(isActive)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 獲取總數
    const countResult = await this.queryOne(
      `SELECT COUNT(*) as total FROM jobs ${whereClause}`,
      values
    )
    const total = parseInt(countResult?.total || '0')

    // 獲取數據
    const data = await this.queryMany(
      `SELECT j.*, 
              u.first_name || ' ' || u.last_name as employer_name,
              u.email as employer_email,
              u.company_name as employer_company,
              COUNT(ja.id) as application_count,
              COUNT(jv.id) as view_count
       FROM jobs j
       LEFT JOIN users u ON j.employer_id = u.id
       LEFT JOIN job_applications ja ON j.id = ja.job_id
       LEFT JOIN job_views jv ON j.id = jv.job_id
       ${whereClause}
       GROUP BY j.id, u.first_name, u.last_name, u.email, u.company_name
       ORDER BY j.posted_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    const meta: JobPaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }

    return { data, meta }
  }

  // 根據ID獲取工作詳情
  async findByIdWithEmployer(jobId: number): Promise<JobWithEmployer | null> {
    const result = await this.queryOne(
      `SELECT j.*, 
              u.first_name || ' ' || u.last_name as employer_name,
              u.email as employer_email,
              u.company_name as employer_company,
              COUNT(ja.id) as application_count,
              COUNT(jv.id) as view_count
       FROM jobs j
       LEFT JOIN users u ON j.employer_id = u.id
       LEFT JOIN job_applications ja ON j.id = ja.job_id
       LEFT JOIN job_views jv ON j.id = jv.job_id
       WHERE j.id = $1
       GROUP BY j.id, u.first_name, u.last_name, u.email, u.company_name`,
      [jobId]
    )

    return result || null
  }

  // 根據雇主獲取工作
  async findByEmployer(employerId: number): Promise<Job[]> {
    return this.queryMany('SELECT * FROM jobs WHERE employer_id = $1 ORDER BY posted_date DESC', [
      employerId
    ])
  }

  // 根據類型獲取工作
  async findByType(jobType: string): Promise<Job[]> {
    return this.queryMany(
      'SELECT * FROM jobs WHERE job_type = $1 AND is_active = true ORDER BY posted_date DESC',
      [jobType]
    )
  }

  // 根據地點獲取工作
  async findByLocation(location: string): Promise<Job[]> {
    return this.queryMany(
      'SELECT * FROM jobs WHERE location ILIKE $1 AND is_active = true ORDER BY posted_date DESC',
      [`%${location}%`]
    )
  }

  // 獲取工作統計
  async getStats(): Promise<JobStats> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total_jobs,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs,
         AVG(salary_min) as average_salary,
         COUNT(CASE WHEN remote_work = true THEN 1 END) as remote_jobs_count,
         COUNT(CASE WHEN posted_date >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_jobs
       FROM jobs`
    )

    const typeStats = await this.queryMany(
      'SELECT job_type, COUNT(*) as count FROM jobs GROUP BY job_type ORDER BY count DESC'
    )

    const locationStats = await this.queryMany(
      'SELECT location, COUNT(*) as count FROM jobs GROUP BY location ORDER BY count DESC LIMIT 10'
    )

    const experienceStats = await this.queryMany(
      'SELECT experience_level, COUNT(*) as count FROM jobs GROUP BY experience_level ORDER BY count DESC'
    )

    const jobsByType: Record<string, number> = {}
    const jobsByLocation: Record<string, number> = {}
    const jobsByExperienceLevel: Record<string, number> = {}

    typeStats.forEach(stat => {
      jobsByType[stat.job_type] = parseInt(stat.count)
    })

    locationStats.forEach(stat => {
      jobsByLocation[stat.location] = parseInt(stat.count)
    })

    experienceStats.forEach(stat => {
      jobsByExperienceLevel[stat.experience_level] = parseInt(stat.count)
    })

    return {
      totalJobs: parseInt(result?.total_jobs || '0'),
      activeJobs: parseInt(result?.active_jobs || '0'),
      jobsByType,
      jobsByLocation,
      jobsByExperienceLevel,
      averageSalary: parseFloat(result?.average_salary || '0'),
      remoteJobsCount: parseInt(result?.remote_jobs_count || '0'),
      recentJobs: parseInt(result?.recent_jobs || '0')
    }
  }

  // 更新工作狀態
  async updateStatus(jobId: number, isActive: boolean): Promise<void> {
    await this.executeRaw('UPDATE jobs SET is_active = $1, updated_at = NOW() WHERE id = $2', [
      isActive,
      jobId
    ])
  }

  // 獲取工作分析
  async getJobAnalytics(jobId: number): Promise<JobAnalytics | null> {
    const job = await this.findById(jobId)
    if (!job) return null

    const viewsResult = await this.queryOne(
      'SELECT COUNT(*) as total_views FROM job_views WHERE job_id = $1',
      [jobId]
    )

    const applicationsResult = await this.queryOne(
      'SELECT COUNT(*) as total_applications FROM job_applications WHERE job_id = $1',
      [jobId]
    )

    const statusStats = await this.queryMany(
      'SELECT status, COUNT(*) as count FROM job_applications WHERE job_id = $1 GROUP BY status',
      [jobId]
    )

    const topApplicants = await this.queryMany(
      `SELECT ja.user_id, 
              u.first_name || ' ' || u.last_name as user_name,
              ja.status,
              ja.applied_date
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       WHERE ja.job_id = $1
       ORDER BY ja.applied_date DESC
       LIMIT 5`,
      [jobId]
    )

    const totalViews = parseInt(viewsResult?.total_views || '0')
    const totalApplications = parseInt(applicationsResult?.total_applications || '0')
    const applicationRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0

    const applicationsByStatus: Record<string, number> = {}
    statusStats.forEach(stat => {
      applicationsByStatus[stat.status] = parseInt(stat.count)
    })

    return {
      totalViews,
      totalApplications,
      applicationRate,
      viewsBySource: {}, // 可以根據需要實現
      applicationsByStatus,
      topApplicants: topApplicants.map(applicant => ({
        user_id: applicant.user_id,
        user_name: applicant.user_name,
        match_score: 0 // 可以根據需要計算匹配度
      }))
    }
  }
}

// 工作申請Repository
export class JobApplicationRepository extends BaseRepository<JobApplication> {
  constructor() {
    super('job_applications')
  }

  // 根據工作ID獲取申請
  async findByJob(jobId: number): Promise<JobApplicationWithDetails[]> {
    return this.queryMany(
      `SELECT ja.*, 
              u.first_name || ' ' || u.last_name as user_name,
              u.email as user_email,
              u.phone as user_phone,
              j.title as job_title,
              j.company_name
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.job_id = $1
       ORDER BY ja.applied_date DESC`,
      [jobId]
    )
  }

  // 根據用戶ID獲取申請
  async findByUser(userId: number): Promise<JobApplicationWithDetails[]> {
    return this.queryMany(
      `SELECT ja.*, 
              u.first_name || ' ' || u.last_name as user_name,
              u.email as user_email,
              u.phone as user_phone,
              j.title as job_title,
              j.company_name
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.user_id = $1
       ORDER BY ja.applied_date DESC`,
      [userId]
    )
  }

  // 查找用戶對特定工作的申請
  async findUserApplication(userId: number, jobId: number): Promise<JobApplication | null> {
    return this.queryOne('SELECT * FROM job_applications WHERE user_id = $1 AND job_id = $2', [
      userId,
      jobId
    ])
  }

  // 更新申請狀態
  async updateStatus(applicationId: number, status: string, notes?: string): Promise<void> {
    await this.executeRaw(
      'UPDATE job_applications SET status = $1, notes = $2, reviewed_date = NOW(), updated_at = NOW() WHERE id = $3',
      [status, notes, applicationId]
    )
  }

  // 獲取申請統計
  async getApplicationStats(): Promise<Record<string, number>> {
    const result = await this.queryMany(
      'SELECT status, COUNT(*) as count FROM job_applications GROUP BY status'
    )

    const stats: Record<string, number> = {}
    result.forEach(row => {
      stats[row.status] = parseInt(row.count)
    })

    return stats
  }
}

// 工作瀏覽Repository
export class JobViewRepository extends BaseRepository<JobView> {
  constructor() {
    super('job_views')
  }

  // 記錄工作瀏覽
  async recordView(jobId: number, userId: number | null, ipAddress: string): Promise<JobView> {
    const viewData = {
      job_id: jobId,
      user_id: userId,
      ip_address: ipAddress,
      viewed_at: new Date()
    }

    return this.create(viewData)
  }

  // 獲取工作瀏覽統計
  async getJobViews(jobId: number): Promise<number> {
    const result = await this.queryOne(
      'SELECT COUNT(*) as count FROM job_views WHERE job_id = $1',
      [jobId]
    )

    return parseInt(result?.count || '0')
  }

  // 獲取用戶瀏覽記錄
  async getUserViews(userId: number): Promise<JobView[]> {
    return this.queryMany(
      `SELECT jv.*, j.title as job_title, j.company_name
       FROM job_views jv
       JOIN jobs j ON jv.job_id = j.id
       WHERE jv.user_id = $1
       ORDER BY jv.viewed_at DESC`,
      [userId]
    )
  }
}

// 工作收藏Repository
export class JobFavoriteRepository extends BaseRepository<JobFavorite> {
  constructor() {
    super('job_favorites')
  }

  // 添加收藏
  async addFavorite(jobId: number, userId: number): Promise<JobFavorite> {
    const favoriteData = {
      job_id: jobId,
      user_id: userId,
      created_at: new Date()
    }

    return this.create(favoriteData)
  }

  // 移除收藏
  async removeFavorite(jobId: number, userId: number): Promise<void> {
    await this.executeRaw('DELETE FROM job_favorites WHERE job_id = $1 AND user_id = $2', [
      jobId,
      userId
    ])
  }

  // 檢查是否已收藏
  async isFavorited(jobId: number, userId: number): Promise<boolean> {
    const result = await this.queryOne(
      'SELECT id FROM job_favorites WHERE job_id = $1 AND user_id = $2',
      [jobId, userId]
    )

    return !!result
  }

  // 獲取用戶收藏
  async getUserFavorites(userId: number): Promise<JobFavorite[]> {
    return this.queryMany(
      `SELECT jf.*, j.title as job_title, j.company_name, j.location
       FROM job_favorites jf
       JOIN jobs j ON jf.job_id = j.id
       WHERE jf.user_id = $1
       ORDER BY jf.created_at DESC`,
      [userId]
    )
  }
}

