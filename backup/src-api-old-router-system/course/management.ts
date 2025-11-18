/**
 * 課程管理路由
 * 處理課程的創建、更新、刪除等操作
 */

import { validateIntParam } from '../../utils/param-validation'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import { withAuth, withRole } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { CourseRepository } from './repositories'
import type { CreateCourseRequest, UpdateCourseRequest, CourseSearchParams } from './types'

// Repository實例
const courseRepo = new CourseRepository()

export function setupCourseManagementRoutes(router: ApiRouter): void {
  // 獲取所有課程
  router.get('/api/v1/courses', async (req: ApiRequest): Promise<ApiResponse> => {
    const query = req.query as Record<string, string | string[] | undefined>
    const { course_type, search, instructor_id, is_active, min_price, max_price, page, limit } =
      query

    const filters: CourseSearchParams = {}
    if (course_type) filters.course_type = course_type as any
    if (search) filters.search = search as string
    if (instructor_id) filters.instructor_id = parseInt(instructor_id as string)
    if (is_active !== undefined) filters.is_active = is_active === 'true'
    if (min_price) filters.min_price = parseFloat(min_price as string)
    if (max_price) filters.max_price = parseFloat(max_price as string)
    if (page) filters.page = parseInt(page as string)
    if (limit) filters.limit = parseInt(limit as string)

    const result = await courseRepo.findActiveWithFilters(filters)

    return {
      success: true,
      data: result.data,
      meta: result.meta
    }
  })

  // 獲取課程詳情
  router.get('/api/v1/courses/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    const params = req.params as Record<string, string>
    const { id } = params
    const courseId = validateIntParam(id, 'id')

    const course = await courseRepo.findWithInstructor(courseId)
    if (!course) {
      throw new NotFoundError('Course not found')
    }

    return {
      success: true,
      data: course
    }
  })

  // 創建課程
  router.post(
    '/api/v1/courses',
    withRole('instructor', async (req: ApiRequest): Promise<ApiResponse> => {
      const {
        title,
        description,
        courseType,
        price,
        duration,
        maxStudents,
        prerequisites,
        learningObjectives
      }: CreateCourseRequest = req.body as CreateCourseRequest

      if (!title || !description || !courseType) {
        throw new ValidationError('Title, description, and course type are required')
      }

      const courseData = {
        title,
        description,
        course_type: courseType,
        price: price ?? 0,
        duration_hours: duration ?? 0,
        instructor_id: req.user!.id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }

      const course = await courseRepo.create(courseData)

      return {
        success: true,
        data: course
      }
    })
  )

  // 更新課程
  router.put(
    '/api/v1/courses/:id',
    withRole('instructor', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const courseId = validateIntParam(id, 'id')
      const {
        title,
        description,
        courseType,
        price,
        duration,
        maxStudents,
        prerequisites,
        learningObjectives
      }: UpdateCourseRequest = req.body as UpdateCourseRequest

      if (isNaN(courseId)) {
        throw new ValidationError('Invalid course ID')
      }

      const course = await courseRepo.findById(courseId)
      if (!course) {
        throw new NotFoundError('Course not found')
      }

      // 檢查權限
      if (course.instructor_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this course')
      }

      const updateData = {
        title: title || course.title,
        description: description || course.description,
        course_type: courseType || course.course_type,
        price: price !== undefined ? price : course.price,
        duration_hours: duration !== undefined ? duration : course.duration_hours,
        updated_at: new Date()
      }

      const updatedCourse = await courseRepo.update(courseId, updateData)

      return {
        success: true,
        data: updatedCourse
      }
    })
  )

  // 軟刪除課程（設為非活躍）
  router.delete(
    '/api/v1/courses/:id',
    withRole('instructor', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const courseId = validateIntParam(id, 'id')

      const course = await courseRepo.findById(courseId)
      if (!course) {
        throw new NotFoundError('Course not found')
      }

      // 檢查權限
      if (course.instructor_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot delete this course')
      }

      await courseRepo.delete(courseId)

      return {
        success: true,
        data: { message: 'Course deleted successfully' }
      }
    })
  )

  // 切換課程狀態
  router.put(
    '/api/v1/courses/:id/toggle-status',
    withRole('instructor', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const courseId = validateIntParam(id, 'id')

      const course = await courseRepo.findById(courseId)
      if (!course) {
        throw new NotFoundError('Course not found')
      }

      // 檢查權限
      if (course.instructor_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot toggle this course status')
      }

      const updateData = {
        is_active: !course.is_active,
        updated_at: new Date()
      }

      const updatedCourse = await courseRepo.update(courseId, updateData)

      return {
        success: true,
        data: updatedCourse
      }
    })
  )

  // 獲取講師的課程
  router.get(
    '/api/v1/instructors/:instructorId/courses',
    async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { instructorId } = params
      const targetInstructorId = validateIntParam(instructorId, 'instructorId')

      const courses = await courseRepo.findByInstructor(targetInstructorId)

      return {
        success: true,
        data: courses
      }
    }
  )

  // 獲取課程統計
  router.get(
    '/api/v1/courses/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await courseRepo.getCourseStats(req.user!.id)

      return {
        success: true,
        data: stats
      }
    })
  )

  // 獲取熱門課程
  router.get('/api/v1/courses/popular', async (req: ApiRequest): Promise<ApiResponse> => {
    const query = req.query as Record<string, string | string[] | undefined>
    const { limit } = query
    const limitNum = limit ? parseInt(limit as string) : 10

    const courses = await courseRepo.findPopularCourses(limitNum)

    return {
      success: true,
      data: courses
    }
  })
}
