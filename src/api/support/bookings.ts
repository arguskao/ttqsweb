/**
 * 場地預約路由
 * 處理場地預約的創建、更新、取消等操作
 */

import { validateIntParam } from '../../utils/param-validation'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { VenueBookingRepository, PracticeVenueRepository } from './repositories'
import type { CreateBookingRequest, UpdateBookingRequest } from './types'

// Repository實例
const bookingRepo = new VenueBookingRepository()
const venueRepo = new PracticeVenueRepository()

export function setupVenueBookingRoutes(router: ApiRouter): void {
  // 獲取所有預約
  router.get(
    '/bookings',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { venue_id, user_id, status, date_from, date_to } = query

      let bookings
      if (venue_id) {
        bookings = await bookingRepo.findByVenue(parseInt(venue_id as string))
      } else if (user_id) {
        bookings = await bookingRepo.findByUser(parseInt(user_id as string))
      } else if (date_from && date_to) {
        bookings = await bookingRepo.findByDateRange(date_from as string, date_to as string)
      } else {
        // 普通用戶只能看到自己的預約
        if (req.user!.userType !== 'admin') {
          bookings = await bookingRepo.findByUser(req.user!.id)
        } else {
          bookings = await bookingRepo.findAll()
        }
      }

      // 應用額外篩選
      if (status) {
        bookings = bookings.filter(b => b.status === status)
      }

      return {
        success: true,
        data: bookings
      }
    })
  )

  // 獲取預約詳情
  router.get(
    '/bookings/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const bookingId = validateIntParam(id, 'booking ID')

      const booking = await bookingRepo.findById(bookingId)
      if (!booking) {
        throw new NotFoundError('Booking not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && booking.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot view this booking')
      }

      return {
        success: true,
        data: booking
      }
    })
  )

  // 創建預約
  router.post(
    '/bookings',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const { venueId, startTime, endTime, purpose, notes }: CreateBookingRequest =
        req.body as CreateBookingRequest

      if (!venueId || !startTime || !endTime) {
        throw new ValidationError('Venue ID, start time, and end time are required')
      }

      // 檢查場地是否存在
      const venue = await venueRepo.findById(venueId)
      if (!venue) {
        throw new NotFoundError('Venue not found')
      }

      // 檢查場地是否可用
      if (!venue.isActive) {
        throw new ValidationError('Venue is not available for booking')
      }

      // 檢查時間衝突
      const bookingDate = new Date(startTime).toISOString().split('T')[0]
      const conflictingBookings = await bookingRepo.findConflictingBookings(
        venueId,
        bookingDate || '',
        startTime || '',
        endTime || ''
      )
      if (conflictingBookings.length > 0) {
        throw new ValidationError('Time slot is already booked')
      }

      const bookingData = {
        venueId,
        userId: req.user!.id,
        bookingDate: new Date(startTime),
        startTime: startTime,
        endTime: endTime,
        purpose: purpose ?? '',
        notes: notes ?? '',
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const booking = await bookingRepo.create(bookingData)

      return {
        success: true,
        data: booking
      }
    })
  )

  // 更新預約
  router.put(
    '/bookings/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const bookingId = validateIntParam(id, 'booking ID')
      const { startTime, endTime, purpose, notes, status }: UpdateBookingRequest =
        req.body as UpdateBookingRequest

      const booking = await bookingRepo.findById(bookingId)
      if (!booking) {
        throw new NotFoundError('Booking not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && booking.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this booking')
      }

      // 檢查時間衝突（如果時間有變更）
      if (startTime && endTime) {
        const bookingDate = new Date(startTime).toISOString().split('T')[0]
        const conflictingBookings = await bookingRepo.findConflictingBookings(
          booking.venueId,
          bookingDate || '',
          startTime || '',
          endTime || '',
          bookingId
        )
        const otherConflicts = conflictingBookings.filter(b => b.id !== bookingId)
        if (otherConflicts.length > 0) {
          throw new ValidationError('Time slot is already booked')
        }
      }

      const updateData = {
        startTime: startTime || booking.startTime,
        endTime: endTime || booking.endTime,
        purpose: purpose || booking.purpose,
        notes: notes || booking.notes,
        status: (status || booking.status) as 'completed' | 'pending' | 'cancelled' | 'confirmed',
        updatedAt: new Date()
      }

      const updatedBooking = await bookingRepo.update(bookingId, updateData)

      return {
        success: true,
        data: updatedBooking
      }
    })
  )

  // 取消預約
  router.put(
    '/bookings/:id/cancel',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const bookingId = validateIntParam(id, 'booking ID')

      const booking = await bookingRepo.findById(bookingId)
      if (!booking) {
        throw new NotFoundError('Booking not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && booking.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot cancel this booking')
      }

      // 檢查是否可以取消
      if (booking.status === 'cancelled') {
        throw new ValidationError('Booking is already cancelled')
      }

      const updateData = {
        status: 'cancelled' as const,
        updatedAt: new Date()
      }

      const updatedBooking = await bookingRepo.update(bookingId, updateData)

      return {
        success: true,
        data: updatedBooking
      }
    })
  )

  // 刪除預約
  router.delete(
    '/bookings/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const bookingId = validateIntParam(id, 'booking ID')

      const booking = await bookingRepo.findById(bookingId)
      if (!booking) {
        throw new NotFoundError('Booking not found')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && booking.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot delete this booking')
      }

      await bookingRepo.delete(bookingId)

      return {
        success: true,
        data: { message: 'Booking deleted successfully' }
      }
    })
  )

  // 獲取場地可用時間
  router.get('/venues/:venueId/availability', async (req: ApiRequest): Promise<ApiResponse> => {
    const params = req.params as Record<string, string>
    const { venueId } = params
    const targetVenueId = validateIntParam(venueId, 'venue ID')
    const query = req.query as Record<string, string | string[] | undefined>
    const { date } = query

    if (isNaN(targetVenueId)) {
      throw new ValidationError('Invalid venue ID')
    }

    if (!date) {
      throw new ValidationError('Date is required')
    }

    const venue = await venueRepo.findById(targetVenueId)
    if (!venue) {
      throw new NotFoundError('Venue not found')
    }

    const availability = await bookingRepo.getVenueAvailability(targetVenueId, date as string)

    return {
      success: true,
      data: availability
    }
  })

  // 獲取預約統計
  router.get(
    '/bookings/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await bookingRepo.getBookingStats()

      return {
        success: true,
        data: stats
      }
    })
  )
}
