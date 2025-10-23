/**
 * 課程申請 API 路由
 * 處理講師申請開課的相關功能
 */

import { ApiRouter } from '../router'
import { withAuth } from '../middleware-helpers'
import type { ApiRequest, ApiResponse } from '../types'

const router = new ApiRouter()

// 創建課程申請
router.post(
  '/course-applications',
  withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const body = req.body as any
      const {
        course_name,
        description,
        category,
        target_audience,
        duration,
        price,
        delivery_methods,
        syllabus,
        teaching_experience,
        materials,
        special_requirements
      } = body

      // 驗證必填欄位
      if (
        !course_name ||
        !description ||
        !category ||
        !target_audience ||
        !duration ||
        price === undefined
      ) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '請填寫所有必填欄位' }
        }
      }

      // 驗證數值
      if (duration <= 0 || price < 0) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '課程時數和費用必須為正數' }
        }
      }

      // 檢查用戶是否為已批准的講師
      const instructorCheck = await (req as any).db.queryOne(
        'SELECT id, status FROM instructor_applications WHERE user_id = $1',
        [req.user!.id]
      )

      if (!instructorCheck || instructorCheck.status !== 'approved') {
        return {
          success: false,
          error: { code: 'PERMISSION_DENIED', message: '只有已通過審核的講師才能申請開課' }
        }
      }

      // 插入課程申請
      const result = await (req as any).db.queryOne(
        `INSERT INTO course_applications (
        instructor_id, course_name, description, category, target_audience,
        duration, price, delivery_methods, syllabus, teaching_experience,
        materials, special_requirements, status, submitted_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', NOW(), NOW(), NOW())
      RETURNING id`,
        [
          instructorCheck.id,
          course_name,
          description,
          category,
          target_audience,
          duration,
          price,
          delivery_methods || '',
          syllabus,
          teaching_experience,
          materials || '',
          special_requirements || ''
        ]
      )

      return {
        success: true,
        data: {
          applicationId: result.id
        }
      }
    } catch (error) {
      console.error('創建課程申請失敗:', error)
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '提交失敗，請稍後再試' }
      }
    }
  })
)

// 獲取講師的課程申請列表
router.get(
  '/instructors/:id/course-applications',
  withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const instructorId = parseInt(req.params?.id || '0')

      if (isNaN(instructorId)) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '無效的講師ID' }
        }
      }

      // 檢查權限：只有講師本人或管理員可以查看
      const instructorCheck = await (req as any).db.queryOne(
        'SELECT user_id FROM instructor_applications WHERE id = $1',
        [instructorId]
      )

      if (!instructorCheck) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '講師不存在' }
        }
      }

      if (req.user!.userType !== 'admin' && instructorCheck.user_id !== req.user!.id) {
        return {
          success: false,
          error: { code: 'PERMISSION_DENIED', message: '無權限查看此講師的課程申請' }
        }
      }

      const applications = await (req as any).db.queryMany(
        `SELECT 
        ca.id, ca.course_name, ca.description, ca.category, ca.target_audience,
        ca.duration, ca.price, ca.delivery_methods, ca.syllabus, ca.teaching_experience,
        ca.materials, ca.special_requirements, ca.status, ca.submitted_at, ca.reviewed_at,
        ca.review_notes, ca.created_at, ca.updated_at,
        u.name as instructor_name, u.email as instructor_email
      FROM course_applications ca
      JOIN instructor_applications ia ON ca.instructor_id = ia.id
      JOIN users u ON ia.user_id = u.id
      WHERE ca.instructor_id = $1
      ORDER BY ca.submitted_at DESC`,
        [instructorId]
      )

      return {
        success: true,
        data: applications
      }
    } catch (error) {
      console.error('獲取課程申請列表失敗:', error)
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '獲取申請列表失敗' }
      }
    }
  })
)

// 獲取單個課程申請詳情
router.get(
  '/course-applications/:id',
  withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const applicationId = parseInt(req.params?.id || '0')

      if (isNaN(applicationId)) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '無效的申請ID' }
        }
      }

      const application = await (req as any).db.queryOne(
        `SELECT 
        ca.id, ca.course_name, ca.description, ca.category, ca.target_audience,
        ca.duration, ca.price, ca.delivery_methods, ca.syllabus, ca.teaching_experience,
        ca.materials, ca.special_requirements, ca.status, ca.submitted_at, ca.reviewed_at,
        ca.review_notes, ca.created_at, ca.updated_at,
        u.name as instructor_name, u.email as instructor_email,
        ia.id as instructor_id
      FROM course_applications ca
      JOIN instructor_applications ia ON ca.instructor_id = ia.id
      JOIN users u ON ia.user_id = u.id
      WHERE ca.id = $1`,
        [applicationId]
      )

      if (!application) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '課程申請不存在' }
        }
      }

      // 檢查權限：只有講師本人或管理員可以查看
      if (req.user!.userType !== 'admin' && application.instructor_id !== req.user!.id) {
        return {
          success: false,
          error: { code: 'PERMISSION_DENIED', message: '無權限查看此課程申請' }
        }
      }

      return {
        success: true,
        data: application
      }
    } catch (error) {
      console.error('獲取課程申請詳情失敗:', error)
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '獲取申請詳情失敗' }
      }
    }
  })
)

export default router
