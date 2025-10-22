/**
 * 支援服務功能Repository類別
 * 提供數據庫操作接口
 */

import { BaseRepository } from '../database'

import type {
  PracticeVenue,
  VenueBooking,
  RetrainingRecommendation,
  InstructorDevelopment,
  VenueStats,
  BookingStats,
  RecommendationStats,
  DevelopmentStats
} from './types'

// 練習場地Repository
export class PracticeVenueRepository extends BaseRepository<PracticeVenue> {
  constructor() {
    super('practice_venues')
  }

  // 根據位置查找場地
  async findByLocation(location: string): Promise<PracticeVenue[]> {
    return this.queryMany(
      'SELECT * FROM practice_venues WHERE location ILIKE $1 AND is_active = true ORDER BY name',
      [`%${location}%`]
    )
  }

  // 根據容量查找場地
  async findByCapacity(minCapacity: number): Promise<PracticeVenue[]> {
    return this.queryMany(
      'SELECT * FROM practice_venues WHERE capacity >= $1 AND is_active = true ORDER BY capacity',
      [minCapacity]
    )
  }

  // 根據設施查找場地
  async findByFacilities(facilities: string[]): Promise<PracticeVenue[]> {
    const facilityConditions = facilities
      .map((_, index) => `facilities @> $${index + 1}`)
      .join(' AND ')
    return this.queryMany(
      `SELECT * FROM practice_venues WHERE ${facilityConditions} AND is_active = true ORDER BY name`,
      facilities
    )
  }

  // 搜索場地
  async search(searchTerm: string): Promise<PracticeVenue[]> {
    return this.queryMany(
      `SELECT * FROM practice_venues 
       WHERE (name ILIKE $1 OR description ILIKE $1 OR location ILIKE $1) 
       AND is_active = true 
       ORDER BY name`,
      [`%${searchTerm}%`]
    )
  }

  // 獲取活躍場地
  async findActive(): Promise<PracticeVenue[]> {
    return this.queryMany('SELECT * FROM practice_venues WHERE is_active = true ORDER BY name')
  }

  // 獲取場地統計
  async getStats(): Promise<VenueStats> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total_venues,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active_venues,
         (SELECT COUNT(*) FROM venue_bookings) as total_bookings,
         (SELECT COUNT(*) FROM venue_bookings WHERE status = 'pending') as pending_bookings,
         COALESCE(
           (SELECT AVG(EXTRACT(EPOCH FROM (end_time::time - start_time::time))/3600) 
            FROM venue_bookings WHERE status = 'completed'), 0
         ) as average_utilization
       FROM practice_venues`
    )

    return {
      totalVenues: parseInt(result?.total_venues || '0'),
      activeVenues: parseInt(result?.active_venues || '0'),
      totalBookings: parseInt(result?.total_bookings || '0'),
      pendingBookings: parseInt(result?.pending_bookings || '0'),
      averageUtilization: parseFloat(result?.average_utilization || '0')
    }
  }

  // 獲取場地統計（別名方法）
  async getVenueStats(): Promise<VenueStats> {
    return this.getStats()
  }
}

// 場地預約Repository
export class VenueBookingRepository extends BaseRepository<VenueBooking> {
  constructor() {
    super('venue_bookings')
  }

  // 根據場地ID查找預約
  async findByVenue(venueId: number): Promise<VenueBooking[]> {
    return this.queryMany(
      'SELECT * FROM venue_bookings WHERE venue_id = $1 ORDER BY booking_date, start_time',
      [venueId]
    )
  }

  // 根據用戶ID查找預約
  async findByUser(userId: number): Promise<VenueBooking[]> {
    return this.queryMany(
      'SELECT * FROM venue_bookings WHERE user_id = $1 ORDER BY booking_date DESC',
      [userId]
    )
  }

  // 根據日期範圍查找預約
  async findByDateRange(startDate: string, endDate: string): Promise<VenueBooking[]> {
    return this.queryMany(
      'SELECT * FROM venue_bookings WHERE booking_date BETWEEN $1 AND $2 ORDER BY booking_date, start_time',
      [startDate, endDate]
    )
  }

  // 檢查時間衝突
  async checkTimeConflict(
    venueId: number,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): Promise<boolean> {
    let query = `
      SELECT 1 FROM venue_bookings 
      WHERE venue_id = $1 AND booking_date = $2 
      AND status IN ('pending', 'confirmed')
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
    `
    const params = [venueId, bookingDate, startTime, endTime]

    if (excludeId) {
      query += ' AND id != $5'
      params.push(excludeId)
    }

    const result = await this.queryOne(query, params)
    return !!result
  }

  // 獲取預約統計
  async getStats(): Promise<BookingStats> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total_bookings,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
         COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
         COALESCE(AVG(EXTRACT(EPOCH FROM (end_time::time - start_time::time))/3600), 0) as average_duration
       FROM venue_bookings`
    )

    return {
      totalBookings: parseInt(result?.total_bookings || '0'),
      confirmedBookings: parseInt(result?.confirmed_bookings || '0'),
      cancelledBookings: parseInt(result?.cancelled_bookings || '0'),
      completedBookings: parseInt(result?.completed_bookings || '0'),
      averageBookingDuration: parseFloat(result?.average_duration || '0')
    }
  }

  // 更新預約狀態
  async updateStatus(bookingId: number, status: string): Promise<void> {
    await this.executeRaw(
      'UPDATE venue_bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, bookingId]
    )
  }

  // 查找衝突的預約
  async findConflictingBookings(
    venueId: number,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): Promise<VenueBooking[]> {
    let query = `
      SELECT * FROM venue_bookings 
      WHERE venue_id = $1 AND booking_date = $2 
      AND status IN ('pending', 'confirmed')
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
    `
    const params = [venueId, bookingDate, startTime, endTime]

    if (excludeId) {
      query += ' AND id != $5'
      params.push(excludeId)
    }

    return this.queryMany(query, params)
  }

  // 獲取場地可用性
  async getVenueAvailability(venueId: number, date: string): Promise<any> {
    const bookings = await this.queryMany(
      `SELECT start_time, end_time FROM venue_bookings 
       WHERE venue_id = $1 AND booking_date = $2 
       AND status IN ('confirmed', 'pending')
       ORDER BY start_time`,
      [venueId, date]
    )

    return {
      date,
      venueId,
      bookedSlots: bookings.map(booking => ({
        startTime: booking.start_time,
        endTime: booking.end_time
      }))
    }
  }

  // 獲取預約統計（別名方法）
  async getBookingStats(): Promise<BookingStats> {
    return this.getStats()
  }
}

// 再培訓建議Repository
export class RetrainingRecommendationRepository extends BaseRepository<RetrainingRecommendation> {
  constructor() {
    super('retraining_recommendations')
  }

  // 根據用戶ID查找建議
  async findByUser(userId: number): Promise<RetrainingRecommendation[]> {
    return this.queryMany(
      'SELECT * FROM retraining_recommendations WHERE user_id = $1 ORDER BY recommended_at DESC',
      [userId]
    )
  }

  // 根據課程ID查找建議
  async findByCourse(courseId: number): Promise<RetrainingRecommendation[]> {
    return this.queryMany(
      'SELECT * FROM retraining_recommendations WHERE course_id = $1 ORDER BY recommended_at DESC',
      [courseId]
    )
  }

  // 根據優先級查找建議
  async findByPriority(priority: string): Promise<RetrainingRecommendation[]> {
    return this.queryMany(
      'SELECT * FROM retraining_recommendations WHERE priority = $1 ORDER BY recommended_at DESC',
      [priority]
    )
  }

  // 根據狀態查找建議
  async findByStatus(status: string): Promise<RetrainingRecommendation[]> {
    return this.queryMany(
      'SELECT * FROM retraining_recommendations WHERE status = $1 ORDER BY recommended_at DESC',
      [status]
    )
  }

  // 獲取過期建議
  async findExpired(): Promise<RetrainingRecommendation[]> {
    return this.queryMany(
      "SELECT * FROM retraining_recommendations WHERE expires_at < NOW() AND status = 'pending' ORDER BY expires_at"
    )
  }

  // 獲取建議統計
  async getStats(): Promise<RecommendationStats> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total_recommendations,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_recommendations,
         COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_recommendations,
         COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_recommendations,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_recommendations
       FROM retraining_recommendations`
    )

    return {
      totalRecommendations: parseInt(result?.total_recommendations || '0'),
      pendingRecommendations: parseInt(result?.pending_recommendations || '0'),
      acceptedRecommendations: parseInt(result?.accepted_recommendations || '0'),
      declinedRecommendations: parseInt(result?.declined_recommendations || '0'),
      completedRecommendations: parseInt(result?.completed_recommendations || '0')
    }
  }

  // 更新建議狀態
  async updateStatus(recommendationId: number, status: string): Promise<void> {
    await this.executeRaw('UPDATE retraining_recommendations SET status = $1 WHERE id = $2', [
      status,
      recommendationId
    ])
  }

  // 獲取建議統計（別名方法）
  async getRecommendationStats(): Promise<RecommendationStats> {
    return this.getStats()
  }
}

// 講師發展Repository
export class InstructorDevelopmentRepository extends BaseRepository<InstructorDevelopment> {
  constructor() {
    super('instructor_developments')
  }

  // 根據用戶ID查找發展計劃
  async findByUser(userId: number): Promise<InstructorDevelopment[]> {
    return this.queryMany(
      'SELECT * FROM instructor_developments WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    )
  }

  // 根據發展類型查找
  async findByType(developmentType: string): Promise<InstructorDevelopment[]> {
    return this.queryMany(
      'SELECT * FROM instructor_developments WHERE development_type = $1 ORDER BY start_date DESC',
      [developmentType]
    )
  }

  // 根據狀態查找
  async findByStatus(status: string): Promise<InstructorDevelopment[]> {
    return this.queryMany(
      'SELECT * FROM instructor_developments WHERE status = $1 ORDER BY start_date DESC',
      [status]
    )
  }

  // 根據日期範圍查找
  async findByDateRange(startDate: string, endDate: string): Promise<InstructorDevelopment[]> {
    return this.queryMany(
      'SELECT * FROM instructor_developments WHERE start_date BETWEEN $1 AND $2 ORDER BY start_date',
      [startDate, endDate]
    )
  }

  // 獲取發展統計
  async getStats(): Promise<DevelopmentStats> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total_developments,
         COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_developments,
         COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_developments,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_developments,
         COALESCE(SUM(cost), 0) as total_cost
       FROM instructor_developments`
    )

    return {
      totalDevelopments: parseInt(result?.total_developments || '0'),
      plannedDevelopments: parseInt(result?.planned_developments || '0'),
      inProgressDevelopments: parseInt(result?.in_progress_developments || '0'),
      completedDevelopments: parseInt(result?.completed_developments || '0'),
      totalCost: parseFloat(result?.total_cost || '0')
    }
  }

  // 更新發展狀態
  async updateStatus(developmentId: number, status: string): Promise<void> {
    await this.executeRaw(
      'UPDATE instructor_developments SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, developmentId]
    )
  }

  // 獲取發展統計（別名方法）
  async getDevelopmentStats(): Promise<DevelopmentStats> {
    return this.getStats()
  }
}
