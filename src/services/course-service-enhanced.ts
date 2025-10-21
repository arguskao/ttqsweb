import {
  container,
  SERVICE_KEYS,
  type ICourseService,
  type IApiService,
  type ICacheService
} from './container'

import type { Course, CourseFilters } from '@/types'

// 課程服務實現
export class CourseService implements ICourseService {
  private readonly apiService: IApiService
  private readonly cacheService: ICacheService

  constructor() {
    // 通過依賴注入獲取服務
    this.apiService = container.resolve<IApiService>(SERVICE_KEYS.API_SERVICE)
    this.cacheService = container.resolve<ICacheService>(SERVICE_KEYS.CACHE_SERVICE)
  }

  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    const cacheKey = `courses_${JSON.stringify(filters || {})}`

    // 嘗試從緩存獲取
    const cached = this.cacheService.get<Course[]>(cacheKey)
    if (cached) {
      console.log('從緩存獲取課程列表')
      return cached
    }

    try {
      // 從 API 獲取數據
      const response = (await this.apiService.get<any>('/courses', {
        params: filters
      })) as any

      if (response?.success && response?.data) {
        const courses: Course[] = response.data.courses || response.data

        // 緩存結果 (10分鐘)
        this.cacheService.set(cacheKey, courses, 600000)

        return courses
      }

      throw new Error(response?.error?.message || '獲取課程列表失敗')
    } catch (error) {
      console.error('獲取課程列表失敗:', error)
      throw error
    }
  }

  async getCourse(id: number): Promise<Course> {
    const cacheKey = `course_${id}`

    // 嘗試從緩存獲取
    const cached = this.cacheService.get<Course>(cacheKey)
    if (cached) {
      console.log(`從緩存獲取課程 ${id}`)
      return cached
    }

    try {
      const response = (await this.apiService.get<any>(`/courses/${id}`)) as any

      if (response?.success && response?.data) {
        const course: Course = response.data.course || response.data

        // 緩存結果 (30分鐘)
        this.cacheService.set(cacheKey, course, 1800000)

        return course
      }

      throw new Error(response?.error?.message || '獲取課程詳情失敗')
    } catch (error) {
      console.error(`獲取課程 ${id} 失敗:`, error)
      throw error
    }
  }

  async enrollCourse(courseId: number): Promise<void> {
    try {
      const response = (await this.apiService.post(`/courses/${courseId}/enroll`)) as any

      if (!response?.success) {
        throw new Error(response?.error?.message || '課程註冊失敗')
      }

      // 清除相關緩存
      this.clearCourseCache(courseId)
    } catch (error) {
      console.error(`註冊課程 ${courseId} 失敗:`, error)
      throw error
    }
  }

  // 清除課程相關緩存
  private clearCourseCache(courseId?: number): void {
    if (courseId) {
      this.cacheService.delete(`course_${courseId}`)
    }

    // 清除課程列表緩存
    const cacheKeys = ['courses_', 'featured_courses_']
    cacheKeys.forEach(prefix => {
      // 簡單的緩存清理策略，實際應用中可能需要更複雜的實現
      try {
        const stats = (this.cacheService as any).getStats?.()
        if (stats?.keys) {
          stats.keys.forEach((key: string) => {
            if (key.startsWith(prefix)) {
              this.cacheService.delete(key)
            }
          })
        }
      } catch {
        // 忽略 getStats 錯誤
      }
    })
  }

  // 獲取課程統計信息
  async getCourseStats(): Promise<{ total: number; enrolled: number; completed: number }> {
    const cacheKey = 'course_stats'

    const cached = this.cacheService.get<any>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = (await this.apiService.get<any>('/courses/stats')) as any

      if (response?.success && response?.data) {
        const stats = response.data.stats || response.data

        // 緩存統計信息 (5分鐘)
        this.cacheService.set(cacheKey, stats, 300000)

        return stats
      }

      throw new Error(response?.error?.message || '獲取課程統計失敗')
    } catch (error) {
      console.error('獲取課程統計失敗:', error)
      throw error
    }
  }
}

// 註冊課程服務
container.registerSingleton(SERVICE_KEYS.COURSE_SERVICE, () => new CourseService())

// 導出課程服務實例獲取函數
export const getCourseService = (): ICourseService => {
  return container.resolve<ICourseService>(SERVICE_KEYS.COURSE_SERVICE)
}
