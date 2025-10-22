import { apiService } from './api'

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
    // 模擬數據 - 用於測試篩選功能
    const mockCourses: Course[] = [
      {
        id: 1,
        title: '藥局助理基礎課程',
        description: '學習藥局基本作業流程、藥品管理等基礎知識',
        course_type: 'basic',
        duration_hours: 40,
        price: 5000,
        instructor_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        title: '進階藥學知識',
        description: '深入學習藥理學、藥物交互作用等進階知識',
        course_type: 'advanced',
        duration_hours: 60,
        price: 8000,
        instructor_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        title: '實習實作課程',
        description: '實際藥局工作環境體驗與實務操作',
        course_type: 'internship',
        duration_hours: 80,
        price: 12000,
        instructor_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // 應用篩選
    let filteredCourses = mockCourses

    if (filters?.courseType) {
      filteredCourses = filteredCourses.filter(course => course.courseType === filters.courseType)
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredCourses = filteredCourses.filter(
        course =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.description?.toLowerCase().includes(searchTerm)
      )
    }

    // 分頁
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const offset = (page - 1) * limit
    const paginatedCourses = filteredCourses.slice(offset, offset + limit)

    return {
      data: paginatedCourses,
      meta: {
        page,
        limit,
        total: filteredCourses.length,
        totalPages: Math.ceil(filteredCourses.length / limit)
      }
    }
  }

  // Get featured courses (fallback: take first N from list)
  async getFeaturedCourses(limit = 3): Promise<Course[]> {
    try {
      const res = await this.getCourses({ page: 1, limit: limit })
      return res.data.slice(0, limit)
    } catch (_e) {
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
