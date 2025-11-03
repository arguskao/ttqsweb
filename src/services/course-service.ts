import { apiService } from './api-enhanced'

import type { Course, CourseEnrollment, CourseFilters } from '@/types'

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class CourseService {
  // Get all courses with filters
  async getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    try {
      console.log('CourseService: 開始獲取課程列表', filters)
      
      // 從 API 獲取真實的課程數據
      const params: Record<string, string> = {}

      // 轉換篩選參數
      if (filters?.courseType) {
        params.course_type = filters.courseType
      }
      if (filters?.search) {
        params.search = filters.search
      }
      if (filters?.page) {
        params.page = filters.page.toString()
      }
      if (filters?.limit) {
        params.limit = filters.limit.toString()
      }

      console.log('CourseService: API 請求參數', params)

      const response = await apiService.get<any>('/courses', { params })
      console.log('CourseService: API 響應', response)

      if (response && response.success && response.data) {
        // API 響應中的 meta 直接包含分頁信息，不是嵌套的
        const meta = response.meta as any
        return {
          data: response.data,
          meta: {
            page: meta?.page ?? filters?.page ?? 1,
            limit: meta?.limit ?? filters?.limit ?? 10,
            total: meta?.total ?? response.data.length,
            totalPages: meta?.totalPages ?? Math.ceil(response.data.length / (filters?.limit ?? 10))
          }
        }
      }

      console.warn('CourseService: API 響應格式不正確', response)
      throw new Error('獲取課程列表失敗')
    } catch (err: any) {
      console.error('CourseService: 獲取課程列表失敗', err)

      // 如果 API 調用失敗，返回空列表而不是硬編碼的數據
      return {
        data: [],
        meta: {
          page: filters?.page ?? 1,
          limit: filters?.limit ?? 10,
          total: 0,
          totalPages: 0
        }
      }
    }
  }

  // Get featured courses (fallback: take first N from list)
  async getFeaturedCourses(limit = 3): Promise<Course[]> {
    try {
      const res = await this.getCourses({ page: 1, limit })
      return res.data.slice(0, limit)
    } catch {
      return []
    }
  }

  // Get course by ID
  async getCourseById(id: number): Promise<Course> {
    const response = await apiService.get<Course>(`/courses/${id}`)

    if (!response.data) {
      throw new Error('課程不存在')
    }

    return response.data
  }

  // Enroll in a course
  async enrollCourse(courseId: number): Promise<{ message: string; enrollment: CourseEnrollment }> {
    const response = await apiService.post<{ message: string; enrollment: CourseEnrollment }>(
      `/courses/${courseId}/enroll`
    )

    if (!response.data) {
      throw new Error('課程註冊失敗')
    }

    return response.data
  }

  // Get course progress
  async getCourseProgress(courseId: number): Promise<CourseEnrollment> {
    const response = await apiService.get<CourseEnrollment>(`/courses/${courseId}/progress`)

    if (!response.data) {
      throw new Error('無法獲取學習進度')
    }

    return response.data
  }

  // Update course progress
  async updateCourseProgress(
    courseId: number,
    progressPercentage: number,
    status?: string
  ): Promise<{ message: string; enrollment: CourseEnrollment }> {
    const response = await apiService.post<{ message: string; enrollment: CourseEnrollment }>(
      `/courses/${courseId}/progress`,
      { progress_percentage: progressPercentage, status }
    )

    if (!response.data) {
      throw new Error('更新學習進度失敗')
    }

    return response.data
  }

  // Get user's enrollments
  async getUserEnrollments(): Promise<CourseEnrollment[]> {
    const response = await apiService.get<CourseEnrollment[]>('/users/enrollments')

    return response.data ?? []
  }
}

const courseService = new CourseService()
export { courseService }
export default courseService
