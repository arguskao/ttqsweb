/**
 * 課程申請 API 路由
 * 處理講師申請開課的相關功能
 */

import type { ApiRouter } from '../router'
import { withAuth } from '../middleware-helpers'
import { requireRole } from '../auth-middleware'
import type { ApiRequest, ApiResponse } from '../types'
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors'
import { CourseApplicationRepository } from './repositories'
import { InstructorApplicationRepository } from '../instructor/repositories'
import type { CreateCourseApplicationRequest, ReviewCourseApplicationRequest } from './types'

const applicationRepo = new CourseApplicationRepository()
const instructorRepo = new InstructorApplicationRepository()

export function setupCourseApplicationRoutes(router: ApiRouter): void {
  // 創建課程申請
  router.post(
    '/api/v1/course-applications',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const data = req.body as CreateCourseApplicationRequest

      // 驗證必填欄位
      if (
        !data.course_name ||
        !data.description ||
        !data.category ||
        !data.target_audience ||
        !data.duration ||
        data.price === undefined ||
        !data.syllabus ||
        !data.teaching_experience
      ) {
        throw new ValidationError('請填寫所有必填欄位')
      }

      // 驗證數值
      if (data.duration <= 0 || data.price < 0) {
        throw new ValidationError('課程時數和費用必須為正數')
      }

      // 檢查用戶是否為已批准的講師
      const instructorApplication = await instructorRepo.findByUserId(req.user!.id)
      if (!instructorApplication) {
        throw new UnauthorizedError('您還不是講師，請先申請成為講師')
      }

      if (instructorApplication.status !== 'approved') {
        throw new UnauthorizedError('只有已通過審核的講師才能申請開課')
      }

      // 檢查是否有待審核的申請
      const hasPending = await applicationRepo.hasPendingApplication(instructorApplication.id)
      if (hasPending) {
        throw new ValidationError('您已有待審核的課程申請，請等待審核完成後再提交新申請')
      }

      // 創建課程申請
      const application = await applicationRepo.createApplication(instructorApplication.id, data)

      return {
        success: true,
        data: {
          applicationId: application.id,
          message: '課程申請已提交，我們將在 3-5 個工作天內審核您的申請'
        }
      }
    })
  )

  // 獲取講師的課程申請列表
  router.get(
    '/api/v1/instructors/:id/course-applications',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const instructorApplicationId = parseInt(req.params?.id || '0')

      if (isNaN(instructorApplicationId)) {
        throw new ValidationError('無效的講師ID')
      }

      // 檢查講師申請是否存在
      const instructorApplication = await instructorRepo.findById(instructorApplicationId)
      if (!instructorApplication) {
        throw new NotFoundError('講師不存在')
      }

      // 檢查權限：只有講師本人或管理員可以查看
      if (req.user!.userType !== 'admin' && instructorApplication.user_id !== req.user!.id) {
        throw new UnauthorizedError('無權限查看此講師的課程申請')
      }

      // 獲取查詢參數
      const query = req.query as Record<string, string | undefined>
      const { status, category, page, limit } = query

      const filters = {
        status: status as any,
        category,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      }

      // 查詢課程申請
      const result = await applicationRepo.findByInstructor(instructorApplicationId, filters)

      return {
        success: true,
        data: result.data,
        meta: result.meta
      }
    })
  )

  // 獲取單個課程申請詳情
  router.get(
    '/api/v1/course-applications/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const applicationId = parseInt(req.params?.id || '0')

      if (isNaN(applicationId)) {
        throw new ValidationError('無效的申請ID')
      }

      // 查詢課程申請
      const application = await applicationRepo.findByIdWithInstructor(applicationId)
      if (!application) {
        throw new NotFoundError('課程申請不存在')
      }

      // 檢查權限：只有講師本人或管理員可以查看
      if (req.user!.userType !== 'admin' && application.user_id !== req.user!.id) {
        throw new UnauthorizedError('無權限查看此課程申請')
      }

      return {
        success: true,
        data: application
      }
    })
  )

  // 獲取所有課程申請（管理員用）
  router.get(
    '/api/v1/course-applications',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      // 獲取查詢參數
      const query = req.query as Record<string, string | undefined>
      const { instructor_id, status, category, page, limit } = query

      const filters = {
        instructor_id: instructor_id ? parseInt(instructor_id) : undefined,
        status: status as any,
        category,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      }

      // 查詢所有課程申請
      const result = await applicationRepo.findAllWithFilters(filters)

      return {
        success: true,
        data: result.data,
        meta: result.meta
      }
    }
  )

  // 審核課程申請（管理員用）
  router.put(
    '/api/v1/course-applications/:id/review',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      const applicationId = parseInt(req.params?.id || '0')
      if (isNaN(applicationId)) {
        throw new ValidationError('無效的申請ID')
      }

      const data = req.body as ReviewCourseApplicationRequest

      // 驗證狀態
      if (!data.status || !['approved', 'rejected'].includes(data.status)) {
        throw new ValidationError('審核狀態必須是 approved 或 rejected')
      }

      // 檢查申請是否存在
      const application = await applicationRepo.findById(applicationId)
      if (!application) {
        throw new NotFoundError('課程申請不存在')
      }

      // 檢查申請狀態
      if (application.status !== 'pending') {
        throw new ValidationError('只能審核待審核的申請')
      }

      // 審核申請
      const updatedApplication = await applicationRepo.reviewApplication(
        applicationId,
        data.status,
        data.review_notes
      )

      return {
        success: true,
        data: {
          application: updatedApplication,
          message: `課程申請已${data.status === 'approved' ? '批准' : '拒絕'}`
        }
      }
    }
  )

  // 獲取課程申請統計（管理員用）
  router.get(
    '/api/v1/course-applications/stats',
    requireRole(['admin']),
    async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await applicationRepo.getApplicationStats()

      return {
        success: true,
        data: stats
      }
    }
  )

  // 獲取講師的課程申請統計
  router.get(
    '/api/v1/instructors/:id/course-applications/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const instructorApplicationId = parseInt(req.params?.id || '0')

      if (isNaN(instructorApplicationId)) {
        throw new ValidationError('無效的講師ID')
      }

      // 檢查講師申請是否存在
      const instructorApplication = await instructorRepo.findById(instructorApplicationId)
      if (!instructorApplication) {
        throw new NotFoundError('講師不存在')
      }

      // 檢查權限：只有講師本人或管理員可以查看
      if (req.user!.userType !== 'admin' && instructorApplication.user_id !== req.user!.id) {
        throw new UnauthorizedError('無權限查看此講師的統計數據')
      }

      const stats = await applicationRepo.getApplicationStats(instructorApplicationId)

      return {
        success: true,
        data: stats
      }
    })
  )
}
