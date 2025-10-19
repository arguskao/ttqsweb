import api from './api'
import type { Course, CourseEnrollment, CourseFilters, ApiResponse } from '@/types'

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
        const params = new URLSearchParams()

        if (filters?.courseType) {
            params.append('course_type', filters.courseType)
        }
        if (filters?.search) {
            params.append('search', filters.search)
        }
        if (filters?.page) {
            params.append('page', filters.page.toString())
        }
        if (filters?.limit) {
            params.append('limit', filters.limit.toString())
        }

        const queryString = params.toString()
        const url = `/api/v1/courses${queryString ? `?${queryString}` : ''}`

        const response = await api.get<ApiResponse<Course[]>>(url)

        return {
            data: response.data.data || [],
            meta: response.data.meta || { page: 1, limit: 10, total: 0, totalPages: 0 }
        }
    }

    // Get course by ID
    async getCourseById(id: number): Promise<Course> {
        const response = await api.get<ApiResponse<Course>>(`/api/v1/courses/${id}`)

        if (!response.data.data) {
            throw new Error('課程不存在')
        }

        return response.data.data
    }

    // Enroll in a course
    async enrollCourse(courseId: number): Promise<{ message: string; enrollment: CourseEnrollment }> {
        const response = await api.post<ApiResponse<{ message: string; enrollment: CourseEnrollment }>>(
            `/api/v1/courses/${courseId}/enroll`
        )

        if (!response.data.data) {
            throw new Error('課程註冊失敗')
        }

        return response.data.data
    }

    // Get course progress
    async getCourseProgress(courseId: number): Promise<CourseEnrollment> {
        const response = await api.get<ApiResponse<CourseEnrollment>>(
            `/api/v1/courses/${courseId}/progress`
        )

        if (!response.data.data) {
            throw new Error('無法獲取學習進度')
        }

        return response.data.data
    }

    // Update course progress
    async updateCourseProgress(
        courseId: number,
        progressPercentage: number,
        status?: string
    ): Promise<{ message: string; enrollment: CourseEnrollment }> {
        const response = await api.post<ApiResponse<{ message: string; enrollment: CourseEnrollment }>>(
            `/api/v1/courses/${courseId}/progress`,
            { progress_percentage: progressPercentage, status }
        )

        if (!response.data.data) {
            throw new Error('更新學習進度失敗')
        }

        return response.data.data
    }

    // Get user's enrollments
    async getUserEnrollments(): Promise<CourseEnrollment[]> {
        const response = await api.get<ApiResponse<CourseEnrollment[]>>('/api/v1/users/enrollments')

        return response.data.data || []
    }
}

export default new CourseService()
