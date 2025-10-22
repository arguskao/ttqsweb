/**
 * 工作申請路由
 * 處理工作申請、申請管理等操作
 */

import { requireAuth } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import {
  JobRepository,
  JobApplicationRepository,
  JobViewRepository,
  JobFavoriteRepository
} from './repositories'
import type { CreateJobApplicationRequest, UpdateJobApplicationRequest } from './types'

// Repository實例
const jobRepo = new JobRepository()
const applicationRepo = new JobApplicationRepository()
const viewRepo = new JobViewRepository()
const favoriteRepo = new JobFavoriteRepository()

export function setupJobApplicationRoutes(router: ApiRouter): void {
  // 申請工作
  router.post(
    '/api/v1/jobs/:id/apply',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const jobId = parseInt(req.params?.id || '0', 10)
        const { cover_letter, resume_url }: CreateJobApplicationRequest =
          req.body as CreateJobApplicationRequest

        if (!jobId) {
          throw new ValidationError('無效的工作ID')
        }

        if (!req.user) {
          throw new ValidationError('用戶未認證')
        }

        const job = await jobRepo.findById(jobId)
        if (!job) {
          throw new NotFoundError('工作不存在')
        }

        if (!job.is_active) {
          throw new ValidationError('工作已停用，無法申請')
        }

        // 檢查是否已經申請過
        const existingApplication = await applicationRepo.findUserApplication(req.user.id, jobId)
        if (existingApplication) {
          throw new ValidationError('您已經申請過這個工作')
        }

        // 檢查申請截止日期
        if (job.application_deadline && new Date() > job.application_deadline) {
          throw new ValidationError('申請已截止')
        }

        const applicationData = {
          job_id: jobId,
          user_id: req.user.id,
          cover_letter: cover_letter || null,
          resume_url: resume_url || null,
          status: 'pending' as const,
          applied_date: new Date(),
          reviewed_date: null,
          notes: null,
          created_at: new Date(),
          updated_at: new Date()
        }

        const application = await applicationRepo.create(applicationData)

        return {
          success: true,
          data: application
        }
      } catch (error) {
        console.error('Apply job error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '申請工作失敗',
            statusCode:
              error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
          }
        }
      }
    }
  )

  // 獲取工作申請
  router.get(
    '/api/v1/jobs/:id/applications',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const jobId = parseInt(req.params?.id || '0', 10)

        if (!jobId) {
          throw new ValidationError('無效的工作ID')
        }

        const job = await jobRepo.findById(jobId)
        if (!job) {
          throw new NotFoundError('工作不存在')
        }

        // 只有工作發布者或管理員可以查看申請
        if (job.employer_id !== req.user!.id && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只有工作發布者或管理員可以查看申請')
        }

        const applications = await applicationRepo.findByJob(jobId)

        return {
          success: true,
          data: applications
        }
      } catch (error) {
        console.error('Get job applications error:', error)
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
            message: error instanceof Error ? error.message : '獲取工作申請失敗',
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

  // 獲取用戶的申請
  router.get(
    '/api/v1/users/:userId/applications',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const { userId } = req.params as Record<string, string>
        const targetUserId = parseInt(userId || '')

        if (isNaN(targetUserId)) {
          throw new ValidationError('無效的用戶ID')
        }

        // 只能查看自己的申請，除非是管理員
        if (req.user!.id !== targetUserId && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只能查看自己的申請')
        }

        const applications = await applicationRepo.findByUser(targetUserId)

        return {
          success: true,
          data: applications
        }
      } catch (error) {
        console.error('Get user applications error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof UnauthorizedError
                  ? 'UNAUTHORIZED'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取用戶申請失敗',
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

  // 更新申請狀態
  router.put(
    '/api/v1/applications/:id/status',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const applicationId = parseInt(req.params?.id || '0', 10)
        const { status, notes }: UpdateJobApplicationRequest =
          req.body as UpdateJobApplicationRequest

        if (!applicationId) {
          throw new ValidationError('無效的申請ID')
        }

        if (
          !status ||
          !['pending', 'reviewed', 'interviewed', 'accepted', 'rejected'].includes(status)
        ) {
          throw new ValidationError('無效的申請狀態')
        }

        const application = await applicationRepo.findById(applicationId)
        if (!application) {
          throw new NotFoundError('申請不存在')
        }

        const job = await jobRepo.findById(application.job_id)
        if (!job) {
          throw new NotFoundError('相關工作不存在')
        }

        // 只有工作發布者或管理員可以更新申請狀態
        if (job.employer_id !== req.user!.id && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只有工作發布者或管理員可以更新申請狀態')
        }

        await applicationRepo.updateStatus(applicationId, status, notes)

        return {
          success: true,
          data: { message: '申請狀態更新成功' }
        }
      } catch (error) {
        console.error('Update application status error:', error)
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
            message: error instanceof Error ? error.message : '更新申請狀態失敗',
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

  // 取消申請
  router.delete(
    '/api/v1/applications/:id',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const applicationId = parseInt(req.params?.id || '0', 10)

        if (!applicationId) {
          throw new ValidationError('無效的申請ID')
        }

        const application = await applicationRepo.findById(applicationId)
        if (!application) {
          throw new NotFoundError('申請不存在')
        }

        // 只有申請者或管理員可以取消申請
        if (application.user_id !== req.user!.id && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只能取消自己的申請')
        }

        if (application.status === 'accepted') {
          throw new ValidationError('已接受的申請無法取消')
        }

        await applicationRepo.delete(applicationId)

        return {
          success: true,
          data: { message: '申請取消成功' }
        }
      } catch (error) {
        console.error('Cancel application error:', error)
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
            message: error instanceof Error ? error.message : '取消申請失敗',
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

  // 記錄工作瀏覽
  router.post('/api/v1/jobs/:id/view', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const jobId = parseInt(req.params?.id || '0', 10)

      if (!jobId) {
        throw new ValidationError('無效的工作ID')
      }

      const job = await jobRepo.findById(jobId)
      if (!job) {
        throw new NotFoundError('工作不存在')
      }

      const ipAddress = req.ip || 'unknown'
      await viewRepo.recordView(jobId, req.user?.id || null, ipAddress)

      return {
        success: true,
        data: { message: '瀏覽記錄已保存' }
      }
    } catch (error) {
      console.error('Record job view error:', error)
      return {
        success: false,
        error: {
          code:
            error instanceof ValidationError
              ? 'VALIDATION_ERROR'
              : error instanceof NotFoundError
                ? 'NOT_FOUND'
                : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '記錄瀏覽失敗',
          statusCode:
            error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
        }
      }
    }
  })

  // 收藏工作
  router.post(
    '/api/v1/jobs/:id/favorite',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const jobId = parseInt(req.params?.id || '0', 10)

        if (!jobId) {
          throw new ValidationError('無效的工作ID')
        }

        const job = await jobRepo.findById(jobId)
        if (!job) {
          throw new NotFoundError('工作不存在')
        }

        // 檢查是否已經收藏
        const isFavorited = await favoriteRepo.isFavorited(jobId, req.user!.id)
        if (isFavorited) {
          throw new ValidationError('您已經收藏過這個工作')
        }

        await favoriteRepo.addFavorite(jobId, req.user!.id)

        return {
          success: true,
          data: { message: '工作收藏成功' }
        }
      } catch (error) {
        console.error('Favorite job error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '收藏工作失敗',
            statusCode:
              error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
          }
        }
      }
    }
  )

  // 取消收藏工作
  router.delete(
    '/api/v1/jobs/:id/favorite',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const jobId = parseInt(req.params?.id || '0', 10)

        if (!jobId) {
          throw new ValidationError('無效的工作ID')
        }

        const job = await jobRepo.findById(jobId)
        if (!job) {
          throw new NotFoundError('工作不存在')
        }

        await favoriteRepo.removeFavorite(jobId, req.user!.id)

        return {
          success: true,
          data: { message: '取消收藏成功' }
        }
      } catch (error) {
        console.error('Unfavorite job error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '取消收藏失敗',
            statusCode:
              error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
          }
        }
      }
    }
  )

  // 獲取用戶收藏
  router.get(
    '/api/v1/users/:userId/favorites',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const { userId } = req.params as Record<string, string>
        const targetUserId = parseInt(userId || '')

        if (isNaN(targetUserId)) {
          throw new ValidationError('無效的用戶ID')
        }

        // 只能查看自己的收藏，除非是管理員
        if (req.user!.id !== targetUserId && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只能查看自己的收藏')
        }

        const favorites = await favoriteRepo.getUserFavorites(targetUserId)

        return {
          success: true,
          data: favorites
        }
      } catch (error) {
        console.error('Get user favorites error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof UnauthorizedError
                  ? 'UNAUTHORIZED'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取用戶收藏失敗',
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

  // 檢查是否已申請/收藏
  router.get(
    '/api/v1/jobs/:id/status',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const jobId = parseInt(req.params?.id || '0', 10)

        if (!jobId) {
          throw new ValidationError('無效的工作ID')
        }

        const job = await jobRepo.findById(jobId)
        if (!job) {
          throw new NotFoundError('工作不存在')
        }

        const [application, isFavorited] = await Promise.all([
          applicationRepo.findUserApplication(req.user!.id, jobId),
          favoriteRepo.isFavorited(jobId, req.user!.id)
        ])

        return {
          success: true,
          data: {
            hasApplied: !!application,
            application: application || null,
            isFavorited,
            canApply:
              !application &&
              job.is_active &&
              (!job.application_deadline || new Date() <= job.application_deadline)
          }
        }
      } catch (error) {
        console.error('Get job status error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取工作狀態失敗',
            statusCode:
              error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
          }
        }
      }
    }
  )
}

