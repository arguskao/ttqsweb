// 重構的課程服務 - 使用 Neon 數據庫
import { neonDb } from '../utils/neon-database'
import { ValidationError, NotFoundError } from './errors'
import type { ApiRequest, ApiResponse } from './types'

// Course interface
interface Course {
  id: number
  title: string
  description: string | null
  course_type: 'basic' | 'advanced' | 'internship'
  duration_hours: number | null
  price: number | null
  instructor_id: number | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

// Course service class
export class CourseServiceNeon {
  // 獲取課程列表（帶分頁和篩選）
  async getCourses(
    options: {
      page?: number
      limit?: number
      courseType?: string
      search?: string
    } = {}
  ): Promise<{ data: Course[]; meta: any }> {
    const { page = 1, limit = 10, courseType, search } = options
    const offset = (page - 1) * limit

    try {
      // 構建 WHERE 條件
      let whereConditions = ['c.is_active = true']
      let params: any[] = []
      let paramIndex = 1

      if (courseType) {
        whereConditions.push(`c.course_type = $${paramIndex}`)
        params.push(courseType)
        paramIndex++
      }

      if (search) {
        whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }

      const whereClause = whereConditions.join(' AND ')

      // 獲取總數
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM courses c 
        WHERE ${whereClause}
      `
      const countResult = await neonDb.queryOne(countQuery, params)
      const total = parseInt(countResult?.count || '0', 10)

      // 獲取分頁數據
      const dataQuery = `
        SELECT 
          c.*,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          u.email as instructor_email
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      const courses = await neonDb.queryMany(dataQuery, [...params, limit, offset])

      return {
        data: courses,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Course service error:', error)
      throw new Error('Failed to fetch courses')
    }
  }

  // 根據 ID 獲取課程
  async getCourseById(id: number): Promise<Course | null> {
    try {
      const query = `
        SELECT 
          c.*,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          u.email as instructor_email
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.id = $1
      `
      return await neonDb.queryOne(query, [id])
    } catch (error) {
      console.error('Get course by ID error:', error)
      throw new Error('Failed to fetch course')
    }
  }

  // 檢查用戶是否已註冊課程
  async isUserEnrolled(userId: number, courseId: number): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM course_enrollments 
          WHERE user_id = $1 AND course_id = $2
        ) as exists
      `
      const result = await neonDb.queryOne(query, [userId, courseId])
      return result?.exists || false
    } catch (error) {
      console.error('Check enrollment error:', error)
      return false
    }
  }

  // 註冊課程
  async enrollCourse(userId: number, courseId: number): Promise<any> {
    try {
      // 檢查課程是否存在且激活
      const course = await this.getCourseById(courseId)
      if (!course) {
        throw new NotFoundError('課程不存在')
      }

      if (!course.is_active) {
        throw new ValidationError('此課程目前無法註冊')
      }

      // 檢查是否已註冊
      const isEnrolled = await this.isUserEnrolled(userId, courseId)
      if (isEnrolled) {
        throw new ValidationError('您已經註冊過此課程')
      }

      // 創建註冊記錄
      const enrollQuery = `
        INSERT INTO course_enrollments (user_id, course_id, progress_percentage, status)
        VALUES ($1, $2, 0, 'enrolled')
        RETURNING *
      `
      const enrollment = await neonDb.queryOne(enrollQuery, [userId, courseId])

      return {
        message: '課程註冊成功',
        enrollment
      }
    } catch (error) {
      console.error('Course enrollment error:', error)
      throw error
    }
  }
}

// 導出實例
export const courseServiceNeon = new CourseServiceNeon()
export default courseServiceNeon
