import { apiService } from './api'

import type { Job } from '@/types'

export interface JobFilters {
  jobType?: string
  location?: string
  search?: string
  salaryMin?: number
  salaryMax?: number
  page?: number
  limit?: number
}

export interface JobWithEmployer extends Job {
  employerName?: string
  hasApplied?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class JobService {
  // Get all jobs with filters
  async getJobs(filters?: JobFilters): Promise<PaginatedResponse<JobWithEmployer>> {
    const params: Record<string, any> = {
      page: filters?.page || 1,
      limit: filters?.limit || 9
    }

    if (filters?.jobType) params.jobType = filters.jobType
    if (filters?.location) params.location = filters.location
    if (filters?.search) params.search = filters.search
    if (filters?.salaryMin) params.salaryMin = filters.salaryMin
    if (filters?.salaryMax) params.salaryMax = filters.salaryMax

    const response = await apiService.get<{
      jobs: any[]
      meta: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>('/jobs', { params })

    // 轉換 API 數據格式
    const jobs: JobWithEmployer[] = (response.data?.jobs || []).map((job: any) => ({
      id: job.id,
      employerId: job.employer_id,
      title: job.title,
      description: job.description,
      location: job.location,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      jobType: job.job_type,
      requirements: job.requirements,
      isActive: job.is_active,
      createdAt: job.created_at,
      expiresAt: job.expires_at,
      employerName: job.employer_first_name && job.employer_last_name 
        ? `${job.employer_first_name} ${job.employer_last_name}`
        : job.company_name || '未提供雇主名稱',
      hasApplied: job.has_applied || false
    }))

    return {
      data: jobs,
      meta: response.data?.meta || {
        page: 1,
        limit: 9,
        total: 0,
        totalPages: 0
      }
    }
  }

  // Get job by ID
  async getJobById(id: number): Promise<Job> {
    const response = await apiService.get<Job>(`/jobs/${id}`)

    if (!response.data) {
      throw new Error('工作不存在')
    }

    return response.data
  }

  // Apply to a job
  async applyToJob(jobId: number): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(`/jobs/${jobId}/apply`)

    if (!response.data) {
      throw new Error('申請工作失敗')
    }

    return response.data
  }

  // Favorite a job
  async favoriteJob(jobId: number): Promise<void> {
    await apiService.post(`/jobs/${jobId}/favorite`)
  }

  // Unfavorite a job
  async unfavoriteJob(jobId: number): Promise<void> {
    await apiService.delete(`/jobs/${jobId}/favorite`)
  }

  // Get user's favorite jobs (ids)
  async getUserFavoriteIds(): Promise<number[]> {
    const res = await apiService.get<Array<{ job_id: number }>>('/users/favorites')
    const list = (res as any)?.data || []
    // 支援不同鍵名
    return list.map((f: any) => f.job_id || f.jobId).filter((id: any) => typeof id === 'number')
  }
}

const jobService = new JobService()
export { jobService }
export default jobService
