/**
 * 講師管理路由
 * 處理講師的創建、更新、刪除等操作
 */

import { requireAuth } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { InstructorRepository } from './repositories'
import type { UpdateInstructorRequest } from './types'

// Repository實例
const instructorRepo = new InstructorRepository()

export function setupInstructorManagementRoutes(router: ApiRouter): void {
  // 獲取所有講師
  router.get('/api/v1/instructors', async (req: ApiRequest): Promise<ApiResponse> => {
    const {
      specialization,
      min_rating,
      min_experience,
      search,
      is_active,
      page = '1',
      limit = '12'
    } = req.query as Record<string, string | undefined>

    const pageNum = parseInt(page!)
    const limitNum = parseInt(limit!)

    let instructors
    if (search) {
      instructors = await instructorRepo.search(search as string)
    } else if (specialization) {
      instructors = await instructorRepo.findBySpecialization(specialization as string)
    } else {
      // 默認只返回活躍講師，除非明確指定 is_active=false
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

    // 手動分頁
    const total = instructors.length
    const totalPages = Math.ceil(total / limitNum)
    const offset = (pageNum - 1) * limitNum
    const paginatedInstructors = instructors.slice(offset, offset + limitNum)

    return {
      success: true,
      data: paginatedInstructors,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    }
  })

  // 獲取當前用戶的講師資料 - 必須在 :userId 路由之前
  router.get('/api/v1/instructors/profile', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const userId = req.user!.id

    const instructor = await instructorRepo.findByUserId(userId)

    if (!instructor) {
      throw new NotFoundError('Instructor profile not found')
    }

    // 獲取講師統計
    const stats = await instructorRepo.getStats(userId)

    return {
      success: true,
      data: {
        ...instructor,
        stats
      }
    }
  })

  // 獲取講師詳情 - 使用 user_id
  router.get('/api/v1/instructors/:userId', async (req: ApiRequest): Promise<ApiResponse> => {
    const { userId } = req.params as Record<string, string>
    const instructorUserId = parseInt(userId!)

    if (isNaN(instructorUserId)) {
      throw new ValidationError('Invalid instructor user ID')
    }

    const instructor = await instructorRepo.findByUserId(instructorUserId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    // 獲取講師統計
    const stats = await instructorRepo.getStats(instructorUserId)

    return {
      success: true,
      data: {
        ...instructor,
        stats
      }
    }
  })

  // 創建講師申請 - 重定向到申請流程
  router.post('/api/v1/instructors', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    // 這個端點現在重定向到講師申請流程
    return {
      success: false,
      error: {
        code: 'DEPRECATED_ENDPOINT',
        message: 'Please use /instructor-applications endpoint to apply as instructor'
      }
    }
  })

  // 更新講師信息 - 使用 user_id
  router.put('/api/v1/instructors/:userId', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const { userId } = req.params as Record<string, string>
    const instructorUserId = parseInt(userId!)
    const {
      bio,
      qualifications,
      specialization,
      years_of_experience,
      is_active
    }: UpdateInstructorRequest = req.body as UpdateInstructorRequest

    if (isNaN(instructorUserId)) {
      throw new ValidationError('Invalid instructor user ID')
    }

    const instructor = await instructorRepo.findByUserId(instructorUserId)
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

    // 使用 user_id 來更新
    const applications = await instructorRepo.queryMany(
      'SELECT id FROM instructor_applications WHERE user_id = $1 AND status = $2',
      [instructorUserId, 'approved']
    )

    if (applications.length > 0) {
      const updatedInstructor = await instructorRepo.update(applications[0].id, updateData)
      return {
        success: true,
        data: updatedInstructor
      }
    } else {
      throw new NotFoundError('No approved instructor application found')
    }
  })

  // 停用講師 - 使用 user_id
  router.delete('/api/v1/instructors/:userId', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    const { userId } = req.params as Record<string, string>
    const instructorUserId = parseInt(userId!)

    if (isNaN(instructorUserId)) {
      throw new ValidationError('Invalid instructor user ID')
    }

    const instructor = await instructorRepo.findByUserId(instructorUserId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    // 只有管理員可以停用講師
    if (req.user!.userType !== 'admin') {
      throw new UnauthorizedError('Only admins can deactivate instructors')
    }

    // 停用而不是刪除
    await instructorRepo.executeRaw(
      'UPDATE instructor_applications SET is_active = false, updated_at = NOW() WHERE user_id = $1 AND status = $2',
      [instructorUserId, 'approved']
    )

    return {
      success: true,
      data: { message: 'Instructor deactivated successfully' }
    }
  })

  // 獲取高評分講師
  router.get('/api/v1/instructors/top-rated', async (req: ApiRequest): Promise<ApiResponse> => {
    const { limit } = req.query as Record<string, string | undefined>
    const limitNum = limit ? parseInt(limit!) : 10

    const instructors = await instructorRepo.findTopRated(limitNum)

    return {
      success: true,
      data: instructors
    }
  })

  // 獲取講師統計 - 使用 user_id
  router.get('/api/v1/instructors/:userId/stats', async (req: ApiRequest): Promise<ApiResponse> => {
    const { userId } = req.params as Record<string, string>
    const instructorUserId = parseInt(userId!)

    if (isNaN(instructorUserId)) {
      throw new ValidationError('Invalid instructor user ID')
    }

    const instructor = await instructorRepo.findByUserId(instructorUserId)
    if (!instructor) {
      throw new NotFoundError('Instructor not found')
    }

    const stats = await instructorRepo.getStats(instructorUserId)

    return {
      success: true,
      data: stats
    }
  })

  // 獲取用戶的講師資料
  router.get(
    '/api/v1/users/:userId/instructor',
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
  router.get('/api/v1/instructors/search', async (req: ApiRequest): Promise<ApiResponse> => {
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
