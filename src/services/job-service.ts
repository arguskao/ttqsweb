import { apiService } from './api'
import type { Job, ApiResponse } from '@/types'

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
    // 模擬數據 - 用於測試篩選功能
    const mockJobs: JobWithEmployer[] = [
      {
        id: 1,
        employerId: 1,
        title: '藥局助理- 台北市',
        description: '負責藥品管理、顧客服務等工作',
        location: '台北市大安區',
        salaryMin: 30000,
        salaryMax: 40000,
        jobType: 'full_time',
        requirements: '具備基本藥學知識',
        isActive: true,
        createdAt: new Date().toISOString(),
        expiresAt: undefined,
        employerName: '未提供雇主名稱',
        hasApplied: false
      },
      {
        id: 2,
        employerId: 1,
        title: '兼職藥局助理-新北市',
        description: '週末兼職,協助藥師處理日常業務',
        location: '新北市板橋區',
        salaryMin: 15000,
        salaryMax: 25000,
        jobType: 'part_time',
        requirements: '週末可工作',
        isActive: true,
        createdAt: new Date().toISOString(),
        expiresAt: undefined,
        employerName: '未提供雇主名稱',
        hasApplied: false
      },
      {
        id: 3,
        employerId: 1,
        title: '藥局實習生',
        description: '提供完整實習訓練,有機會轉正職',
        location: '桃園市中壢區',
        salaryMin: 20000,
        salaryMax: 30000,
        jobType: 'internship',
        requirements: '藥學相關科系',
        isActive: true,
        createdAt: new Date().toISOString(),
        expiresAt: undefined,
        employerName: '未提供雇主名稱',
        hasApplied: false
      }
    ]

    // 應用篩選
    let filteredJobs = mockJobs

    if (filters?.jobType) {
      filteredJobs = filteredJobs.filter(job => job.jobType === filters.jobType)
    }

    if (filters?.location) {
      const locationTerm = filters.location.toLowerCase()
      filteredJobs = filteredJobs.filter(job => job.location?.toLowerCase().includes(locationTerm))
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredJobs = filteredJobs.filter(
        job =>
          job.title.toLowerCase().includes(searchTerm) ||
          job.description?.toLowerCase().includes(searchTerm)
      )
    }

    if (filters?.salaryMin) {
      filteredJobs = filteredJobs.filter(
        job => job.salaryMin && job.salaryMin >= filters.salaryMin!
      )
    }

    if (filters?.salaryMax) {
      filteredJobs = filteredJobs.filter(
        job => job.salaryMax && job.salaryMax <= filters.salaryMax!
      )
    }

    // 分頁
    const page = filters?.page || 1
    const limit = filters?.limit || 9
    const offset = (page - 1) * limit
    const paginatedJobs = filteredJobs.slice(offset, offset + limit)

    return {
      data: paginatedJobs,
      meta: {
        page,
        limit,
        total: filteredJobs.length,
        totalPages: Math.ceil(filteredJobs.length / limit)
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
}

const jobService = new JobService()
export { jobService }
export default jobService
