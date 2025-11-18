/**
 * 支援服務功能類型定義
 * 定義所有支援服務相關的TypeScript接口
 */

// 練習場地
export interface PracticeVenue {
  id: number
  name: string
  description: string
  location: string
  capacity: number
  facilities: string[]
  availableHours: string
  hourlyRate?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 場地預約
export interface VenueBooking {
  id: number
  venueId: number
  userId: number
  bookingDate: Date
  startTime: string
  endTime: string
  purpose: string
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: Date
  updatedAt: Date
}

// 再培訓建議
export interface RetrainingRecommendation {
  id: number
  userId: number
  courseId: number
  recommendationReason: string
  reason?: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  recommendedAt: Date
  expiresAt: Date | null
  deadline?: Date | null
  notes?: string
}

// 講師發展
export interface InstructorDevelopment {
  id: number
  userId: number
  developmentType: 'training' | 'certification' | 'mentorship' | 'research'
  title: string
  description: string
  objectives?: any
  resources?: any
  milestones?: any
  startDate: Date
  endDate: Date | null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  cost: number | null
  fundingSource: string | null
  createdAt: Date
  updatedAt: Date
}

// 場地創建請求
export interface CreateVenueRequest {
  name: string
  description: string
  location: string
  capacity: number
  facilities: string[]
  availableHours: string
  hourlyRate?: number
  isActive?: boolean
}

// 場地更新請求
export interface UpdateVenueRequest {
  name?: string
  description?: string
  location?: string
  capacity?: number
  facilities?: string[]
  availableHours?: string
  hourlyRate?: number
  isActive?: boolean
}

// 場地預約請求
export interface CreateBookingRequest {
  venueId: number
  bookingDate: string
  startTime: string
  endTime: string
  purpose: string
  notes?: string
}

// 場地預約更新請求
export interface UpdateBookingRequest {
  bookingDate?: string
  startTime?: string
  endTime?: string
  purpose?: string
  notes?: string
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

// 再培訓建議創建請求
export interface CreateRecommendationRequest {
  userId: number
  courseId: number
  recommendationReason: string
  reason?: string
  priority: 'high' | 'medium' | 'low'
  expiresAt?: string
  deadline?: string
  notes?: string
}

// 再培訓建議更新請求
export interface UpdateRecommendationRequest {
  reason?: string
  priority?: 'high' | 'medium' | 'low'
  deadline?: string
  notes?: string
  status?: 'pending' | 'accepted' | 'declined' | 'completed'
}

// 講師發展創建請求
export interface CreateDevelopmentRequest {
  userId: number
  developmentType: 'training' | 'certification' | 'mentorship' | 'research'
  title: string
  description: string
  objectives?: any
  resources?: any
  milestones?: any
  startDate: string
  endDate?: string
  cost?: number
  fundingSource?: string
}

// 講師發展更新請求
export interface UpdateDevelopmentRequest {
  title?: string
  description?: string
  objectives?: any
  resources?: any
  milestones?: any
  startDate?: string
  endDate?: string
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  cost?: number
  fundingSource?: string
}

// 場地搜索參數
export interface VenueSearchParams {
  location?: string
  minCapacity?: number
  facilities?: string[]
  isActive?: boolean
  search?: string
}

// 預約搜索參數
export interface BookingSearchParams {
  venueId?: number
  userId?: number
  status?: string
  dateFrom?: string
  dateTo?: string
}

// 建議搜索參數
export interface RecommendationSearchParams {
  userId?: number
  courseId?: number
  priority?: string
  status?: string
}

// 發展搜索參數
export interface DevelopmentSearchParams {
  userId?: number
  developmentType?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

// 場地統計
export interface VenueStats {
  totalVenues: number
  activeVenues: number
  totalBookings: number
  pendingBookings: number
  averageUtilization: number
}

// 預約統計
export interface BookingStats {
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  completedBookings: number
  averageBookingDuration: number
}

// 建議統計
export interface RecommendationStats {
  totalRecommendations: number
  pendingRecommendations: number
  acceptedRecommendations: number
  declinedRecommendations: number
  completedRecommendations: number
}

// 發展統計
export interface DevelopmentStats {
  totalDevelopments: number
  plannedDevelopments: number
  inProgressDevelopments: number
  completedDevelopments: number
  totalCost: number
}

// 狀態類型
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type RecommendationStatus = 'pending' | 'accepted' | 'declined' | 'completed'
export type DevelopmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type Priority = 'high' | 'medium' | 'low'
export type DevelopmentType = 'training' | 'certification' | 'mentorship' | 'research'
