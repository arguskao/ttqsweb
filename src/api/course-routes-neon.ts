// 重構的課程路由 - 使用 Neon 數據庫
import { courseServiceNeon } from './course-service-neon'
import { ValidationError, NotFoundError, UnauthorizedError } from './errors'
import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'

// 設置課程路由
export function setupCourseRoutesNeon(router: ApiRouter): void {
  // 獲取所有課程（帶篩選和分頁）
  router.get('/api/v1/courses', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const { course_type, search, page, limit } = req.query || {}

      const options = {
        courseType: course_type as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10
      }

      const result = await courseServiceNeon.getCourses(options)

      return {
        success: true,
        data: {
          courses: result.data
        },
        meta: result.meta
      }
    } catch (error) {
      console.error('Get courses error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '載入課程失敗',
          statusCode: 500
        }
      }
    }
  })

  // 根據 ID 獲取課程
  router.get('/api/v1/courses/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const courseId = parseInt(req.params?.id || '0', 10)

      if (!courseId) {
        throw new ValidationError('無效的課程 ID')
      }

      const course = await courseServiceNeon.getCourseById(courseId)

      if (!course) {
        throw new NotFoundError('課程不存在')
      }

      return {
        success: true,
        data: course
      }
    } catch (error) {
      console.error('Get course by ID error:', error)
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: error.constructor.name.replace('Error', '').toUpperCase(),
            message: error.message,
            statusCode: error instanceof NotFoundError ? 404 : 400
          }
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '載入課程失敗',
          statusCode: 500
        }
      }
    }
  })

  // 註冊課程（需要認證）
  router.post('/api/v1/courses/:id/enroll', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const courseId = parseInt(req.params?.id || '0', 10)
      const userId = req.user?.id

      if (!userId) {
        throw new UnauthorizedError('請先登入')
      }

      if (!courseId) {
        throw new ValidationError('無效的課程 ID')
      }

      const result = await courseServiceNeon.enrollCourse(userId, courseId)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Course enrollment error:', error)
      
      if (error instanceof ValidationError || error instanceof UnauthorizedError || error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: error.constructor.name.replace('Error', '').toUpperCase(),
            message: error.message,
            statusCode: error instanceof UnauthorizedError ? 401 : (error instanceof NotFoundError ? 404 : 400)
          }
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '課程註冊失敗',
          statusCode: 500
        }
      }
    }
  })
}