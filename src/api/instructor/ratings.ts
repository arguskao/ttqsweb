/**
 * 講師評分路由
 * 處理講師評分的創建、更新、刪除等操作
 */

import { requireAuth } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { InstructorRatingRepository, InstructorRepository } from './repositories'
import type { CreateRatingRequest } from './types'

// Repository實例
const ratingRepo = new InstructorRatingRepository()
const instructorRepo = new InstructorRepository()

export function setupInstructorRatingRoutes(router: ApiRouter): void {
  // 獲取講師的評分
  router.get('/instructors/:id/ratings', async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const instructorId = parseInt(id!)

    if (isNaN(instructorId)) {
      throw new ValidationError('Invalid instructor ID')
    }

    const instructor = await instructorRepo.findById(instructorId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    const ratings = await ratingRepo.findByInstructor(instructorId)

    return {
      success: true,
      data: ratings
    }
  })

  // 創建講師評分
  router.post(
    '/instructors/:id/ratings',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { id } = req.params as Record<string, string>
      const instructorId = parseInt(id!)
      const { course_id, rating, comment }: CreateRatingRequest = req.body as CreateRatingRequest

      if (isNaN(instructorId)) {
        throw new ValidationError('Invalid instructor ID')
      }

      if (!course_id || !rating || rating < 1 || rating > 5) {
        throw new ValidationError('Course ID and rating (1-5) are required')
      }

      const instructor = await instructorRepo.findById(instructorId)
      if (!instructor) {
        throw new NotFoundError('Instructor not found')
      }

      // 檢查是否已經評分過
      const existingRating = await ratingRepo.hasStudentRated(req.user!.id, instructorId)
      if (existingRating) {
        throw new ValidationError('You have already rated this instructor')
      }

      const ratingData = {
        instructor_id: instructorId,
        student_id: req.user!.id,
        course_id,
        rating,
        comment: comment || null,
        created_at: new Date()
      }

      const newRating = await ratingRepo.create(ratingData)

      // 更新講師評分
      await instructorRepo.updateRating(instructorId)

      return {
        success: true,
        data: newRating
      }
    }
  )

  // 更新講師評分
  router.put('/ratings/:id', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const ratingId = parseInt(id!)
    const { rating, comment } = req.body as { rating: number; comment?: string }

    if (isNaN(ratingId)) {
      throw new ValidationError('Invalid rating ID')
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5')
    }

    const existingRating = await ratingRepo.findById(ratingId)
    if (!existingRating) {
      throw new NotFoundError('Rating not found')
    }

    // 只有評分者可以更新
    if (existingRating.student_id !== req.user!.id) {
      throw new UnauthorizedError('Only the rater can update the rating')
    }

    const updateData = {
      rating,
      comment: comment || null,
      created_at: new Date()
    }

    const updatedRating = await ratingRepo.update(ratingId, updateData)

    // 更新講師評分
    await instructorRepo.updateRating(existingRating.instructor_id)

    return {
      success: true,
      data: updatedRating
    }
  })

  // 刪除講師評分
  router.delete('/ratings/:id', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const ratingId = parseInt(id!)

    if (isNaN(ratingId)) {
      throw new ValidationError('Invalid rating ID')
    }

    const rating = await ratingRepo.findById(ratingId)
    if (!rating) {
      throw new NotFoundError('Rating not found')
    }

    // 只有評分者可以刪除
    if (rating.student_id !== req.user!.id) {
      throw new UnauthorizedError('Only the rater can delete the rating')
    }

    await ratingRepo.delete(ratingId)

    // 更新講師評分
    await instructorRepo.updateRating(rating.instructor_id)

    return {
      success: true,
      data: { message: 'Rating deleted successfully' }
    }
  })

  // 獲取講師評分統計
  router.get('/instructors/:id/rating-stats', async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const instructorId = parseInt(id!)

    if (isNaN(instructorId)) {
      throw new ValidationError('Invalid instructor ID')
    }

    const instructor = await instructorRepo.findById(instructorId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    const stats = await ratingRepo.getRatingStats(instructorId)

    return {
      success: true,
      data: stats
    }
  })

  // 獲取學生的評分
  router.get(
    '/users/:userId/ratings',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { userId } = req.params as Record<string, string>
      const targetUserId = parseInt(userId!)

      if (isNaN(targetUserId)) {
        throw new ValidationError('Invalid user ID')
      }

      // 只能查看自己的評分，除非是管理員
      if (req.user!.id !== targetUserId && req.user!.userType !== 'admin') {
        throw new UnauthorizedError("Cannot view other users' ratings")
      }

      const ratings = await ratingRepo.findByStudent(targetUserId)

      return {
        success: true,
        data: ratings
      }
    }
  )

  // 獲取課程的講師評分
  router.get('/courses/:id/instructor-ratings', async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const courseId = parseInt(id!)

    if (isNaN(courseId)) {
      throw new ValidationError('Invalid course ID')
    }

    const ratings = await ratingRepo.findByCourse(courseId)

    return {
      success: true,
      data: ratings
    }
  })

  // 檢查學生是否已評分
  router.get(
    '/instructors/:id/rating-check',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { id } = req.params as Record<string, string>
      const instructorId = parseInt(id!)

      if (isNaN(instructorId)) {
        throw new ValidationError('Invalid instructor ID')
      }

      const hasRated = await ratingRepo.hasStudentRated(req.user!.id, instructorId)

      return {
        success: true,
        data: { hasRated }
      }
    }
  )

  // 獲取講師平均評分
  router.get('/instructors/:id/average-rating', async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const instructorId = parseInt(id!)

    if (isNaN(instructorId)) {
      throw new ValidationError('Invalid instructor ID')
    }

    const instructor = await instructorRepo.findById(instructorId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    const averageRating = await ratingRepo.getAverageRating(instructorId)

    return {
      success: true,
      data: { averageRating }
    }
  })
}
