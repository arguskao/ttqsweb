// 重構的工作路由 - 使用 Neon 數據庫
import { jobServiceNeon } from './jobs-service-neon'
import { ValidationError, NotFoundError, AuthenticationError, AuthorizationError } from './errors'
import { requireEmployer } from './auth-middleware'
import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'

// 設置工作路由
export function setupJobRoutesNeon(router: ApiRouter): void {
  // 獲取所有工作（帶篩選和分頁）
  router.get('/api/v1/jobs', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const { jobType, location, search, salaryMin, salaryMax, page, limit } = req.query || {}

      const options = {
        jobType: jobType as string,
        location: location as string,
        search: search as string,
        salaryMin: salaryMin ? parseInt(salaryMin as string, 10) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 9
      }

      const result = await jobServiceNeon.getJobs(options)

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

  // Get employer's jobs (requires employer authentication) - Must come before /:id route
  router.get(
    '/api/v1/jobs/employer',
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        if (!req.user) {
          throw new AuthenticationError('需要登入才能訪問此資源')
        }

        if ((req.user.userType || req.user.user_type) !== 'employer') {
          throw new AuthorizationError('只有雇主可以訪問此資源')
        }

        const jobs = await jobServiceNeon.getJobsByEmployer(req.user.id)

        return {
          success: true,
          data: {
            jobs
          }
        }
      } catch (error) {
        throw error
      }
    },
    [requireEmployer]
  )

  // 根據 ID 獲取工作
  router.get('/api/v1/jobs/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const jobId = parseInt(req.params?.id || '0', 10)

      if (!jobId) {
        throw new ValidationError('無效的工作 ID')
      }

      const job = await jobServiceNeon.getJobById(jobId)

      if (!job) {
        throw new NotFoundError('工作不存在')
      }

      return {
        success: true,
        data: job
      }
    } catch (error) {
      console.error('Get job by ID error:', error)

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: error.constructor.name.replace('Error', '').toUpperCase(),
            message: error.message,
            statusCode: error instanceof NotFoundError ? 404 : 400
          }
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '載入工作失敗',
          statusCode: 500
        }
      }
    }
  })
}
