import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse, PaginationOptions } from './types'
import { requireAuth } from './auth-middleware'
import { BaseRepository } from './database'
import { NotFoundError, ValidationError, UnauthorizedError } from './errors'

// Course type definition
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

// Course enrollment type
interface CourseEnrollment {
    id: number
    user_id: number
    course_id: number
    enrollment_date: Date
    completion_date: Date | null
    progress_percentage: number
    final_score: number | null
    status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
}

// Course repository
class CourseRepository extends BaseRepository<Course> {
    constructor() {
        super('courses')
    }

    // Find active courses with filters
    async findActiveWithFilters(filters: {
        courseType?: string
        search?: string
        page?: number
        limit?: number
    }): Promise<{ data: Course[]; meta: any }> {
        const { courseType, search, page = 1, limit = 10 } = filters
        const offset = (page - 1) * limit

        const whereConditions: string[] = ['is_active = true']
        const values: any[] = []
        let paramIndex = 1

        if (courseType) {
            whereConditions.push(`course_type = $${paramIndex}`)
            values.push(courseType)
            paramIndex++
        }

        if (search) {
            whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
            values.push(`%${search}%`)
            paramIndex++
        }

        const whereClause = whereConditions.join(' AND ')

        // Get total count
        const { db } = await import('../utils/database')
        const countResult = await db.queryOne<{ count: string }>({
            text: `SELECT COUNT(*) as count FROM courses WHERE ${whereClause}`,
            values
        })
        const total = parseInt(countResult?.count || '0', 10)

        // Get paginated data
        const data = await db.queryMany<Course>({
            text: `
                SELECT * FROM courses
                WHERE ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `,
            values: [...values, limit, offset]
        })

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    // Get course with instructor info
    async findByIdWithInstructor(id: number): Promise<any> {
        const { db } = await import('../utils/database')
        return await db.queryOne({
            text: `
                SELECT 
                    c.*,
                    u.first_name as instructor_first_name,
                    u.last_name as instructor_last_name,
                    u.email as instructor_email
                FROM courses c
                LEFT JOIN users u ON c.instructor_id = u.id
                WHERE c.id = $1
            `,
            values: [id]
        })
    }
}

// Course enrollment repository
class CourseEnrollmentRepository extends BaseRepository<CourseEnrollment> {
    constructor() {
        super('course_enrollments')
    }

    // Check if user is enrolled in course
    async isUserEnrolled(userId: number, courseId: number): Promise<boolean> {
        const { db } = await import('../utils/database')
        const result = await db.queryOne<{ exists: boolean }>({
            text: `
                SELECT EXISTS(
                    SELECT 1 FROM course_enrollments 
                    WHERE user_id = $1 AND course_id = $2
                ) as exists
            `,
            values: [userId, courseId]
        })
        return result?.exists || false
    }

    // Get user's enrollment for a course
    async getUserEnrollment(userId: number, courseId: number): Promise<CourseEnrollment | null> {
        const { db } = await import('../utils/database')
        return await db.queryOne<CourseEnrollment>({
            text: `
                SELECT * FROM course_enrollments
                WHERE user_id = $1 AND course_id = $2
            `,
            values: [userId, courseId]
        })
    }

    // Get user's enrollments with course details
    async getUserEnrollmentsWithCourses(userId: number): Promise<any[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany({
            text: `
                SELECT 
                    ce.*,
                    c.title as course_title,
                    c.description as course_description,
                    c.course_type,
                    c.duration_hours
                FROM course_enrollments ce
                JOIN courses c ON ce.course_id = c.id
                WHERE ce.user_id = $1
                ORDER BY ce.enrollment_date DESC
            `,
            values: [userId]
        })
    }

    // Update enrollment progress
    async updateProgress(
        enrollmentId: number,
        progressPercentage: number,
        status?: string
    ): Promise<CourseEnrollment | null> {
        const { db } = await import('../utils/database')

        const updateFields = ['progress_percentage = $2', 'updated_at = CURRENT_TIMESTAMP']
        const values: any[] = [enrollmentId, progressPercentage]
        let paramIndex = 3

        if (status) {
            updateFields.push(`status = $${paramIndex}`)
            values.push(status)
            paramIndex++
        }

        // If progress is 100%, set completion date
        if (progressPercentage >= 100) {
            updateFields.push('completion_date = CURRENT_TIMESTAMP')
            updateFields.push(`status = $${paramIndex}`)
            values.push('completed')
        }

        return await db.queryOne<CourseEnrollment>({
            text: `
                UPDATE course_enrollments
                SET ${updateFields.join(', ')}
                WHERE id = $1
                RETURNING *
            `,
            values
        })
    }
}

// Initialize repositories
const courseRepo = new CourseRepository()
const enrollmentRepo = new CourseEnrollmentRepository()

// Setup course routes
export function setupCourseRoutes(router: ApiRouter): void {
    // Get all courses (with filters and pagination)
    router.get('/api/v1/courses', async (req: ApiRequest): Promise<ApiResponse> => {
        const { course_type, search, page, limit } = req.query || {}

        const filters = {
            courseType: course_type,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        }

        const result = await courseRepo.findActiveWithFilters(filters)

        return {
            success: true,
            data: {
                courses: result.data
            },
            meta: result.meta
        }
    })

    // Get course by ID
    router.get('/api/v1/courses/:id', async (req: ApiRequest): Promise<ApiResponse> => {
        const courseId = parseInt(req.params?.id || '0')

        if (!courseId) {
            throw new ValidationError('無效的課程 ID')
        }

        const course = await courseRepo.findByIdWithInstructor(courseId)

        if (!course) {
            throw new NotFoundError('課程不存在')
        }

        return {
            success: true,
            data: course
        }
    })

    // Enroll in a course (requires authentication)
    router.post('/api/v1/courses/:id/enroll', async (req: ApiRequest): Promise<ApiResponse> => {
        const courseId = parseInt(req.params?.id || '0')
        const userId = req.user?.id

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        if (!courseId) {
            throw new ValidationError('無效的課程 ID')
        }

        // Check if course exists and is active
        const course = await courseRepo.findById(courseId)
        if (!course) {
            throw new NotFoundError('課程不存在')
        }

        if (!course.is_active) {
            throw new ValidationError('此課程目前無法註冊')
        }

        // Check if already enrolled
        const isEnrolled = await enrollmentRepo.isUserEnrolled(userId, courseId)
        if (isEnrolled) {
            throw new ValidationError('您已經註冊過此課程')
        }

        // Create enrollment
        const enrollment = await enrollmentRepo.create({
            user_id: userId,
            course_id: courseId,
            progress_percentage: 0,
            status: 'enrolled'
        } as any)

        return {
            success: true,
            data: {
                message: '課程註冊成功',
                enrollment
            }
        }
    }, [requireAuth])

    // Get course progress (requires authentication)
    router.get('/api/v1/courses/:id/progress', async (req: ApiRequest): Promise<ApiResponse> => {
        const courseId = parseInt(req.params?.id || '0')
        const userId = req.user?.id

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        if (!courseId) {
            throw new ValidationError('無效的課程 ID')
        }

        const enrollment = await enrollmentRepo.getUserEnrollment(userId, courseId)

        if (!enrollment) {
            throw new NotFoundError('您尚未註冊此課程')
        }

        return {
            success: true,
            data: enrollment
        }
    }, [requireAuth])

    // Update course progress (requires authentication)
    router.post('/api/v1/courses/:id/progress', async (req: ApiRequest): Promise<ApiResponse> => {
        const courseId = parseInt(req.params?.id || '0')
        const userId = req.user?.id
        const { progress_percentage, status } = req.body as any

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        if (!courseId) {
            throw new ValidationError('無效的課程 ID')
        }

        if (progress_percentage === undefined || progress_percentage < 0 || progress_percentage > 100) {
            throw new ValidationError('進度百分比必須在 0-100 之間')
        }

        const enrollment = await enrollmentRepo.getUserEnrollment(userId, courseId)

        if (!enrollment) {
            throw new NotFoundError('您尚未註冊此課程')
        }

        const updatedEnrollment = await enrollmentRepo.updateProgress(
            enrollment.id,
            progress_percentage,
            status
        )

        return {
            success: true,
            data: {
                message: '學習進度已更新',
                enrollment: updatedEnrollment
            }
        }
    }, [requireAuth])

    // Get user's all enrollments (requires authentication)
    router.get('/api/v1/users/enrollments', async (req: ApiRequest): Promise<ApiResponse> => {
        const userId = req.user?.id

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        const enrollments = await enrollmentRepo.getUserEnrollmentsWithCourses(userId)

        return {
            success: true,
            data: enrollments
        }
    }, [requireAuth])
}
