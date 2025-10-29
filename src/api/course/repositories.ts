/**
 * 課程功能Repository類別
 * 提供數據庫操作接口
 */

import { BaseRepository } from '../database'

import type {
  Course,
  CourseEnrollment,
  CourseWithInstructor,
  EnrollmentWithDetails,
  CourseStats,
  CourseProgress,
  CourseSearchParams,
  EnrollmentSearchParams,
  CoursePaginationMeta,
  CourseApplication,
  CourseApplicationWithInstructor,
  CreateCourseApplicationRequest,
  CourseApplicationSearchParams,
  CourseApplicationStatus
} from './types'

// 課程Repository
export class CourseRepository extends BaseRepository<Course> {
  constructor() {
    super('courses')
  }

  // 查找活躍課程（帶篩選）
  async findActiveWithFilters(
    filters: CourseSearchParams
  ): Promise<{ data: Course[]; meta: CoursePaginationMeta }> {
    const {
      course_type,
      search,
      instructor_id,
      is_active,
      min_price,
      max_price,
      page = 1,
      limit = 10
    } = filters
    const offset = (page - 1) * limit

    const whereConditions: string[] = ['is_active = true']
    const values: any[] = []
    let paramIndex = 1

    if (course_type) {
      whereConditions.push(`course_type = $${paramIndex}`)
      values.push(course_type)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      values.push(`%${search}%`)
      paramIndex++
    }

    if (instructor_id) {
      whereConditions.push(`instructor_id = $${paramIndex}`)
      values.push(instructor_id)
      paramIndex++
    }

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`)
      values.push(is_active)
      paramIndex++
    }

    if (min_price !== undefined) {
      whereConditions.push(`price >= $${paramIndex}`)
      values.push(min_price)
      paramIndex++
    }

    if (max_price !== undefined) {
      whereConditions.push(`price <= $${paramIndex}`)
      values.push(max_price)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // 獲取總數
    const countResult = await this.queryOne(
      `SELECT COUNT(*) as total FROM courses WHERE ${whereClause}`,
      values
    )
    const total = parseInt(countResult?.total || '0')

    // 獲取數據
    const data = await this.queryMany(
      `SELECT * FROM courses WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    const meta: CoursePaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }

    return { data, meta }
  }

  // 根據講師ID查找課程
  async findByInstructor(instructorId: number): Promise<Course[]> {
    return this.queryMany(
      'SELECT * FROM courses WHERE instructor_id = $1 AND is_active = true ORDER BY created_at DESC',
      [instructorId]
    )
  }

  // 根據類型查找課程
  async findByType(courseType: string): Promise<Course[]> {
    return this.queryMany(
      'SELECT * FROM courses WHERE course_type = $1 AND is_active = true ORDER BY created_at DESC',
      [courseType]
    )
  }

  // 搜索課程
  async search(searchTerm: string): Promise<Course[]> {
    return this.queryMany(
      `SELECT * FROM courses 
       WHERE (title ILIKE $1 OR description ILIKE $1) 
       AND is_active = true 
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`]
    )
  }

  // 獲取課程詳情（包含講師信息）
  async findWithInstructor(courseId: number): Promise<CourseWithInstructor | null> {
    const result = await this.queryOne(
      `SELECT c.*, 
              i.first_name || ' ' || i.last_name as instructor_name,
              i.bio as instructor_bio,
              COUNT(ce.id) as enrollment_count,
              AVG(cr.rating) as average_rating
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.user_id
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       LEFT JOIN course_ratings cr ON c.id = cr.course_id
       WHERE c.id = $1
       GROUP BY c.id, i.first_name, i.last_name, i.bio`,
      [courseId]
    )

    return result
      ? {
        ...result,
        enrollment_count: parseInt(result.enrollment_count || '0'),
        average_rating: parseFloat(result.average_rating || '0')
      }
      : null
  }

  // 獲取課程統計
  async getStats(): Promise<CourseStats> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total_courses,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses,
         (SELECT COUNT(*) FROM course_enrollments) as total_enrollments,
         (SELECT COUNT(*) FROM course_enrollments WHERE status = 'completed') as completed_enrollments,
         (SELECT AVG(progress_percentage) FROM course_enrollments WHERE status = 'completed') as average_completion_rate,
         (SELECT AVG(final_score) FROM course_enrollments WHERE final_score IS NOT NULL) as average_score
       FROM courses`
    )

    return {
      totalCourses: parseInt(result?.total_courses || '0'),
      activeCourses: parseInt(result?.active_courses || '0'),
      totalEnrollments: parseInt(result?.total_enrollments || '0'),
      completedEnrollments: parseInt(result?.completed_enrollments || '0'),
      averageCompletionRate: parseFloat(result?.average_completion_rate || '0'),
      averageScore: parseFloat(result?.average_score || '0')
    }
  }

  // 更新課程狀態
  async updateStatus(courseId: number, isActive: boolean): Promise<void> {
    await this.executeRaw('UPDATE courses SET is_active = $1, updated_at = NOW() WHERE id = $2', [
      isActive,
      courseId
    ])
  }

  // 獲取課程統計
  async getCourseStats(courseId: number): Promise<{
    totalEnrollments: number
    completedEnrollments: number
    averageProgress: number
    averageRating: number
  }> {
    const result = await this.queryOne(
      `SELECT 
        COUNT(ce.id) as total_enrollments,
        COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completed_enrollments,
        AVG(ce.progress_percentage) as average_progress,
        AVG(e.rating) as average_rating
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       LEFT JOIN evaluations e ON c.id = e.course_id
       WHERE c.id = $1`,
      [courseId]
    )

    return {
      totalEnrollments: parseInt(result?.total_enrollments || '0'),
      completedEnrollments: parseInt(result?.completed_enrollments || '0'),
      averageProgress: parseFloat(result?.average_progress || '0'),
      averageRating: parseFloat(result?.average_rating || '0')
    }
  }

  // 查找熱門課程
  async findPopularCourses(limit = 10): Promise<Course[]> {
    return this.queryMany(
      `SELECT c.*, COUNT(ce.id) as enrollment_count
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY enrollment_count DESC, c.created_at DESC
       LIMIT $1`,
      [limit]
    )
  }
}

// 課程註冊Repository
export class CourseEnrollmentRepository extends BaseRepository<CourseEnrollment> {
  constructor() {
    super('course_enrollments')
  }

  // 根據用戶ID查找註冊
  async findByUser(userId: number): Promise<EnrollmentWithDetails[]> {
    return this.queryMany(
      `SELECT ce.*, 
              c.title as course_title,
              c.description as course_description,
              c.course_type,
              u.first_name || ' ' || u.last_name as user_name,
              u.email as user_email
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN users u ON ce.user_id = u.id
       WHERE ce.user_id = $1
       ORDER BY ce.enrollment_date DESC`,
      [userId]
    )
  }

  // 根據課程ID查找註冊
  async findByCourse(courseId: number): Promise<EnrollmentWithDetails[]> {
    return this.queryMany(
      `SELECT ce.*, 
              c.title as course_title,
              c.description as course_description,
              c.course_type,
              u.first_name || ' ' || u.last_name as user_name,
              u.email as user_email
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN users u ON ce.user_id = u.id
       WHERE ce.course_id = $1
       ORDER BY ce.enrollment_date DESC`,
      [courseId]
    )
  }

  // 查找用戶的課程註冊
  async findUserEnrollment(userId: number, courseId: number): Promise<CourseEnrollment | null> {
    return this.queryOne('SELECT * FROM course_enrollments WHERE user_id = $1 AND course_id = $2', [
      userId,
      courseId
    ])
  }

  // 別名方法，保持向後兼容
  async findByUserAndCourse(userId: number, courseId: number): Promise<CourseEnrollment | null> {
    return this.findUserEnrollment(userId, courseId)
  }

  // 搜索註冊
  async searchEnrollments(
    params: EnrollmentSearchParams
  ): Promise<{ data: EnrollmentWithDetails[]; meta: CoursePaginationMeta }> {
    const {
      user_id,
      course_id,
      status,
      enrollment_date_from,
      enrollment_date_to,
      page = 1,
      limit = 10
    } = params
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (user_id) {
      whereConditions.push(`ce.user_id = $${paramIndex}`)
      values.push(user_id)
      paramIndex++
    }

    if (course_id) {
      whereConditions.push(`ce.course_id = $${paramIndex}`)
      values.push(course_id)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`ce.status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (enrollment_date_from) {
      whereConditions.push(`ce.enrollment_date >= $${paramIndex}`)
      values.push(enrollment_date_from)
      paramIndex++
    }

    if (enrollment_date_to) {
      whereConditions.push(`ce.enrollment_date <= $${paramIndex}`)
      values.push(enrollment_date_to)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 獲取總數
    const countResult = await this.queryOne(
      `SELECT COUNT(*) as total 
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN users u ON ce.user_id = u.id
       ${whereClause}`,
      values
    )
    const total = parseInt(countResult?.total || '0')

    // 獲取數據
    const data = await this.queryMany(
      `SELECT ce.*, 
              c.title as course_title,
              c.description as course_description,
              c.course_type,
              u.first_name || ' ' || u.last_name as user_name,
              u.email as user_email
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN users u ON ce.user_id = u.id
       ${whereClause}
       ORDER BY ce.enrollment_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    const meta: CoursePaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }

    return { data, meta }
  }

  // 更新進度
  async updateProgress(enrollmentId: number, progressPercentage: number): Promise<void> {
    await this.executeRaw(
      'UPDATE course_enrollments SET progress_percentage = $1, updated_at = NOW() WHERE id = $2',
      [progressPercentage, enrollmentId]
    )
  }

  // 完成課程
  async completeCourse(enrollmentId: number, finalScore?: number): Promise<void> {
    await this.executeRaw(
      "UPDATE course_enrollments SET status = 'completed', completion_date = NOW(), final_score = $1, progress_percentage = 100, updated_at = NOW() WHERE id = $2",
      [finalScore, enrollmentId]
    )
  }

  // 獲取課程進度
  async getCourseProgress(userId: number, courseId: number): Promise<CourseProgress | null> {
    const result = await this.queryOne(
      `SELECT 
         ce.course_id,
         ce.user_id,
         ce.progress_percentage,
         ce.completion_date,
         ce.enrollment_date,
         COUNT(cm.id) as total_modules,
         COUNT(CASE WHEN cm.status = 'completed' THEN 1 END) as completed_modules,
         MAX(cm.last_accessed) as last_accessed
       FROM course_enrollments ce
       LEFT JOIN course_modules cm ON ce.course_id = cm.course_id AND ce.user_id = cm.user_id
       WHERE ce.user_id = $1 AND ce.course_id = $2
       GROUP BY ce.course_id, ce.user_id, ce.progress_percentage, ce.completion_date, ce.enrollment_date`,
      [userId, courseId]
    )

    if (!result) return null

    const estimatedCompletion = result.completion_date
      ? null
      : new Date(result.enrollment_date.getTime() + 30 * 24 * 60 * 60 * 1000) // 假設30天完成

    return {
      courseId: result.course_id,
      userId: result.user_id,
      progressPercentage: result.progress_percentage,
      completedModules: parseInt(result.completed_modules || '0'),
      totalModules: parseInt(result.total_modules || '0'),
      lastAccessed: result.last_accessed,
      estimatedCompletion
    }
  }

  // 獲取用戶註冊統計
  async getUserEnrollmentStats(userId: number): Promise<{
    totalEnrollments: number
    completedEnrollments: number
    inProgressEnrollments: number
    averageProgress: number
  }> {
    const result = await this.queryOne(
      `SELECT 
        COUNT(*) as total_enrollments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_enrollments,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_enrollments,
        AVG(progress_percentage) as average_progress
       FROM course_enrollments 
       WHERE user_id = $1`,
      [userId]
    )

    return {
      totalEnrollments: parseInt(result?.total_enrollments || '0'),
      completedEnrollments: parseInt(result?.completed_enrollments || '0'),
      inProgressEnrollments: parseInt(result?.in_progress_enrollments || '0'),
      averageProgress: parseFloat(result?.average_progress || '0')
    }
  }

  // 獲取課程註冊統計
  async getCourseEnrollmentStats(courseId: number): Promise<{
    totalEnrollments: number
    completedEnrollments: number
    inProgressEnrollments: number
    averageProgress: number
  }> {
    const result = await this.queryOne(
      `SELECT 
        COUNT(*) as total_enrollments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_enrollments,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_enrollments,
        AVG(progress_percentage) as average_progress
       FROM course_enrollments 
       WHERE course_id = $1`,
      [courseId]
    )

    return {
      totalEnrollments: parseInt(result?.total_enrollments || '0'),
      completedEnrollments: parseInt(result?.completed_enrollments || '0'),
      inProgressEnrollments: parseInt(result?.in_progress_enrollments || '0'),
      averageProgress: parseFloat(result?.average_progress || '0')
    }
  }
}

// 課程申請Repository
export class CourseApplicationRepository extends BaseRepository<CourseApplication> {
  constructor() {
    super('course_applications')
  }

  // 創建課程申請
  async createApplication(
    instructorId: number,
    data: CreateCourseApplicationRequest
  ): Promise<CourseApplication> {
    const result = await this.queryOne(
      `INSERT INTO course_applications (
        instructor_id, course_name, description, category, target_audience,
        duration, price, delivery_methods, syllabus, teaching_experience,
        materials, special_requirements, status, submitted_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', NOW(), NOW(), NOW())
      RETURNING *`,
      [
        instructorId,
        data.course_name,
        data.description,
        data.category,
        data.target_audience,
        data.duration,
        data.price,
        data.delivery_methods || '',
        data.syllabus,
        data.teaching_experience,
        data.materials || null,
        data.special_requirements || null
      ]
    )

    return result as CourseApplication
  }

  // 根據講師ID查找課程申請
  async findByInstructor(
    instructorId: number,
    filters?: CourseApplicationSearchParams
  ): Promise<{ data: CourseApplicationWithInstructor[]; meta: CoursePaginationMeta }> {
    const { status, category, page = 1, limit = 10 } = filters || {}
    const offset = (page - 1) * limit

    const whereConditions: string[] = ['ca.instructor_id = $1']
    const values: any[] = [instructorId]
    let paramIndex = 2

    if (status) {
      whereConditions.push(`ca.status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (category) {
      whereConditions.push(`ca.category = $${paramIndex}`)
      values.push(category)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // 獲取總數
    const countResult = await this.queryOne(
      `SELECT COUNT(*) as total
       FROM course_applications ca
       WHERE ${whereClause}`,
      values
    )
    const total = parseInt(countResult?.total || '0')

    // 獲取數據
    const data = await this.queryMany(
      `SELECT
        ca.*,
        (u.first_name || ' ' || u.last_name) as instructor_name,
        u.email as instructor_email,
        ia.bio as instructor_bio,
        ia.user_id
      FROM course_applications ca
      JOIN instructor_applications ia ON ca.instructor_id = ia.id
      JOIN users u ON ia.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ca.submitted_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    const meta: CoursePaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }

    return { data: data as CourseApplicationWithInstructor[], meta }
  }

  // 根據ID查找課程申請（包含講師信息）
  async findByIdWithInstructor(id: number): Promise<CourseApplicationWithInstructor | null> {
    const result = await this.queryOne(
      `SELECT
        ca.*,
        (u.first_name || ' ' || u.last_name) as instructor_name,
        u.email as instructor_email,
        ia.bio as instructor_bio,
        ia.user_id
      FROM course_applications ca
      JOIN instructor_applications ia ON ca.instructor_id = ia.id
      JOIN users u ON ia.user_id = u.id
      WHERE ca.id = $1`,
      [id]
    )

    return result as CourseApplicationWithInstructor | null
  }

  // 查找所有課程申請（管理員用）
  async findAllWithFilters(
    filters?: CourseApplicationSearchParams
  ): Promise<{ data: CourseApplicationWithInstructor[]; meta: CoursePaginationMeta }> {
    const { instructor_id, status, category, page = 1, limit = 10 } = filters || {}
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (instructor_id) {
      whereConditions.push(`ca.instructor_id = $${paramIndex}`)
      values.push(instructor_id)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`ca.status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (category) {
      whereConditions.push(`ca.category = $${paramIndex}`)
      values.push(category)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 獲取總數
    const countResult = await this.queryOne(
      `SELECT COUNT(*) as total
       FROM course_applications ca
       ${whereClause}`,
      values
    )
    const total = parseInt(countResult?.total || '0')

    // 獲取數據
    const data = await this.queryMany(
      `SELECT
        ca.*,
        (u.first_name || ' ' || u.last_name) as instructor_name,
        u.email as instructor_email,
        ia.bio as instructor_bio,
        ia.user_id
      FROM course_applications ca
      JOIN instructor_applications ia ON ca.instructor_id = ia.id
      JOIN users u ON ia.user_id = u.id
      ${whereClause}
      ORDER BY ca.submitted_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    const meta: CoursePaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }

    return { data: data as CourseApplicationWithInstructor[], meta }
  }

  // 審核課程申請
  async reviewApplication(
    id: number,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<CourseApplication> {
    const result = await this.queryOne(
      `UPDATE course_applications
       SET status = $1, reviewed_at = NOW(), review_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, reviewNotes || null, id]
    )

    return result as CourseApplication
  }

  // 檢查講師是否有待審核的申請
  async hasPendingApplication(instructorId: number): Promise<boolean> {
    const result = await this.queryOne(
      `SELECT COUNT(*) as count
       FROM course_applications
       WHERE instructor_id = $1 AND status = 'pending'`,
      [instructorId]
    )

    return parseInt(result?.count || '0') > 0
  }

  // 獲取課程申請統計
  async getApplicationStats(instructorId?: number): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    const whereClause = instructorId ? 'WHERE instructor_id = $1' : ''
    const values = instructorId ? [instructorId] : []

    const result = await this.queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
       FROM course_applications
       ${whereClause}`,
      values
    )

    return {
      total: parseInt(result?.total || '0'),
      pending: parseInt(result?.pending || '0'),
      approved: parseInt(result?.approved || '0'),
      rejected: parseInt(result?.rejected || '0')
    }
  }
}

