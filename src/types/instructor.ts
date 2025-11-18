/**
 * 講師相關型別定義
 */

export interface CreateApplicationRequest {
  bio: string
  qualifications: string
  specialization: string
  yearsOfExperience: number
}

export interface InstructorApplication {
  id: number
  userId: number
  bio: string
  qualifications: string
  specialization: string
  yearsOfExperience: number
  status: 'pending' | 'approved' | 'rejected'
  isActive: boolean
  averageRating?: number
  totalRatings?: number
  createdAt: string
  updatedAt: string
  submittedAt?: string
  reviewedAt?: string
  reviewNotes?: string
  // 用戶資訊（如果有 JOIN）
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  // 兼容 snake_case（API 回應）
  submitted_at?: string
  reviewed_at?: string
  review_notes?: string
}
