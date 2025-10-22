/**
 * 講師申請管理路由
 * 處理講師申請的提交、審核等操作
 */

import { requireAuth, requireRole } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { InstructorApplicationRepository, InstructorRepository } from './repositories'
import type { CreateApplicationRequest, ReviewApplicationRequest } from './types'

// Repository實例
const applicationRepo = new InstructorApplicationRepository()
const instructorRepo = new InstructorRepository()

export function setupInstructorApplicationRoutes(router: ApiRouter): void {
  // 提交講師申請
  router.post(
    '/instructor-applications',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { bio, qualifications, specialization, years_of_experience }: CreateApplicationRequest =
        req.body as CreateApplicationRequest

      if (!bio || !qualifications || !specialization || years_of_experience === undefined) {
        throw new ValidationError('All fields are required')
      }

      // 檢查是否已經是講師
      const existingInstructor = await instructorRepo.findByUserId(req.user!.id)
      if (existingInstructor) {
        throw new ValidationError('User is already an instructor')
      }

      // 檢查是否有待審核的申請
      const existingApplication = await applicationRepo.findByUserId(req.user!.id)
      if (existingApplication?.status === 'pending') {
        throw new ValidationError('You already have a pending application')
      }

      const applicationData = {
        user_id: req.user!.id,
        bio,
        qualifications,
        specialization,
        years_of_experience,
        status: 'pending' as const,
        submitted_at: new Date(),
        reviewed_at: null,
        reviewed_by: null,
        review_notes: null
      }

      const application = await applicationRepo.create(applicationData)

      return {
        success: true,
        data: application
      }
    }
  )

  // 獲取用戶的申請
  router.get(
    '/users/:userId/instructor-application',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { userId } = req.params as Record<string, string>
      const targetUserId = parseInt(userId!)

      if (isNaN(targetUserId)) {
        throw new ValidationError('Invalid user ID')
      }

      // 只能查看自己的申請，除非是管理員
      if (req.user!.id !== targetUserId && req.user!.userType !== 'admin') {
        throw new UnauthorizedError("Cannot view other users' applications")
      }

      const application = await applicationRepo.findByUserId(targetUserId)

      return {
        success: true,
        data: application
      }
    }
  )

  // 獲取所有待審核的申請（管理員）
  router.get(
    '/instructor-applications/pending',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      const applications = await applicationRepo.findPending()

      return {
        success: true,
        data: applications
      }
    }
  )

  // 獲取所有已審核的申請（管理員）
  router.get(
    '/instructor-applications/reviewed',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      const applications = await applicationRepo.findReviewed()

      return {
        success: true,
        data: applications
      }
    }
  )

  // 審核講師申請（管理員）
  router.put(
    '/instructor-applications/:id/review',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { id } = req.params as Record<string, string>
      const applicationId = parseInt(id!)
      const { status, review_notes }: ReviewApplicationRequest =
        req.body as ReviewApplicationRequest

      if (isNaN(applicationId)) {
        throw new ValidationError('Invalid application ID')
      }

      if (!status || !['approved', 'rejected'].includes(status)) {
        throw new ValidationError('Status must be approved or rejected')
      }

      const application = await applicationRepo.findById(applicationId)
      if (!application) {
        throw new NotFoundError('Application not found')
      }

      if (application.status !== 'pending') {
        throw new ValidationError('Application has already been reviewed')
      }

      // 更新申請狀態
      await applicationRepo.updateStatus(applicationId, status, req.user!.id, review_notes)

      // 如果批准，創建講師記錄
      if (status === 'approved') {
        const instructorData = {
          user_id: application.user_id,
          bio: application.bio,
          qualifications: application.qualifications,
          specialization: application.specialization,
          years_of_experience: application.years_of_experience,
          application_status: 'approved' as const,
          approval_date: new Date(),
          approved_by: req.user!.id,
          average_rating: 0,
          total_ratings: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }

        await instructorRepo.create(instructorData)
      }

      return {
        success: true,
        data: { message: `Application ${status} successfully` }
      }
    }
  )

  // 獲取申請詳情（管理員）
  router.get(
    '/instructor-applications/:id',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { id } = req.params as Record<string, string>
      const applicationId = parseInt(id!)

      if (isNaN(applicationId)) {
        throw new ValidationError('Invalid application ID')
      }

      const application = await applicationRepo.findById(applicationId)
      if (!application) {
        throw new NotFoundError('Application not found')
      }

      return {
        success: true,
        data: application
      }
    }
  )

  // 取消申請
  router.delete(
    '/instructor-applications/:id',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { id } = req.params as Record<string, string>
      const applicationId = parseInt(id!)

      if (isNaN(applicationId)) {
        throw new ValidationError('Invalid application ID')
      }

      const application = await applicationRepo.findById(applicationId)
      if (!application) {
        throw new NotFoundError('Application not found')
      }

      // 只有申請者可以取消申請
      if (application.user_id !== req.user!.id) {
        throw new UnauthorizedError('Only the applicant can cancel the application')
      }

      if (application.status !== 'pending') {
        throw new ValidationError('Cannot cancel a reviewed application')
      }

      await applicationRepo.delete(applicationId)

      return {
        success: true,
        data: { message: 'Application cancelled successfully' }
      }
    }
  )

  // 獲取申請統計（管理員）
  router.get(
    '/instructor-applications/stats',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      const pending = await applicationRepo.findPending()
      const reviewed = await applicationRepo.findReviewed()

      const stats = {
        total: pending.length + reviewed.length,
        pending: pending.length,
        approved: reviewed.filter(app => app.status === 'approved').length,
        rejected: reviewed.filter(app => app.status === 'rejected').length
      }

      return {
        success: true,
        data: stats
      }
    }
  )

  // 重新提交申請
  router.post(
    '/instructor-applications/:id/resubmit',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { id } = req.params as Record<string, string>
      const applicationId = parseInt(id!)
      const { bio, qualifications, specialization, years_of_experience }: CreateApplicationRequest =
        req.body as CreateApplicationRequest

      if (isNaN(applicationId)) {
        throw new ValidationError('Invalid application ID')
      }

      if (!bio || !qualifications || !specialization || years_of_experience === undefined) {
        throw new ValidationError('All fields are required')
      }

      const application = await applicationRepo.findById(applicationId)
      if (!application) {
        throw new NotFoundError('Application not found')
      }

      // 只有申請者可以重新提交
      if (application.user_id !== req.user!.id) {
        throw new UnauthorizedError('Only the applicant can resubmit the application')
      }

      if (application.status !== 'rejected') {
        throw new ValidationError('Can only resubmit rejected applications')
      }

      // 更新申請
      const updateData = {
        bio,
        qualifications,
        specialization,
        years_of_experience,
        status: 'pending' as const,
        submitted_at: new Date(),
        reviewed_at: null,
        reviewed_by: null,
        review_notes: null
      }

      const updatedApplication = await applicationRepo.update(applicationId, updateData)

      return {
        success: true,
        data: updatedApplication
      }
    }
  )
}
