/**
 * 場地管理路由
 * 處理練習場地的創建、更新、刪除等操作
 */

import { NotFoundError, ValidationError } from '../errors'
import { withAuth, withRole } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { PracticeVenueRepository } from './repositories'
import type { CreateVenueRequest, UpdateVenueRequest } from './types'

// Repository實例
const venueRepo = new PracticeVenueRepository()

export function setupVenueManagementRoutes(router: ApiRouter): void {
  // 獲取所有場地
  router.get('/venues', async (req: ApiRequest): Promise<ApiResponse> => {
    const query = req.query as Record<string, string | string[] | undefined>
    const { location, min_capacity, facilities, search, is_active } = query

    let venues
    if (search) {
      venues = await venueRepo.search(search as string)
    } else if (location) {
      venues = await venueRepo.findByLocation(location as string)
    } else if (min_capacity) {
      venues = await venueRepo.findByCapacity(parseInt(min_capacity as string))
    } else if (facilities && Array.isArray(facilities)) {
      venues = await venueRepo.findByFacilities(facilities as string[])
    } else {
      venues = await venueRepo.findActive()
    }

    // 應用額外篩選
    if (is_active !== undefined) {
      const activeFilter = is_active === 'true'
      venues = venues.filter(v => v.isActive === activeFilter)
    }

    return {
      success: true,
      data: venues
    }
  })

  // 獲取場地詳情
  router.get('/venues/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    const params = req.params as Record<string, string>
    const { id } = params
    const venueId = parseInt(id!)

    if (isNaN(venueId)) {
      throw new ValidationError('Invalid venue ID')
    }

    const venue = await venueRepo.findById(venueId)
    if (!venue) {
      throw new NotFoundError('Venue not found')
    }

    return {
      success: true,
      data: venue
    }
  })

  // 創建場地
  router.post(
    '/venues',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const {
        name,
        location,
        capacity,
        facilities,
        description,
        hourlyRate,
        isActive
      }: CreateVenueRequest = req.body as CreateVenueRequest

      if (!name || !location || !capacity) {
        throw new ValidationError('Name, location, and capacity are required')
      }

      const venueData = {
        name,
        location,
        capacity: parseInt(capacity.toString()),
        facilities: facilities ?? [],
        description: description ?? '',
        availableHours: '09:00-18:00', // 默認營業時間
        hourlyRate: hourlyRate ?? 0,
        isActive: isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const venue = await venueRepo.create(venueData)

      return {
        success: true,
        data: venue
      }
    })
  )

  // 更新場地
  router.put(
    '/venues/:id',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const venueId = parseInt(id!)
      const {
        name,
        location,
        capacity,
        facilities,
        description,
        hourlyRate,
        isActive
      }: UpdateVenueRequest = req.body as UpdateVenueRequest

      if (isNaN(venueId)) {
        throw new ValidationError('Invalid venue ID')
      }

      const venue = await venueRepo.findById(venueId)
      if (!venue) {
        throw new NotFoundError('Venue not found')
      }

      const updateData = {
        name: name || venue.name,
        location: location || venue.location,
        capacity: capacity !== undefined ? parseInt(capacity.toString()) : venue.capacity,
        facilities: facilities || venue.facilities,
        description: description || venue.description,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : venue.hourlyRate,
        isActive: isActive !== undefined ? isActive : venue.isActive,
        updatedAt: new Date()
      }

      const updatedVenue = await venueRepo.update(venueId, updateData)

      return {
        success: true,
        data: updatedVenue
      }
    })
  )

  // 刪除場地
  router.delete(
    '/venues/:id',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const venueId = parseInt(id!)

      if (isNaN(venueId)) {
        throw new ValidationError('Invalid venue ID')
      }

      const venue = await venueRepo.findById(venueId)
      if (!venue) {
        throw new NotFoundError('Venue not found')
      }

      await venueRepo.delete(venueId)

      return {
        success: true,
        data: { message: 'Venue deleted successfully' }
      }
    })
  )

  // 切換場地狀態
  router.put(
    '/venues/:id/toggle-status',
    withRole('admin', async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const venueId = parseInt(id!)

      if (isNaN(venueId)) {
        throw new ValidationError('Invalid venue ID')
      }

      const venue = await venueRepo.findById(venueId)
      if (!venue) {
        throw new NotFoundError('Venue not found')
      }

      const updateData = {
        isActive: !venue.isActive,
        updatedAt: new Date()
      }

      const updatedVenue = await venueRepo.update(venueId, updateData)

      return {
        success: true,
        data: updatedVenue
      }
    })
  )

  // 獲取場地統計
  router.get(
    '/venues/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await venueRepo.getVenueStats()

      return {
        success: true,
        data: stats
      }
    })
  )
}
