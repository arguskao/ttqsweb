/**
 * 講師管理路由
 * 處理講師的創建、更新、刪除等操作
 */

import { requireAuth } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { InstructorRepository } from './repositories'
import type { CreateInstructorRequest, UpdateInstructorRequest } from './types'

// Repository實例
const instructorRepo = new InstructorRepository()

export function setupInstructorManagementRoutes(router: ApiRouter): void {
  // 獲取所有講師
  router.get('/instructors', async (req: ApiRequest): Promise<ApiResponse> => {
    const { specialization, min_rating, min_experience, search } = req.query as Record<
      string,
      string | undefined
    >

    let instructors
    if (search) {
      instructors = await instructorRepo.search(search as string)
    } else if (specialization) {
      instructors = await instructorRepo.findBySpecialization(specialization as string)
    } else {
      instructors = await instructorRepo.findActive()
    }

    // 應用額外篩選
    if (min_rating) {
      instructors = instructors.filter(i => i.average_rating >= parseFloat(min_rating as string))
    }
    if (min_experience) {
      instructors = instructors.filter(
        i => (i.years_of_experience ?? 0) >= parseInt(min_experience as string)
      )
    }

    return {
      success: true,
      data: instructors
    }
  })

  // 獲取講師詳情
  router.get('/instructors/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const instructorId = parseInt(id!)

    if (isNaN(instructorId)) {
      throw new ValidationError('Invalid instructor ID')
    }

    const instructor = await instructorRepo.findById(instructorId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    // 獲取講師統計
    const stats = await instructorRepo.getStats(instructorId)

    return {
      success: true,
      data: {
        ...instructor,
        stats
      }
    }
  })

  // 創建講師
  router.post('/instructors', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const { bio, qualifications, specialization, years_of_experience }: CreateInstructorRequest =
      req.body as CreateInstructorRequest

    if (!bio || !qualifications || !specialization || years_of_experience === undefined) {
      throw new ValidationError('All fields are required')
    }

    // 檢查是否已經是講師
    const existingInstructor = await instructorRepo.findByUserId(req.user!.id)
    if (existingInstructor) {
      throw new ValidationError('User is already an instructor')
    }

    const instructorData = {
      user_id: req.user!.id,
      bio,
      qualifications,
      specialization,
      years_of_experience,
      application_status: 'pending' as const,
      approval_date: null,
      approved_by: null,
      average_rating: 0,
      total_ratings: 0,
      is_active: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const instructor = await instructorRepo.create(instructorData)

    return {
      success: true,
      data: instructor
    }
  })

  // 更新講師信息
  router.put('/instructors/:id', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const instructorId = parseInt(id!)
    const {
      bio,
      qualifications,
      specialization,
      years_of_experience,
      is_active
    }: UpdateInstructorRequest = req.body as UpdateInstructorRequest

    if (isNaN(instructorId)) {
      throw new ValidationError('Invalid instructor ID')
    }

    const instructor = await instructorRepo.findById(instructorId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    // 檢查權限
    if (instructor.user_id !== req.user!.id && req.user!.userType !== 'admin') {
      throw new UnauthorizedError('Insufficient permissions')
    }

    const updateData: any = { updated_at: new Date() }
    if (bio !== undefined) updateData.bio = bio
    if (qualifications !== undefined) updateData.qualifications = qualifications
    if (specialization !== undefined) updateData.specialization = specialization
    if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience
    if (is_active !== undefined && req.user!.userType === 'admin') updateData.is_active = is_active

    const updatedInstructor = await instructorRepo.update(instructorId, updateData)

    return {
      success: true,
      data: updatedInstructor
    }
  })

  // 刪除講師
  router.delete('/instructors/:id', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const instructorId = parseInt(id!)

    if (isNaN(instructorId)) {
      throw new ValidationError('Invalid instructor ID')
    }

    const instructor = await instructorRepo.findById(instructorId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    // 只有管理員可以刪除講師
    if (req.user!.userType !== 'admin') {
      throw new UnauthorizedError('Only admins can delete instructors')
    }

    await instructorRepo.delete(instructorId)

    return {
      success: true,
      data: { message: 'Instructor deleted successfully' }
    }
  })

  // 獲取高評分講師
  router.get('/instructors/top-rated', async (req: ApiRequest): Promise<ApiResponse> => {
    const { limit } = req.query as Record<string, string | undefined>
    const limitNum = limit ? parseInt(limit!) : 10

    const instructors = await instructorRepo.findTopRated(limitNum)

    return {
      success: true,
      data: instructors
    }
  })

  // 獲取講師統計
  router.get('/instructors/:id/stats', async (req: ApiRequest): Promise<ApiResponse> => {
    const { id } = req.params as Record<string, string>
    const instructorId = parseInt(id!)

    if (isNaN(instructorId)) {
      throw new ValidationError('Invalid instructor ID')
    }

    const instructor = await instructorRepo.findById(instructorId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    const stats = await instructorRepo.getStats(instructorId)

    return {
      success: true,
      data: stats
    }
  })

  // 獲取用戶的講師資料
  router.get(
    '/users/:userId/instructor',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      const { userId } = req.params as Record<string, string>
      const targetUserId = parseInt(userId!)

      if (isNaN(targetUserId)) {
        throw new ValidationError('Invalid user ID')
      }

      // 只能查看自己的講師資料，除非是管理員
      if (req.user!.id !== targetUserId && req.user!.userType !== 'admin') {
        throw new UnauthorizedError("Cannot view other users' instructor profile")
      }

      const instructor = await instructorRepo.findByUserId(targetUserId)

      return {
        success: true,
        data: instructor
      }
    }
  )

  // 搜索講師
  router.get('/instructors/search', async (req: ApiRequest): Promise<ApiResponse> => {
    const { q } = req.query as Record<string, string | undefined>

    if (!q) {
      throw new ValidationError('Search query is required')
    }

    const instructors = await instructorRepo.search(q as string)

    return {
      success: true,
      data: instructors
    }
  })
}
