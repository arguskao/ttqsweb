import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'
import { requireAuth } from './auth-middleware'
import { BaseRepository } from './database'
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } from './errors'

// Instructor type definition
interface Instructor {
    id: number
    user_id: number
    bio: string | null
    qualifications: string | null
    specialization: string | null
    years_of_experience: number | null
    application_status: 'pending' | 'approved' | 'rejected'
    approval_date: Date | null
    approved_by: number | null
    average_rating: number
    total_ratings: number
    is_active: boolean
    created_at: Date
    updated_at: Date
}

// Instructor rating type
interface InstructorRating {
    id: number
    instructor_id: number
    student_id: number
    course_id: number
    rating: number
    comment: string | null
    created_at: Date
}

// Instructor repository
class InstructorRepository extends BaseRepository<Instructor> {
    constructor() {
        super('instructors')
    }

    // Find instructor by user ID
    async findByUserId(userId: number): Promise<Instructor | null> {
        const { db } = await import('../utils/database')
        return await db.queryOne<Instructor>({
            text: 'SELECT * FROM instructors WHERE user_id = $1',
            values: [userId]
        })
    }

    // Get instructor with user details
    async findByIdWithUser(id: number): Promise<any> {
        const { db } = await import('../utils/database')
        return await db.queryOne({
            text: `
                SELECT 
                    i.*,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone
                FROM instructors i
                JOIN users u ON i.user_id = u.id
                WHERE i.id = $1
            `,
            values: [id]
        })
    }

    // Get all instructors with filters
    async findWithFilters(filters: {
        status?: string
        isActive?: boolean
        page?: number
        limit?: number
    }): Promise<{ data: any[]; meta: any }> {
        const { status, isActive, page = 1, limit = 10 } = filters
        const offset = (page - 1) * limit

        const whereConditions: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (status) {
            whereConditions.push(`i.application_status = $${paramIndex}`)
            values.push(status)
            paramIndex++
        }

        if (isActive !== undefined) {
            whereConditions.push(`i.is_active = $${paramIndex}`)
            values.push(isActive)
            paramIndex++
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

        // Get total count
        const { db } = await import('../utils/database')
        const countResult = await db.queryOne<{ count: string }>({
            text: `SELECT COUNT(*) as count FROM instructors i ${whereClause}`,
            values
        })
        const total = parseInt(countResult?.count || '0', 10)

        // Get paginated data with user details
        const data = await db.queryMany({
            text: `
                SELECT 
                    i.*,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone
                FROM instructors i
                JOIN users u ON i.user_id = u.id
                ${whereClause}
                ORDER BY i.created_at DESC
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

    // Update instructor status
    async updateStatus(
        id: number,
        status: 'pending' | 'approved' | 'rejected',
        approvedBy?: number
    ): Promise<Instructor | null> {
        const { db } = await import('../utils/database')

        const updates: string[] = ['application_status = $2']
        const values: any[] = [id, status]
        let paramIndex = 3

        if (status === 'approved') {
            updates.push('approval_date = CURRENT_TIMESTAMP')
            if (approvedBy) {
                updates.push(`approved_by = $${paramIndex}`)
                values.push(approvedBy)
                paramIndex++
            }
        }

        return await db.queryOne<Instructor>({
            text: `
                UPDATE instructors
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `,
            values
        })
    }

    // Update instructor rating
    async updateRating(instructorId: number): Promise<void> {
        const { db } = await import('../utils/database')

        await db.queryOne({
            text: `
                UPDATE instructors
                SET 
                    average_rating = (
                        SELECT COALESCE(AVG(rating), 0)
                        FROM instructor_ratings
                        WHERE instructor_id = $1
                    ),
                    total_ratings = (
                        SELECT COUNT(*)
                        FROM instructor_ratings
                        WHERE instructor_id = $1
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `,
            values: [instructorId]
        })
    }

    // Check if instructor should be deactivated (rating < 80/100 = 4.0/5.0)
    async checkAndDeactivateIfNeeded(instructorId: number): Promise<boolean> {
        const { db } = await import('../utils/database')

        const instructor = await this.findById(instructorId)
        if (!instructor) return false

        // Convert 5-point scale to 100-point scale: rating * 20
        const ratingOn100Scale = instructor.average_rating * 20

        if (instructor.total_ratings >= 5 && ratingOn100Scale < 80) {
            await db.queryOne({
                text: `
                    UPDATE instructors
                    SET is_active = false, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `,
                values: [instructorId]
            })
            return true
        }

        return false
    }
}

// Instructor rating repository
class InstructorRatingRepository extends BaseRepository<InstructorRating> {
    constructor() {
        super('instructor_ratings')
    }

    // Check if student has already rated instructor for a course
    async hasRated(studentId: number, instructorId: number, courseId: number): Promise<boolean> {
        const { db } = await import('../utils/database')
        const result = await db.queryOne<{ exists: boolean }>({
            text: `
                SELECT EXISTS(
                    SELECT 1 FROM instructor_ratings 
                    WHERE student_id = $1 AND instructor_id = $2 AND course_id = $3
                ) as exists
            `,
            values: [studentId, instructorId, courseId]
        })
        return result?.exists || false
    }

    // Get ratings for an instructor
    async getInstructorRatings(instructorId: number, page = 1, limit = 10): Promise<{ data: any[]; meta: any }> {
        const offset = (page - 1) * limit
        const { db } = await import('../utils/database')

        // Get total count
        const countResult = await db.queryOne<{ count: string }>({
            text: 'SELECT COUNT(*) as count FROM instructor_ratings WHERE instructor_id = $1',
            values: [instructorId]
        })
        const total = parseInt(countResult?.count || '0', 10)

        // Get paginated ratings with student and course details
        const data = await db.queryMany({
            text: `
                SELECT 
                    ir.*,
                    u.first_name as student_first_name,
                    u.last_name as student_last_name,
                    c.title as course_title
                FROM instructor_ratings ir
                JOIN users u ON ir.student_id = u.id
                JOIN courses c ON ir.course_id = c.id
                WHERE ir.instructor_id = $1
                ORDER BY ir.created_at DESC
                LIMIT $2 OFFSET $3
            `,
            values: [instructorId, limit, offset]
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
}

// Initialize repositories
const instructorRepo = new InstructorRepository()
const ratingRepo = new InstructorRatingRepository()

// Setup instructor routes
export function setupInstructorRoutes(router: ApiRouter): void {
    // Apply to become an instructor (requires authentication)
    router.post('/api/v1/instructors/apply', async (req: ApiRequest): Promise<ApiResponse> => {
        const userId = req.user?.id

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        const { bio, qualifications, specialization, years_of_experience } = req.body as any

        // Validate required fields
        if (!bio || !qualifications) {
            throw new ValidationError('請提供個人簡介和資格證明')
        }

        // Check if user already has an instructor application
        const existing = await instructorRepo.findByUserId(userId)
        if (existing) {
            throw new ValidationError('您已經提交過講師申請')
        }

        // Create instructor application
        const instructor = await instructorRepo.create({
            user_id: userId,
            bio,
            qualifications,
            specialization,
            years_of_experience: years_of_experience || 0,
            application_status: 'pending'
        } as any)

        return {
            success: true,
            data: {
                message: '講師申請已提交，等待審核',
                instructor
            }
        }
    }, [requireAuth])

    // Get instructor profile (requires authentication)
    router.get('/api/v1/instructors/profile', async (req: ApiRequest): Promise<ApiResponse> => {
        const userId = req.user?.id

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        const instructor = await instructorRepo.findByUserId(userId)

        if (!instructor) {
            throw new NotFoundError('您尚未申請成為講師')
        }

        const instructorWithUser = await instructorRepo.findByIdWithUser(instructor.id)

        return {
            success: true,
            data: instructorWithUser
        }
    }, [requireAuth])

    // Update instructor profile (requires authentication)
    router.put('/api/v1/instructors/profile', async (req: ApiRequest): Promise<ApiResponse> => {
        const userId = req.user?.id

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        const instructor = await instructorRepo.findByUserId(userId)

        if (!instructor) {
            throw new NotFoundError('您尚未申請成為講師')
        }

        const { bio, qualifications, specialization, years_of_experience } = req.body as any

        const updateData: any = {}
        if (bio !== undefined) updateData.bio = bio
        if (qualifications !== undefined) updateData.qualifications = qualifications
        if (specialization !== undefined) updateData.specialization = specialization
        if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience

        const updated = await instructorRepo.update(instructor.id, updateData)

        return {
            success: true,
            data: {
                message: '講師資料已更新',
                instructor: updated
            }
        }
    }, [requireAuth])

    // Get all instructors (with filters)
    router.get('/api/v1/instructors', async (req: ApiRequest): Promise<ApiResponse> => {
        const { status, is_active, page, limit } = req.query || {}

        const filters = {
            status,
            isActive: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        }

        const result = await instructorRepo.findWithFilters(filters)

        return {
            success: true,
            data: {
                instructors: result.data
            },
            meta: result.meta
        }
    })

    // Get instructor by ID
    router.get('/api/v1/instructors/:id', async (req: ApiRequest): Promise<ApiResponse> => {
        const instructorId = parseInt(req.params?.id || '0')

        if (!instructorId) {
            throw new ValidationError('無效的講師 ID')
        }

        const instructor = await instructorRepo.findByIdWithUser(instructorId)

        if (!instructor) {
            throw new NotFoundError('講師不存在')
        }

        return {
            success: true,
            data: instructor
        }
    })

    // Approve or reject instructor application (admin only - simplified for now)
    router.post('/api/v1/instructors/:id/review', async (req: ApiRequest): Promise<ApiResponse> => {
        const instructorId = parseInt(req.params?.id || '0')
        const userId = req.user?.id
        const { status } = req.body as any

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        if (!instructorId) {
            throw new ValidationError('無效的講師 ID')
        }

        if (!status || !['approved', 'rejected'].includes(status)) {
            throw new ValidationError('無效的審核狀態')
        }

        const instructor = await instructorRepo.findById(instructorId)

        if (!instructor) {
            throw new NotFoundError('講師不存在')
        }

        if (instructor.application_status !== 'pending') {
            throw new ValidationError('此申請已經被審核過')
        }

        const updated = await instructorRepo.updateStatus(instructorId, status, userId)

        return {
            success: true,
            data: {
                message: status === 'approved' ? '講師申請已批准' : '講師申請已拒絕',
                instructor: updated
            }
        }
    }, [requireAuth])

    // Rate an instructor (requires authentication)
    router.post('/api/v1/instructors/:id/rate', async (req: ApiRequest): Promise<ApiResponse> => {
        const instructorId = parseInt(req.params?.id || '0')
        const userId = req.user?.id
        const { rating, comment, course_id } = req.body as any

        if (!userId) {
            throw new UnauthorizedError('請先登入')
        }

        if (!instructorId) {
            throw new ValidationError('無效的講師 ID')
        }

        if (!course_id) {
            throw new ValidationError('請提供課程 ID')
        }

        if (!rating || rating < 1 || rating > 5) {
            throw new ValidationError('評分必須在 1-5 之間')
        }

        // Check if instructor exists
        const instructor = await instructorRepo.findById(instructorId)
        if (!instructor) {
            throw new NotFoundError('講師不存在')
        }

        // Check if student has already rated this instructor for this course
        const hasRated = await ratingRepo.hasRated(userId, instructorId, course_id)
        if (hasRated) {
            throw new ValidationError('您已經評價過此講師的這門課程')
        }

        // Create rating
        await ratingRepo.create({
            instructor_id: instructorId,
            student_id: userId,
            course_id,
            rating,
            comment
        } as any)

        // Update instructor's average rating
        await instructorRepo.updateRating(instructorId)

        // Check if instructor should be deactivated
        const deactivated = await instructorRepo.checkAndDeactivateIfNeeded(instructorId)

        return {
            success: true,
            data: {
                message: '評價已提交',
                deactivated: deactivated ? '講師因評分過低已被停用' : undefined
            }
        }
    }, [requireAuth])

    // Get instructor ratings
    router.get('/api/v1/instructors/:id/ratings', async (req: ApiRequest): Promise<ApiResponse> => {
        const instructorId = parseInt(req.params?.id || '0')
        const { page, limit } = req.query || {}

        if (!instructorId) {
            throw new ValidationError('無效的講師 ID')
        }

        const instructor = await instructorRepo.findById(instructorId)
        if (!instructor) {
            throw new NotFoundError('講師不存在')
        }

        const result = await ratingRepo.getInstructorRatings(
            instructorId,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10
        )

        return {
            success: true,
            data: result.data,
            meta: result.meta
        }
    })

    // Get instructor statistics
    router.get('/api/v1/instructors/:id/stats', async (req: ApiRequest): Promise<ApiResponse> => {
        const instructorId = parseInt(req.params?.id || '0')

        if (!instructorId) {
            throw new ValidationError('無效的講師 ID')
        }

        const instructor = await instructorRepo.findById(instructorId)
        if (!instructor) {
            throw new NotFoundError('講師不存在')
        }

        // Get course count
        const { db } = await import('../utils/database')
        const courseCount = await db.queryOne<{ count: string }>({
            text: 'SELECT COUNT(*) as count FROM courses WHERE instructor_id = $1',
            values: [instructor.user_id]
        })

        // Get student count (unique students enrolled in instructor's courses)
        const studentCount = await db.queryOne<{ count: string }>({
            text: `
                SELECT COUNT(DISTINCT ce.user_id) as count
                FROM course_enrollments ce
                JOIN courses c ON ce.course_id = c.id
                WHERE c.instructor_id = $1
            `,
            values: [instructor.user_id]
        })

        return {
            success: true,
            data: {
                instructor_id: instructorId,
                average_rating: instructor.average_rating,
                total_ratings: instructor.total_ratings,
                rating_on_100_scale: instructor.average_rating * 20,
                total_courses: parseInt(courseCount?.count || '0', 10),
                total_students: parseInt(studentCount?.count || '0', 10),
                is_active: instructor.is_active,
                application_status: instructor.application_status
            }
        }
    })
}
