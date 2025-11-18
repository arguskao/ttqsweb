/**
 * 講師發展路由
 * 處理講師發展計劃的創建、更新、管理等操作
 */

import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import { withAuth, withRole } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { InstructorDevelopmentRepository } from './repositories'
import type { CreateDevelopmentRequest, UpdateDevelopmentRequest } from './types'

// Repository實例
const developmentRepo = new InstructorDevelopmentRepository()

export function setupInstructorDevelopmentRoutes(router: ApiRouter): void {
  // 獲取所有發展計劃
  router.get(
    '/developments',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { user_id, development_type, status, date_from, date_to } = query

      let developments
      if (user_id) {
        developments = await developmentRepo.findByUser(parseInt(user_id as string))
      } else if (development_type) {
        developments = await developmentRepo.findByType(development_type as string)
      } else if (status) {
        developments = await developmentRepo.findByStatus(status as string)
      } else if (date_from && date_to) {
        developments = await developmentRepo.findByDateRange(date_from as string, date_to as string)
      } else {
        // 普通用戶只能看到自己的發展計劃
        if (req.user!.userType !== 'admin') {
          developments = await developmentRepo.findByUser(req.user!.id)
        } else {
          developments = await developmentRepo.findAll()
        }
      }

      return {
        success: true,
        data: developments
      }
    })
  )

  // 獲取發展計劃詳情
  router.get(
    '/developments/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const developmentId = parseInt(id!)

      if (isNaN(developmentId)) {
        throw new ValidationError('Invalid development ID')
      }

      const development = await developmentRepo.findById(developmentId)
      if (!development) {
        throw new NotFoundError('Development plan not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && development.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot view this development plan')
      }

      return {
        success: true,
        data: development
      }
    })
  )

  // 創建發展計劃
  router.post(
    '/developments',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const {
        userId,
        developmentType,
        title,
        description,
        objectives,
        startDate,
        endDate,
        resources,
        milestones
      }: CreateDevelopmentRequest = req.body as CreateDevelopmentRequest

      if (!userId || !developmentType || !title || !description) {
        throw new ValidationError('User ID, development type, title, and description are required')
      }

      const developmentData = {
        userId,
        developmentType,
        title,
        description,
        objectives: objectives ?? {},
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        resources: resources ?? {},
        milestones: milestones ?? {},
        status: 'planned' as const,
        cost: null,
        fundingSource: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const development = await developmentRepo.create(developmentData)

      return {
        success: true,
        data: development
      }
    })
  )

  // 更新發展計劃
  router.put(
    '/developments/:id',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const developmentId = parseInt(id!)
      const {
        title,
        description,
        objectives,
        startDate,
        endDate,
        resources,
        milestones,
        status
      }: UpdateDevelopmentRequest = req.body as UpdateDevelopmentRequest

      if (isNaN(developmentId)) {
        throw new ValidationError('Invalid development ID')
      }

      const development = await developmentRepo.findById(developmentId)
      if (!development) {
        throw new NotFoundError('Development plan not found')
      }

      const updateData = {
        title: title || development.title,
        description: description || development.description,
        objectives: objectives || development.objectives,
        startDate: startDate ? new Date(startDate) : development.startDate,
        endDate: endDate ? new Date(endDate) : development.endDate,
        resources: resources || development.resources,
        milestones: milestones || development.milestones,
        status: status || development.status,
        updatedAt: new Date()
      }

      const updatedDevelopment = await developmentRepo.update(developmentId, updateData)

      return {
        success: true,
        data: updatedDevelopment
      }
    })
  )

  // 更新里程碑進度
  router.put(
    '/developments/:id/milestones/:milestoneId',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id, milestoneId } = params
      const developmentId = parseInt(id!)
      const targetMilestoneId = parseInt(milestoneId!)
      const { status, notes } = req.body as { status?: string; notes?: string }

      if (isNaN(developmentId) || isNaN(targetMilestoneId)) {
        throw new ValidationError('Invalid development ID or milestone ID')
      }

      const development = await developmentRepo.findById(developmentId)
      if (!development) {
        throw new NotFoundError('Development plan not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && development.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this development plan')
      }

      // 更新里程碑
      const updatedMilestones = development.milestones.map(milestone => {
        if (milestone.id === targetMilestoneId) {
          return {
            ...milestone,
            status: status || milestone.status,
            notes: notes || milestone.notes,
            updatedAt: new Date()
          }
        }
        return milestone
      })

      const updateData = {
        milestones: updatedMilestones,
        updatedAt: new Date()
      }

      const updatedDevelopment = await developmentRepo.update(developmentId, updateData)

      return {
        success: true,
        data: updatedDevelopment
      }
    })
  )

  // 完成發展計劃
  router.put(
    '/developments/:id/complete',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const developmentId = parseInt(id!)
      const { completionNotes } = req.body as { completionNotes?: string }

      if (isNaN(developmentId)) {
        throw new ValidationError('Invalid development ID')
      }

      const development = await developmentRepo.findById(developmentId)
      if (!development) {
        throw new NotFoundError('Development plan not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && development.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot complete this development plan')
      }

      // 檢查狀態
      if (development.status === 'completed') {
        throw new ValidationError('Development plan is already completed')
      }

      const updateData = {
        status: 'completed' as const,
        completionNotes: completionNotes ?? '',
        completedAt: new Date(),
        updatedAt: new Date()
      }

      const updatedDevelopment = await developmentRepo.update(developmentId, updateData)

      return {
        success: true,
        data: updatedDevelopment
      }
    })
  )

  // 刪除發展計劃
  router.delete(
    '/developments/:id',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const developmentId = parseInt(id!)

      if (isNaN(developmentId)) {
        throw new ValidationError('Invalid development ID')
      }

      const development = await developmentRepo.findById(developmentId)
      if (!development) {
        throw new NotFoundError('Development plan not found')
      }

      await developmentRepo.delete(developmentId)

      return {
        success: true,
        data: { message: 'Development plan deleted successfully' }
      }
    })
  )

  // 獲取發展計劃統計
  router.get(
    '/developments/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await developmentRepo.getDevelopmentStats()

      return {
        success: true,
        data: stats
      }
    })
  )
}
