/**
 * 講師功能Repository類別
 * 提供數據庫操作接口
 */

import { BaseRepository } from '../database'

import type { Instructor, InstructorRating, InstructorApplication, InstructorStats } from './types'

// 講師Repository
export class InstructorRepository extends BaseRepository<Instructor> {
  constructor() {
    super('instructors')
  }

  // 根據用戶ID查找講師
  async findByUserId(userId: number): Promise<Instructor | null> {
    return this.queryOne('SELECT * FROM instructors WHERE user_id = $1', [userId])
  }

  // 根據專業領域查找講師
  async findBySpecialization(specialization: string): Promise<Instructor[]> {
    return this.queryMany(
      'SELECT * FROM instructors WHERE specialization ILIKE $1 AND is_active = true ORDER BY average_rating DESC',
      [`%${specialization}%`]
    )
  }

  // 獲取活躍講師
  async findActive(): Promise<Instructor[]> {
    return this.queryMany(
      'SELECT * FROM instructors WHERE is_active = true ORDER BY average_rating DESC'
    )
  }

  // 搜索講師
  async search(searchTerm: string): Promise<Instructor[]> {
    return this.queryMany(
      `SELECT * FROM instructors 
       WHERE (bio ILIKE $1 OR qualifications ILIKE $1 OR specialization ILIKE $1) 
       AND is_active = true 
       ORDER BY average_rating DESC`,
      [`%${searchTerm}%`]
    )
  }

  // 獲取高評分講師
  async findTopRated(limit = 10): Promise<Instructor[]> {
    return this.queryMany(
      'SELECT * FROM instructors WHERE is_active = true ORDER BY average_rating DESC LIMIT $1',
      [limit]
    )
  }

  // 更新講師評分
  async updateRating(instructorId: number): Promise<void> {
    await this.executeRaw(
      `UPDATE instructors 
       SET average_rating = (
         SELECT COALESCE(AVG(rating), 0) 
         FROM instructor_ratings 
         WHERE instructor_id = $1
       ),
       total_ratings = (
         SELECT COUNT(*) 
         FROM instructor_ratings 
         WHERE instructor_id = $1
       )
       WHERE id = $1`,
      [instructorId]
    )
  }

  // 獲取講師統計
  async getStats(instructorId: number): Promise<InstructorStats | null> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(DISTINCT c.id) as total_courses,
         COUNT(DISTINCT ce.user_id) as total_students,
         COALESCE(AVG(ir.rating), 0) as average_rating,
         COUNT(ir.id) as total_ratings,
         COALESCE(
           COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(ce.id), 0), 0
         ) as completion_rate,
         COALESCE(SUM(c.price), 0) as revenue
       FROM instructors i
       LEFT JOIN courses c ON c.instructor_id = i.id
       LEFT JOIN course_enrollments ce ON ce.course_id = c.id
       LEFT JOIN instructor_ratings ir ON ir.instructor_id = i.id
       WHERE i.id = $1
       GROUP BY i.id`,
      [instructorId]
    )

    return result
      ? {
        total_courses: parseInt(result.total_courses || '0'),
        total_students: parseInt(result.total_students || '0'),
        average_rating: parseFloat(result.average_rating || '0'),
        total_ratings: parseInt(result.total_ratings || '0'),
        completion_rate: parseFloat(result.completion_rate || '0'),
        revenue: parseFloat(result.revenue || '0')
      }
      : null
  }

  // 獲取待審核的講師申請
  async findPendingApplications(): Promise<Instructor[]> {
    return this.queryMany(
      "SELECT * FROM instructors WHERE application_status = 'pending' ORDER BY created_at ASC"
    )
  }

  // 更新申請狀態
  async updateApplicationStatus(
    instructorId: number,
    status: 'approved' | 'rejected',
    approvedBy: number
  ): Promise<void> {
    await this.executeRaw(
      'UPDATE instructors SET application_status = $1, approval_date = NOW(), approved_by = $2 WHERE id = $3',
      [status, approvedBy, instructorId]
    )
  }
}

// 講師評分Repository
export class InstructorRatingRepository extends BaseRepository<InstructorRating> {
  constructor() {
    super('instructor_ratings')
  }

  // 根據講師ID查找評分
  async findByInstructor(instructorId: number): Promise<InstructorRating[]> {
    return this.queryMany(
      'SELECT * FROM instructor_ratings WHERE instructor_id = $1 ORDER BY created_at DESC',
      [instructorId]
    )
  }

  // 根據學生ID查找評分
  async findByStudent(studentId: number): Promise<InstructorRating[]> {
    return this.queryMany(
      'SELECT * FROM instructor_ratings WHERE student_id = $1 ORDER BY created_at DESC',
      [studentId]
    )
  }

  // 根據課程ID查找評分
  async findByCourse(courseId: number): Promise<InstructorRating[]> {
    return this.queryMany(
      'SELECT * FROM instructor_ratings WHERE course_id = $1 ORDER BY created_at DESC',
      [courseId]
    )
  }

  // 檢查學生是否已對講師評分
  async hasStudentRated(studentId: number, instructorId: number): Promise<boolean> {
    const result = await this.queryOne(
      'SELECT 1 FROM instructor_ratings WHERE student_id = $1 AND instructor_id = $2',
      [studentId, instructorId]
    )
    return !!result
  }

  // 獲取講師的平均評分
  async getAverageRating(instructorId: number): Promise<number> {
    const result = await this.queryOne(
      'SELECT AVG(rating) as avg_rating FROM instructor_ratings WHERE instructor_id = $1',
      [instructorId]
    )
    return parseFloat(result?.avg_rating || '0')
  }

  // 獲取評分統計
  async getRatingStats(instructorId: number): Promise<{
    total: number
    average: number
    distribution: Record<number, number>
  }> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total,
         AVG(rating) as average,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5
       FROM instructor_ratings 
       WHERE instructor_id = $1`,
      [instructorId]
    )

    return {
      total: parseInt(result?.total || '0'),
      average: parseFloat(result?.average || '0'),
      distribution: {
        1: parseInt(result?.rating_1 || '0'),
        2: parseInt(result?.rating_2 || '0'),
        3: parseInt(result?.rating_3 || '0'),
        4: parseInt(result?.rating_4 || '0'),
        5: parseInt(result?.rating_5 || '0')
      }
    }
  }
}

// 講師申請Repository
export class InstructorApplicationRepository extends BaseRepository<InstructorApplication> {
  constructor() {
    super('instructor_applications')
  }

  // 根據用戶ID查找申請
  async findByUserId(userId: number): Promise<InstructorApplication | null> {
    return this.queryOne(
      'SELECT * FROM instructor_applications WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1',
      [userId]
    )
  }

  // 獲取待審核的申請
  async findPending(): Promise<InstructorApplication[]> {
    return this.queryMany(
      "SELECT * FROM instructor_applications WHERE status = 'pending' ORDER BY submitted_at ASC"
    )
  }

  // 獲取已審核的申請
  async findReviewed(): Promise<InstructorApplication[]> {
    return this.queryMany(
      "SELECT * FROM instructor_applications WHERE status != 'pending' ORDER BY reviewed_at DESC"
    )
  }

  // 更新申請狀態
  async updateStatus(
    applicationId: number,
    status: 'approved' | 'rejected',
    reviewedBy: number,
    reviewNotes?: string
  ): Promise<void> {
    await this.executeRaw(
      'UPDATE instructor_applications SET status = $1, reviewed_at = NOW(), reviewed_by = $2, review_notes = $3 WHERE id = $4',
      [status, reviewedBy, reviewNotes, applicationId]
    )
  }
}

