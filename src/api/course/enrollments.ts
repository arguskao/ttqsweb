/**
 * 課程註冊路由
 * 處理課程註冊、進度更新、完成等操作
 */

import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { CourseEnrollmentRepository, CourseRepository } from './repositories'
import type {
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  EnrollmentSearchParams,
  CourseEnrollment
} from './types'

// Repository實例
const enrollmentRepo = new CourseEnrollmentRepository()
const courseRepo = new CourseRepository()

export function setupCourseEnrollmentRoutes(router: ApiRouter): void {
  // 獲取所有註冊
  router.get(
    '/enrollments',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { user_id, course_id, status, enrollment_date_from, enrollment_date_to, page, limit } =
        query

      const searchParams: EnrollmentSearchParams = {}
      if (user_id) searchParams.user_id = parseInt(user_id as string)
      if (course_id) searchParams.course_id = parseInt(course_id as string)
      if (status) searchParams.status = status as any
      if (enrollment_date_from) searchParams.enrollment_date_from = enrollment_date_from as string
      if (enrollment_date_to) searchParams.enrollment_date_to = enrollment_date_to as string
      if (page) searchParams.page = parseInt(page as string)
      if (limit) searchParams.limit = parseInt(limit as string)

      // 普通用戶只能查看自己的註冊
      if (req.user!.userType !== 'admin' && !searchParams.user_id) {
        searchParams.user_id = req.user!.id
      }

      const result = await enrollmentRepo.searchEnrollments(searchParams)

      return {
        success: true,
        data: result.data,
        meta: result.meta
      }
    })
  )

  // 獲取註冊詳情
  router.get(
    '/enrollments/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Enrollment ID is required')
      }
      const enrollmentId = parseInt(id)

      if (isNaN(enrollmentId)) {
        throw new ValidationError('Invalid enrollment ID')
      }

      const enrollment = await enrollmentRepo.findById(enrollmentId)
      if (!enrollment) {
        throw new NotFoundError('Enrollment not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && enrollment.user_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot view this enrollment')
      }

      return {
        success: true,
        data: enrollment
      }
    })
  )

  // 創建註冊
  router.post(
    '/enrollments',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const { course_id }: CreateEnrollmentRequest = req.body as CreateEnrollmentRequest

      if (!course_id) {
        throw new ValidationError('Course ID is required')
      }

      const targetUserId = req.user!.id

      // 檢查課程是否存在
      const course = await courseRepo.findById(course_id)
      if (!course) {
        throw new NotFoundError('Course not found')
      }

      // 檢查課程是否啟用
      if (!course.is_active) {
        throw new ValidationError('Course is not available for enrollment')
      }

      // 檢查是否已經註冊
      const existingEnrollment = await enrollmentRepo.findByUserAndCourse(targetUserId, course_id)
      if (existingEnrollment) {
        throw new ValidationError('Already enrolled in this course')
      }

      const enrollmentData: Omit<CourseEnrollment, 'id' | 'createdAt' | 'updatedAt'> = {
        course_id,
        user_id: targetUserId,
        status: 'enrolled' as const,
        progress_percentage: 0,
        enrollment_date: new Date(),
        completion_date: null,
        final_score: null
      }

      const enrollment = await enrollmentRepo.create(enrollmentData)

      return {
        success: true,
        data: enrollment
      }
    })
  )

  // 更新註冊進度
  router.put(
    '/enrollments/:id/progress',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Enrollment ID is required')
      }
      const enrollmentId = parseInt(id)
      const { progress_percentage }: UpdateEnrollmentRequest = req.body as UpdateEnrollmentRequest

      if (isNaN(enrollmentId)) {
        throw new ValidationError('Invalid enrollment ID')
      }

      if (
        progress_percentage === undefined ||
        progress_percentage < 0 ||
        progress_percentage > 100
      ) {
        throw new ValidationError('Progress must be between 0 and 100')
      }

      const enrollment = await enrollmentRepo.findById(enrollmentId)
      if (!enrollment) {
        throw new NotFoundError('Enrollment not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && enrollment.user_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this enrollment')
      }

      const updateData = {
        progress_percentage,
        updated_at: new Date()
      }

      const updatedEnrollment = await enrollmentRepo.update(enrollmentId, updateData)

      return {
        success: true,
        data: updatedEnrollment
      }
    })
  )

  // 完成課程
  router.put(
    '/enrollments/:id/complete',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Enrollment ID is required')
      }
      const enrollmentId = parseInt(id)

      if (isNaN(enrollmentId)) {
        throw new ValidationError('Invalid enrollment ID')
      }

      const enrollment = await enrollmentRepo.findById(enrollmentId)
      if (!enrollment) {
        throw new NotFoundError('Enrollment not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && enrollment.user_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot complete this enrollment')
      }

      const updateData: Partial<Omit<CourseEnrollment, 'id' | 'createdAt'>> = {
        status: 'completed' as const,
        progress_percentage: 100,
        completion_date: new Date(),
        updatedAt: new Date()
      }

      const updatedEnrollment = await enrollmentRepo.update(enrollmentId, updateData)

      return {
        success: true,
        data: updatedEnrollment
      }
    })
  )

  // 取消註冊
  router.delete(
    '/enrollments/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Enrollment ID is required')
      }
      const enrollmentId = parseInt(id)

      if (isNaN(enrollmentId)) {
        throw new ValidationError('Invalid enrollment ID')
      }

      const enrollment = await enrollmentRepo.findById(enrollmentId)
      if (!enrollment) {
        throw new NotFoundError('Enrollment not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && enrollment.user_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot cancel this enrollment')
      }

      await enrollmentRepo.delete(enrollmentId)

      return {
        success: true,
        data: { message: 'Enrollment cancelled successfully' }
      }
    })
  )

  // 獲取用戶的課程註冊統計
  router.get(
    '/enrollments/stats/user/:userId',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { userId } = params
      if (!userId) {
        throw new ValidationError('User ID is required')
      }
      const targetUserId = parseInt(userId)

      if (isNaN(targetUserId)) {
        throw new ValidationError('Invalid user ID')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && req.user!.id !== targetUserId) {
        throw new UnauthorizedError("Cannot view this user's enrollment stats")
      }

      const stats = await enrollmentRepo.getUserEnrollmentStats(targetUserId)

      return {
        success: true,
        data: stats
      }
    })
  )

  // 獲取課程的註冊統計
  router.get(
    '/enrollments/stats/course/:courseId',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { courseId } = params
      if (!courseId) {
        throw new ValidationError('Course ID is required')
      }
      const targetCourseId = parseInt(courseId)

      if (isNaN(targetCourseId)) {
        throw new ValidationError('Invalid course ID')
      }

      const stats = await enrollmentRepo.getCourseEnrollmentStats(targetCourseId)

      return {
        success: true,
        data: stats
      }
    })
  )
}
