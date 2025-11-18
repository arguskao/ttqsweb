/**
 * 再培訓建議路由
 * 處理再培訓建議的創建、更新、接受等操作
 */

import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import { withAuth, withRole } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { RetrainingRecommendationRepository } from './repositories'
import type { CreateRecommendationRequest, UpdateRecommendationRequest } from './types'

// Repository實例
const recommendationRepo = new RetrainingRecommendationRepository()

export function setupRetrainingRecommendationRoutes(router: ApiRouter): void {
  // 獲取所有建議
  router.get(
    '/recommendations',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { user_id, course_id, priority, status } = query

      let recommendations
      if (user_id) {
        recommendations = await recommendationRepo.findByUser(parseInt(user_id as string))
      } else if (course_id) {
        recommendations = await recommendationRepo.findByCourse(parseInt(course_id as string))
      } else if (priority) {
        recommendations = await recommendationRepo.findByPriority(priority as string)
      } else if (status) {
        recommendations = await recommendationRepo.findByStatus(status as string)
      } else {
        // 普通用戶只能看到自己的建議
        if (req.user!.userType !== 'admin') {
          recommendations = await recommendationRepo.findByUser(req.user!.id)
        } else {
          recommendations = await recommendationRepo.findAll()
        }
      }

      return {
        success: true,
        data: recommendations
      }
    })
  )

  // 獲取建議詳情
  router.get(
    '/recommendations/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const recommendationId = parseInt(id!)

      if (isNaN(recommendationId)) {
        throw new ValidationError('Invalid recommendation ID')
      }

      const recommendation = await recommendationRepo.findById(recommendationId)
      if (!recommendation) {
        throw new NotFoundError('Recommendation not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && recommendation.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot view this recommendation')
      }

      return {
        success: true,
        data: recommendation
      }
    })
  )

  // 創建建議
  router.post(
    '/recommendations',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const { userId, courseId, reason, priority, deadline, notes }: CreateRecommendationRequest =
        req.body as CreateRecommendationRequest

      if (!userId || !courseId || !reason) {
        throw new ValidationError('User ID, course ID, and reason are required')
      }

      const recommendationData = {
        userId,
        courseId,
        recommendationReason: reason,
        reason,
        priority: priority || 'medium',
        deadline: deadline ? new Date(deadline) : null,
        notes: notes ?? '',
        status: 'pending' as const,
        recommendedAt: new Date(),
        expiresAt: deadline ? new Date(deadline) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const recommendation = await recommendationRepo.create(recommendationData)

      return {
        success: true,
        data: recommendation
      }
    })
  )

  // 更新建議
  router.put(
    '/recommendations/:id',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const recommendationId = parseInt(id!)
      const { reason, priority, deadline, notes, status }: UpdateRecommendationRequest =
        req.body as UpdateRecommendationRequest

      if (isNaN(recommendationId)) {
        throw new ValidationError('Invalid recommendation ID')
      }

      const recommendation = await recommendationRepo.findById(recommendationId)
      if (!recommendation) {
        throw new NotFoundError('Recommendation not found')
      }

      const updateData = {
        reason: reason || recommendation.reason,
        priority: priority || recommendation.priority,
        deadline: deadline ? new Date(deadline) : recommendation.deadline,
        notes: notes || recommendation.notes,
        status: status || recommendation.status,
        updatedAt: new Date()
      }

      const updatedRecommendation = await recommendationRepo.update(recommendationId, updateData)

      return {
        success: true,
        data: updatedRecommendation
      }
    })
  )

  // 接受建議
  router.put(
    '/recommendations/:id/accept',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const recommendationId = parseInt(id!)

      if (isNaN(recommendationId)) {
        throw new ValidationError('Invalid recommendation ID')
      }

      const recommendation = await recommendationRepo.findById(recommendationId)
      if (!recommendation) {
        throw new NotFoundError('Recommendation not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && recommendation.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot accept this recommendation')
      }

      // 檢查狀態
      if (recommendation.status !== 'pending') {
        throw new ValidationError('Only pending recommendations can be accepted')
      }

      const updateData = {
        status: 'accepted' as const,
        acceptedAt: new Date(),
        updatedAt: new Date()
      }

      const updatedRecommendation = await recommendationRepo.update(recommendationId, updateData)

      return {
        success: true,
        data: updatedRecommendation
      }
    })
  )

  // 拒絕建議
  router.put(
    '/recommendations/:id/reject',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const recommendationId = parseInt(id!)
      const { rejectionReason } = req.body as { rejectionReason?: string }

      if (isNaN(recommendationId)) {
        throw new ValidationError('Invalid recommendation ID')
      }

      const recommendation = await recommendationRepo.findById(recommendationId)
      if (!recommendation) {
        throw new NotFoundError('Recommendation not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && recommendation.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot reject this recommendation')
      }

      // 檢查狀態
      if (recommendation.status !== 'pending') {
        throw new ValidationError('Only pending recommendations can be rejected')
      }

      const updateData = {
        status: 'declined' as const,
        rejectionReason: rejectionReason ?? '',
        rejectedAt: new Date(),
        updatedAt: new Date()
      }

      const updatedRecommendation = await recommendationRepo.update(recommendationId, updateData)

      return {
        success: true,
        data: updatedRecommendation
      }
    })
  )

  // 刪除建議
  router.delete(
    '/recommendations/:id',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const recommendationId = parseInt(id!)

      if (isNaN(recommendationId)) {
        throw new ValidationError('Invalid recommendation ID')
      }

      const recommendation = await recommendationRepo.findById(recommendationId)
      if (!recommendation) {
        throw new NotFoundError('Recommendation not found')
      }

      await recommendationRepo.delete(recommendationId)

      return {
        success: true,
        data: { message: 'Recommendation deleted successfully' }
      }
    })
  )

  // 獲取建議統計
  router.get(
    '/recommendations/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await recommendationRepo.getRecommendationStats()

      return {
        success: true,
        data: stats
      }
    })
  )
}
