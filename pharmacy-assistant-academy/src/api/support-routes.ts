// support-routes.ts
// 後續支援服務 API 路由

import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse, PaginationOptions } from './types'
import { BaseRepository } from './database'
import { ValidationError, NotFoundError, UnauthorizedError } from './errors'
import { requireAuth } from './auth-middleware'

// 資料類型定義
interface PracticeVenue {
    id: number
    name: string
    description: string
    location: string
    capacity: number
    facilities: string[]
    availableHours: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

interface VenueBooking {
    id: number
    venueId: number
    userId: number
    bookingDate: Date
    startTime: string
    endTime: string
    purpose: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    createdAt: Date
    updatedAt: Date
}

interface RetrainingRecommendation {
    id: number
    userId: number
    courseId: number
    recommendationReason: string
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'accepted' | 'declined' | 'completed'
    recommendedAt: Date
    expiresAt: Date | null
}

interface InstructorDevelopment {
    id: number
    userId: number
    currentStage: 'interested' | 'training' | 'assistant' | 'certified' | 'senior'
    applicationStatus: 'pending' | 'approved' | 'rejected' | 'in_progress'
    teachingHours: number
    studentRating: number | null
    certifications: string[]
    notes: string
    appliedAt: Date
    updatedAt: Date
}

// Repository 類別
class PracticeVenueRepository extends BaseRepository<PracticeVenue> {
    constructor() {
        super('practice_venues')
    }

    async findAvailable(date: Date): Promise<PracticeVenue[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<PracticeVenue>({
            text: `
                SELECT * FROM practice_venues 
                WHERE is_active = true
                ORDER BY name ASC
            `,
            values: []
        })
    }
}

class VenueBookingRepository extends BaseRepository<VenueBooking> {
    constructor() {
        super('venue_bookings')
    }

    async findByUser(userId: number): Promise<VenueBooking[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<VenueBooking>({
            text: `
                SELECT * FROM venue_bookings 
                WHERE user_id = $1 
                ORDER BY booking_date DESC, start_time DESC
            `,
            values: [userId]
        })
    }

    async findByVenueAndDate(venueId: number, date: Date): Promise<VenueBooking[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<VenueBooking>({
            text: `
                SELECT * FROM venue_bookings 
                WHERE venue_id = $1 AND booking_date = $2 AND status != 'cancelled'
                ORDER BY start_time ASC
            `,
            values: [venueId, date]
        })
    }

    async checkConflict(venueId: number, date: Date, startTime: string, endTime: string, excludeId?: number): Promise<boolean> {
        const { db } = await import('../utils/database')
        const query = excludeId
            ? `SELECT EXISTS(
                SELECT 1 FROM venue_bookings 
                WHERE venue_id = $1 AND booking_date = $2 
                AND status != 'cancelled'
                AND id != $5
                AND (
                    (start_time <= $3 AND end_time > $3) OR
                    (start_time < $4 AND end_time >= $4) OR
                    (start_time >= $3 AND end_time <= $4)
                )
            )`
            : `SELECT EXISTS(
                SELECT 1 FROM venue_bookings 
                WHERE venue_id = $1 AND booking_date = $2 
                AND status != 'cancelled'
                AND (
                    (start_time <= $3 AND end_time > $3) OR
                    (start_time < $4 AND end_time >= $4) OR
                    (start_time >= $3 AND end_time <= $4)
                )
            )`

        const values = excludeId
            ? [venueId, date, startTime, endTime, excludeId]
            : [venueId, date, startTime, endTime]

        const result = await db.queryOne<{ exists: boolean }>({
            text: query,
            values
        })
        return result?.exists || false
    }
}

class RetrainingRecommendationRepository extends BaseRepository<RetrainingRecommendation> {
    constructor() {
        super('retraining_recommendations')
    }

    async findByUser(userId: number): Promise<RetrainingRecommendation[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<RetrainingRecommendation>({
            text: `
                SELECT rr.*, c.title as course_title, c.description as course_description
                FROM retraining_recommendations rr
                LEFT JOIN courses c ON rr.course_id = c.id
                WHERE rr.user_id = $1 
                ORDER BY 
                    CASE rr.priority 
                        WHEN 'high' THEN 1 
                        WHEN 'medium' THEN 2 
                        WHEN 'low' THEN 3 
                    END,
                    rr.recommended_at DESC
            `,
            values: [userId]
        })
    }

    async generateRecommendations(userId: number): Promise<RetrainingRecommendation[]> {
        // 基於用戶學習歷史和就業狀態生成推薦
        const { db } = await import('../utils/database')

        // 獲取用戶已完成的課程
        const completedCourses = await db.queryMany<{ courseId: number }>({
            text: `
                SELECT course_id FROM course_enrollments 
                WHERE user_id = $1 AND status = 'completed'
            `,
            values: [userId]
        })

        const completedCourseIds = completedCourses.map(c => c.courseId)

        // 找出用戶尚未學習的進階課程
        const recommendedCourses = await db.queryMany<{ id: number; title: string }>({
            text: `
                SELECT id, title FROM courses 
                WHERE course_type = 'advanced' 
                AND is_active = true
                ${completedCourseIds.length > 0 ? `AND id NOT IN (${completedCourseIds.join(',')})` : ''}
                LIMIT 5
            `,
            values: []
        })

        // 創建推薦記錄
        const recommendations: RetrainingRecommendation[] = []
        for (const course of recommendedCourses) {
            const rec = await this.create({
                userId,
                courseId: course.id,
                recommendationReason: `基於您的學習歷程，推薦您學習「${course.title}」以提升專業技能`,
                priority: 'medium',
                status: 'pending',
                recommendedAt: new Date(),
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90天後過期
            } as any)
            recommendations.push(rec)
        }

        return recommendations
    }
}

class InstructorDevelopmentRepository extends BaseRepository<InstructorDevelopment> {
    constructor() {
        super('instructor_development')
    }

    async findByUser(userId: number): Promise<InstructorDevelopment | null> {
        const { db } = await import('../utils/database')
        return await db.queryOne<InstructorDevelopment>({
            text: 'SELECT * FROM instructor_development WHERE user_id = $1',
            values: [userId]
        })
    }

    async updateTeachingHours(userId: number, hours: number): Promise<void> {
        const { db } = await import('../utils/database')
        await db.query({
            text: `
                UPDATE instructor_development 
                SET teaching_hours = teaching_hours + $2, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
            `,
            values: [userId, hours]
        })
    }

    async updateRating(userId: number, rating: number): Promise<void> {
        const { db } = await import('../utils/database')
        await db.query({
            text: `
                UPDATE instructor_development 
                SET student_rating = $2, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
            `,
            values: [userId, rating]
        })
    }
}

// Repository 實例
const venueRepo = new PracticeVenueRepository()
const bookingRepo = new VenueBookingRepository()
const recommendationRepo = new RetrainingRecommendationRepository()
const instructorDevRepo = new InstructorDevelopmentRepository()

// Setup support routes
export function setupSupportRoutes(router: ApiRouter): void {
    // ===== 練習場地 API =====

    // 獲取所有可用場地
    router.get('/api/v1/venues', async (req: ApiRequest): Promise<ApiResponse> => {
        const { date } = req.query || {}

        const venues = date
            ? await venueRepo.findAvailable(new Date(date as string))
            : await venueRepo.findAll({ isActive: true })

        return {
            success: true,
            data: venues
        }
    })

    // 獲取場地詳情
    router.get('/api/v1/venues/:id', async (req: ApiRequest): Promise<ApiResponse> => {
        const venueId = Number(req.params?.id)

        const venue = await venueRepo.findById(venueId)
        if (!venue) {
            throw new NotFoundError('場地不存在')
        }

        return {
            success: true,
            data: venue
        }
    })

    // 獲取場地預約情況
    router.get('/api/v1/venues/:id/bookings', async (req: ApiRequest): Promise<ApiResponse> => {
        const venueId = Number(req.params?.id)
        const { date } = req.query || {}

        if (!date) {
            throw new ValidationError('請提供查詢日期')
        }

        const bookings = await bookingRepo.findByVenueAndDate(venueId, new Date(date as string))

        return {
            success: true,
            data: bookings
        }
    })

    // 創建場地預約
    router.post('/api/v1/venues/:id/bookings', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const venueId = Number(req.params?.id)
        const { bookingDate, startTime, endTime, purpose } = req.body as any

        if (!bookingDate || !startTime || !endTime) {
            throw new ValidationError('預約日期、開始時間和結束時間為必填項')
        }

        // 檢查場地是否存在
        const venue = await venueRepo.findById(venueId)
        if (!venue || !venue.isActive) {
            throw new NotFoundError('場地不存在或已停用')
        }

        // 檢查時間衝突
        const hasConflict = await bookingRepo.checkConflict(
            venueId,
            new Date(bookingDate),
            startTime,
            endTime
        )

        if (hasConflict) {
            throw new ValidationError('該時段已被預約，請選擇其他時段')
        }

        // 創建預約
        const booking = await bookingRepo.create({
            venueId,
            userId: req.user.id,
            bookingDate: new Date(bookingDate),
            startTime,
            endTime,
            purpose: purpose || '',
            status: 'pending'
        } as any)

        return {
            success: true,
            data: booking
        }
    }, [requireAuth])

    // 獲取用戶的預約記錄
    router.get('/api/v1/bookings/my-bookings', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const bookings = await bookingRepo.findByUser(req.user.id)

        return {
            success: true,
            data: bookings
        }
    }, [requireAuth])

    // 取消預約
    router.patch('/api/v1/bookings/:id/cancel', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const bookingId = Number(req.params?.id)

        const booking = await bookingRepo.findById(bookingId)
        if (!booking) {
            throw new NotFoundError('預約不存在')
        }

        if (booking.userId !== req.user.id) {
            throw new UnauthorizedError('您無權取消此預約')
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            throw new ValidationError('該預約無法取消')
        }

        const updated = await bookingRepo.update(bookingId, { status: 'cancelled' })

        return {
            success: true,
            data: updated
        }
    }, [requireAuth])

    // ===== 再培訓課程推薦 API =====

    // 獲取用戶的課程推薦
    router.get('/api/v1/recommendations/my-recommendations', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const recommendations = await recommendationRepo.findByUser(req.user.id)

        return {
            success: true,
            data: recommendations
        }
    }, [requireAuth])

    // 生成個性化課程推薦
    router.post('/api/v1/recommendations/generate', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const recommendations = await recommendationRepo.generateRecommendations(req.user.id)

        return {
            success: true,
            data: recommendations
        }
    }, [requireAuth])

    // 接受課程推薦
    router.patch('/api/v1/recommendations/:id/accept', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const recommendationId = Number(req.params?.id)

        const recommendation = await recommendationRepo.findById(recommendationId)
        if (!recommendation) {
            throw new NotFoundError('推薦不存在')
        }

        if (recommendation.userId !== req.user.id) {
            throw new UnauthorizedError('您無權操作此推薦')
        }

        const updated = await recommendationRepo.update(recommendationId, { status: 'accepted' })

        return {
            success: true,
            data: updated
        }
    }, [requireAuth])

    // 拒絕課程推薦
    router.patch('/api/v1/recommendations/:id/decline', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const recommendationId = Number(req.params?.id)

        const recommendation = await recommendationRepo.findById(recommendationId)
        if (!recommendation) {
            throw new NotFoundError('推薦不存在')
        }

        if (recommendation.userId !== req.user.id) {
            throw new UnauthorizedError('您無權操作此推薦')
        }

        const updated = await recommendationRepo.update(recommendationId, { status: 'declined' })

        return {
            success: true,
            data: updated
        }
    }, [requireAuth])

    // ===== 講師發展路徑 API =====

    // 申請成為講師
    router.post('/api/v1/instructor-development/apply', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        // 檢查是否已經申請過
        const existing = await instructorDevRepo.findByUser(req.user.id)
        if (existing) {
            throw new ValidationError('您已經提交過講師申請')
        }

        const { certifications, notes } = req.body as any

        const application = await instructorDevRepo.create({
            userId: req.user.id,
            currentStage: 'interested',
            applicationStatus: 'pending',
            teachingHours: 0,
            studentRating: null,
            certifications: certifications || [],
            notes: notes || '',
            appliedAt: new Date()
        } as any)

        return {
            success: true,
            data: application
        }
    }, [requireAuth])

    // 獲取講師發展狀態
    router.get('/api/v1/instructor-development/status', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const development = await instructorDevRepo.findByUser(req.user.id)

        if (!development) {
            return {
                success: true,
                data: null
            }
        }

        return {
            success: true,
            data: development
        }
    }, [requireAuth])

    // 更新講師發展階段（管理員功能）
    router.patch('/api/v1/instructor-development/:id/stage', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        // TODO: 添加管理員權限檢查

        const developmentId = Number(req.params?.id)
        const { currentStage, applicationStatus } = req.body as any

        const updated = await instructorDevRepo.update(developmentId, {
            currentStage,
            applicationStatus
        })

        return {
            success: true,
            data: updated
        }
    }, [requireAuth])

    // 記錄教學時數
    router.post('/api/v1/instructor-development/log-hours', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const { hours } = req.body as any

        if (!hours || hours <= 0) {
            throw new ValidationError('請提供有效的教學時數')
        }

        await instructorDevRepo.updateTeachingHours(req.user.id, hours)

        const updated = await instructorDevRepo.findByUser(req.user.id)

        return {
            success: true,
            data: updated
        }
    }, [requireAuth])
}
