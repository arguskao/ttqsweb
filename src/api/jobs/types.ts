/**
 * 工作功能類型定義
 * 定義所有工作相關的TypeScript接口
 */

// 工作基本信息
export interface Job {
  id: number
  title: string
  description: string
  company_name: string
  location: string
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  requirements: string[]
  benefits: string[]
  skills_required: string[]
  experience_level: 'entry' | 'mid' | 'senior' | 'executive'
  education_level: 'high_school' | 'bachelor' | 'master' | 'phd' | 'any'
  remote_work: boolean
  posted_date: Date
  application_deadline: Date | null
  is_active: boolean
  employer_id: number
  created_at: Date
  updated_at: Date
}

// 工作創建請求
export interface CreateJobRequest {
  title: string
  description: string
  company_name: string
  location: string
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  requirements?: string[]
  benefits?: string[]
  skills_required?: string[]
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive'
  education_level?: 'high_school' | 'bachelor' | 'master' | 'phd' | 'any'
  remote_work?: boolean
  application_deadline?: Date
}

// 工作更新請求
export interface UpdateJobRequest {
  title?: string
  description?: string
  company_name?: string
  location?: string
  job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  requirements?: string[]
  benefits?: string[]
  skills_required?: string[]
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive'
  education_level?: 'high_school' | 'bachelor' | 'master' | 'phd' | 'any'
  remote_work?: boolean
  application_deadline?: Date
  is_active?: boolean
}

// 工作搜索參數
export interface JobSearchParams {
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

// 工作統計
export interface JobStats {
  totalJobs: number
  activeJobs: number
  jobsByType: Record<string, number>
  jobsByLocation: Record<string, number>
  jobsByExperienceLevel: Record<string, number>
  averageSalary: number
  remoteJobsCount: number
  recentJobs: number
}

// 工作詳情（包含雇主信息）
export interface JobWithEmployer extends Job {
  employer_name?: string
  employer_email?: string
  employer_company?: string
  application_count?: number
  view_count?: number
}

// 工作申請
export interface JobApplication {
  id: number
  job_id: number
  user_id: number
  cover_letter: string | null
  resume_url: string | null
  status: 'pending' | 'reviewed' | 'interviewed' | 'accepted' | 'rejected'
  applied_date: Date
  reviewed_date: Date | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

// 工作申請請求
export interface CreateJobApplicationRequest {
  job_id: number
  cover_letter?: string
  resume_url?: string
}

// 工作申請更新請求
export interface UpdateJobApplicationRequest {
  status?: 'pending' | 'reviewed' | 'interviewed' | 'accepted' | 'rejected'
  notes?: string
}

// 工作申請詳情（包含用戶和工作信息）
export interface JobApplicationWithDetails extends JobApplication {
  user_name?: string
  user_email?: string
  user_phone?: string
  job_title?: string
  company_name?: string
}

// 工作收藏
export interface JobFavorite {
  id: number
  job_id: number
  user_id: number
  created_at: Date
}

// 工作瀏覽記錄
export interface JobView {
  id: number
  job_id: number
  user_id: number | null
  ip_address: string
  viewed_at: Date
}

// 工作分頁元數據
export interface JobPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 工作列表響應
export interface JobListResponse {
  jobs: JobWithEmployer[]
  meta: JobPaginationMeta
}

// 工作申請列表響應
export interface JobApplicationListResponse {
  applications: JobApplicationWithDetails[]
  meta: JobPaginationMeta
}

// 工作篩選器
export interface JobFilters {
  jobType?: 'full_time' | 'part_time' | 'contract' | 'internship'
  location?: string
  search?: string
  salaryRange?: {
    min: number
    max: number
  }
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  educationLevel?: 'high_school' | 'bachelor' | 'master' | 'phd' | 'any'
  remoteWork?: boolean
  employerId?: number
  isActive?: boolean
  sortBy?: 'posted_date' | 'salary_min' | 'title' | 'company_name'
  sortOrder?: 'asc' | 'desc'
}

// 工作匹配度
export interface JobMatch {
  jobId: number
  userId: number
  matchScore: number
  matchingSkills: string[]
  missingSkills: string[]
  experienceMatch: boolean
  educationMatch: boolean
  locationMatch: boolean
}

// 工作推薦
export interface JobRecommendation {
  job: JobWithEmployer
  matchScore: number
  reasons: string[]
}

// 工作分析
export interface JobAnalytics {
  totalViews: number
  totalApplications: number
  applicationRate: number
  viewsBySource: Record<string, number>
  applicationsByStatus: Record<string, number>
  topApplicants: Array<{
    user_id: number
    user_name: string
    match_score: number
  }>
}

// 工作類型
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship'

// 經驗等級
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive'

// 教育等級
export type EducationLevel = 'high_school' | 'bachelor' | 'master' | 'phd' | 'any'

// 申請狀態
export type ApplicationStatus = 'pending' | 'reviewed' | 'interviewed' | 'accepted' | 'rejected'

// 工作操作結果
export interface JobOperationResult {
  success: boolean
  job?: Job
  error?: string
  message?: string
}

// 工作批量操作
export interface JobBatchOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'update_category'
  jobIds: number[]
  data?: any
}

// 工作權限
export interface JobPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canApply: boolean
  reason?: string
}

// 工作審計日誌
export interface JobAuditLog {
  id: number
  job_id: number
  user_id: number
  action: 'create' | 'update' | 'delete' | 'view' | 'apply'
  details: any
  ip_address: string
  user_agent: string
  created_at: Date
}

