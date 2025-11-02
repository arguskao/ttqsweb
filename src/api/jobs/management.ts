/**
 * 工作管理路由
 * 處理工作的創建、更新、刪除等操作
 */

import { validateIntParam } from '../../utils/param-validation'
import { requireAuth, requireRole } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { JobRepository } from './repositories'
import type { Job, CreateJobRequest, UpdateJobRequest, JobSearchParams } from './types'

// Repository實例
const jobRepo = new JobRepository()

export function setupJobManagementRoutes(router: ApiRouter): void {
  // 獲取所有工作（帶篩選和分頁）
  router.get('/api/v1/jobs', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
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
        page,
        limit
      } = req.query ?? {}

      const searchParams: JobSearchParams = {
        jobType: jobType as string,
        location: location as string,
        search: search as string,
        salaryMin: salaryMin ? parseInt(salaryMin as string, 10) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax as string, 10) : undefined,
        experienceLevel: experienceLevel as string,
        educationLevel: educationLevel as string,
        remoteWork: remoteWork ? remoteWork === 'true' : undefined,
        employerId: employerId ? parseInt(employerId as string) : undefined,
        isActive: isActive ? isActive === 'true' : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 9
      }

      const result = await jobRepo.searchJobs(searchParams)

      return {
        success: true,
        data: result.data,
        meta: result.meta
      }
    } catch (error) {
      console.error('Get jobs error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '載入工作列表失敗',
          statusCode: 500
        }
      }
    }
  })

  // 獲取雇主的工作
  router.get(
    '/api/v1/jobs/employer',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        if (!req.user) {
          throw new ValidationError('用戶未認證')
        }

        if (req.user.userType !== 'employer') {
          throw new UnauthorizedError('只有雇主可以查看自己的工作')
        }

        const jobs = await jobRepo.findByEmployer(req.user.id)

        return {
          success: true,
          data: jobs
        }
      } catch (error) {
        console.error('Get employer jobs error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof UnauthorizedError
                  ? 'UNAUTHORIZED'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取雇主工作失敗',
            statusCode:
              error instanceof ValidationError
                ? 400
                : error instanceof UnauthorizedError
                  ? 403
                  : 500
          }
        }
      }
    }
  )

  // 根據ID獲取工作
  router.get('/api/v1/jobs/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const jobId = validateIntParam(req.params?.id, 'id')

      const job = await jobRepo.findByIdWithEmployer(jobId)
      if (!job) {
        throw new NotFoundError('工作不存在')
      }

      return {
        success: true,
        data: job
      }
    } catch (error) {
      console.error('Get job error:', error)
      return {
        success: false,
        error: {
          code:
            error instanceof ValidationError
              ? 'VALIDATION_ERROR'
              : error instanceof NotFoundError
                ? 'NOT_FOUND'
                : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '獲取工作失敗',
          statusCode:
            error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
        }
      }
    }
  })

  // 創建工作
  router.post('/api/v1/jobs', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      if (!req.user) {
        throw new ValidationError('用戶未認證')
      }

      // 允許雇主和講師創建工作
      if (req.user.userType !== 'employer' && req.user.userType !== 'instructor') {
        throw new UnauthorizedError('只有雇主或講師可以創建工作')
      }

      const {
        title,
        description,
        company_name,
        location,
        job_type,
        salary_min,
        salary_max,
        salary_currency,
        requirements,
        benefits,
        skills_required,
        experience_level,
        education_level,
        remote_work,
        application_deadline
      }: CreateJobRequest = req.body as CreateJobRequest

      if (!title || !location || !job_type) {
        throw new ValidationError('標題、地點和工作類型都是必填項')
      }

      // 轉換 requirements 陣列為 TEXT（如果資料庫欄位是 TEXT）
      const requirementsText = Array.isArray(requirements)
        ? requirements.join(', ')
        : requirements || ''

      // 組合薪資字串
      let salaryStr: string | null = null
      if (salary_min && salary_max) {
        salaryStr = `${salary_min}-${salary_max}`
      } else if (salary_min) {
        salaryStr = `${salary_min}+`
      }

      const jobData: any = {
        title,
        company: company_name || '未提供公司名稱', // 使用 company 欄位
        location,
        job_type,
        salary: salaryStr, // 將薪資範圍組合成字串存入 salary
        description,
        requirements: requirementsText,
        is_active: true,
        employer_id: req.user.id,
        approval_status: 'pending' // 新工作預設為待審核狀態（如果欄位存在）
        // created_at 和 updated_at 會由資料庫自動設置
      }

      const job = await jobRepo.create(jobData)

      return {
        success: true,
        data: job
      }
    } catch (error) {
      console.error('Create job error:', error)
      return {
        success: false,
        error: {
          code:
            error instanceof ValidationError
              ? 'VALIDATION_ERROR'
              : error instanceof UnauthorizedError
                ? 'UNAUTHORIZED'
                : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '創建工作失敗',
          statusCode:
            error instanceof ValidationError ? 400 : error instanceof UnauthorizedError ? 403 : 500
        }
      }
    }
  })

  // 更新工作
  router.put('/api/v1/jobs/:id', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const jobId = parseInt(req.params?.id || '0', 10)
      const {
        title,
        description,
        company_name,
        location,
        job_type,
        salary_min,
        salary_max,
        salary_currency,
        requirements,
        benefits,
        skills_required,
        experience_level,
        education_level,
        remote_work,
        application_deadline,
        is_active
      }: UpdateJobRequest = req.body as UpdateJobRequest

      if (!jobId) {
        throw new ValidationError('無效的工作ID')
      }

      const job = await jobRepo.findById(jobId)
      if (!job) {
        throw new NotFoundError('工作不存在')
      }

      // 只有工作發布者或管理員可以更新
      if (job.employer_id !== req.user!.id && req.user!.userType !== 'admin') {
        throw new UnauthorizedError('只有工作發布者或管理員可以更新工作')
      }

      const updateData: Partial<Job> = {}
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (company_name !== undefined) updateData.company_name = company_name
      if (location !== undefined) updateData.location = location
      if (job_type !== undefined) updateData.job_type = job_type
      if (salary_min !== undefined) updateData.salary_min = salary_min
      if (salary_max !== undefined) updateData.salary_max = salary_max
      if (salary_currency !== undefined) updateData.salary_currency = salary_currency
      if (requirements !== undefined) updateData.requirements = requirements
      if (benefits !== undefined) updateData.benefits = benefits
      if (skills_required !== undefined) updateData.skills_required = skills_required
      if (experience_level !== undefined) updateData.experience_level = experience_level
      if (education_level !== undefined) updateData.education_level = education_level
      if (remote_work !== undefined) updateData.remote_work = remote_work
      if (application_deadline !== undefined) updateData.application_deadline = application_deadline
      if (is_active !== undefined && req.user!.userType === 'admin')
        updateData.is_active = is_active

      const updatedJob = await jobRepo.update(jobId, updateData)

      return {
        success: true,
        data: updatedJob
      }
    } catch (error) {
      console.error('Update job error:', error)
      return {
        success: false,
        error: {
          code:
            error instanceof ValidationError
              ? 'VALIDATION_ERROR'
              : error instanceof NotFoundError
                ? 'NOT_FOUND'
                : error instanceof UnauthorizedError
                  ? 'UNAUTHORIZED'
                  : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '更新工作失敗',
          statusCode:
            error instanceof ValidationError
              ? 400
              : error instanceof NotFoundError
                ? 404
                : error instanceof UnauthorizedError
                  ? 403
                  : 500
        }
      }
    }
  })

  // 刪除工作
  router.delete('/api/v1/jobs/:id', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const jobId = validateIntParam(req.params?.id, 'id')

      if (!jobId) {
        throw new ValidationError('無效的工作ID')
      }

      const job = await jobRepo.findById(jobId)
      if (!job) {
        throw new NotFoundError('工作不存在')
      }

      // 只有工作發布者或管理員可以刪除
      if (job.employer_id !== req.user!.id && req.user!.userType !== 'admin') {
        throw new UnauthorizedError('只有工作發布者或管理員可以刪除工作')
      }

      await jobRepo.delete(jobId)

      return {
        success: true,
        data: { message: '工作刪除成功' }
      }
    } catch (error) {
      console.error('Delete job error:', error)
      return {
        success: false,
        error: {
          code:
            error instanceof ValidationError
              ? 'VALIDATION_ERROR'
              : error instanceof NotFoundError
                ? 'NOT_FOUND'
                : error instanceof UnauthorizedError
                  ? 'UNAUTHORIZED'
                  : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '刪除工作失敗',
          statusCode:
            error instanceof ValidationError
              ? 400
              : error instanceof NotFoundError
                ? 404
                : error instanceof UnauthorizedError
                  ? 403
                  : 500
        }
      }
    }
  })

  // 獲取待審核的工作（管理員）
  router.get('/api/v1/jobs/pending-approval', requireRole(['admin']), async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const { page = '1', limit = '10' } = req.query ?? {}
      const searchParams: JobSearchParams = {
        approvalStatus: 'pending',
        adminView: true,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      }

      const result = await jobRepo.searchJobs(searchParams)

      return {
        success: true,
        data: result.data,
        meta: result.meta
      }
    } catch (error) {
      console.error('Get pending jobs error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '獲取待審核工作失敗',
          statusCode: 500
        }
      }
    }
  })

  // 審核工作（管理員）
  router.put('/api/v1/jobs/:id/approve', requireRole(['admin']), async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const jobId = validateIntParam(req.params?.id, 'id')
      const { status, review_notes }: { status: 'approved' | 'rejected'; review_notes?: string } = req.body as any

      if (!status || !['approved', 'rejected'].includes(status)) {
        throw new ValidationError('狀態必須是 approved 或 rejected')
      }

      const job = await jobRepo.findById(jobId)
      if (!job) {
        throw new NotFoundError('工作不存在')
      }

      // 更新審核狀態
      const updateData: any = {
        approval_status: status,
        reviewed_at: new Date(),
        reviewed_by: req.user!.id,
        review_notes: review_notes || null,
        updated_at: new Date()
      }

      const updatedJob = await jobRepo.update(jobId, updateData)

      return {
        success: true,
        data: { ...updatedJob, message: status === 'approved' ? '工作已審核通過' : '工作已拒絕' }
      }
    } catch (error) {
      console.error('Approve job error:', error)
      return {
        success: false,
        error: {
          code:
            error instanceof ValidationError
              ? 'VALIDATION_ERROR'
              : error instanceof NotFoundError
                ? 'NOT_FOUND'
                : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '審核工作失敗',
          statusCode:
            error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
        }
      }
    }
  })

  // 根據類型獲取工作
  router.get('/api/v1/jobs/type/:type', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const { type } = req.params as Record<string, string>

      if (!type || !['full_time', 'part_time', 'contract', 'internship'].includes(type)) {
        throw new ValidationError('無效的工作類型')
      }

      const jobs = await jobRepo.findByType(type)

      return {
        success: true,
        data: jobs
      }
    } catch (error) {
      console.error('Get jobs by type error:', error)
      return {
        success: false,
        error: {
          code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '獲取工作類型失敗',
          statusCode: error instanceof ValidationError ? 400 : 500
        }
      }
    }
  })

  // 根據地點獲取工作
  router.get('/api/v1/jobs/location/:location', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const { location } = req.params as Record<string, string>

      if (!location) {
        throw new ValidationError('地點參數不能為空')
      }

      const jobs = await jobRepo.findByLocation(location)

      return {
        success: true,
        data: jobs
      }
    } catch (error) {
      console.error('Get jobs by location error:', error)
      return {
        success: false,
        error: {
          code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '獲取地點工作失敗',
          statusCode: error instanceof ValidationError ? 400 : 500
        }
      }
    }
  })

  // 獲取工作統計
  router.get('/api/v1/jobs/stats', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const stats = await jobRepo.getStats()

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Get job stats error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '獲取工作統計失敗',
          statusCode: 500
        }
      }
    }
  })

  // 獲取工作分析
  router.get(
    '/api/v1/jobs/:id/analytics',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const jobId = validateIntParam(req.params?.id, 'id')

        if (!jobId) {
          throw new ValidationError('無效的工作ID')
        }

        const job = await jobRepo.findById(jobId)
        if (!job) {
          throw new NotFoundError('工作不存在')
        }

        // 只有工作發布者或管理員可以查看分析
        if (job.employer_id !== req.user!.id && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只有工作發布者或管理員可以查看分析')
        }

        const analytics = await jobRepo.getJobAnalytics(jobId)

        return {
          success: true,
          data: analytics
        }
      } catch (error) {
        console.error('Get job analytics error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : error instanceof UnauthorizedError
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取工作分析失敗',
            statusCode:
              error instanceof ValidationError
                ? 400
                : error instanceof NotFoundError
                  ? 404
                  : error instanceof UnauthorizedError
                    ? 403
                    : 500
          }
        }
      }
    }
  )

  // 啟用/停用工作（管理員）
  router.patch(
    '/api/v1/jobs/:id/toggle-status',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const jobId = validateIntParam(req.params?.id, 'id')

        const job = await jobRepo.findById(jobId)
        if (!job) {
          throw new NotFoundError('工作不存在')
        }

        await jobRepo.updateStatus(jobId, !job.is_active)

        return {
          success: true,
          data: { message: `工作${job.is_active ? '停用' : '啟用'}成功` }
        }
      } catch (error) {
        console.error('Toggle job status error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '切換工作狀態失敗',
            statusCode:
              error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
          }
        }
      }
    }
  )
}
