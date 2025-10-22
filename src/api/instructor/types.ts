/**
 * 講師功能類型定義
 * 定義所有講師相關的TypeScript接口
 */

// 講師基本信息
export interface Instructor {
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

// 講師評分
export interface InstructorRating {
  id: number
  instructor_id: number
  student_id: number
  course_id: number
  rating: number
  comment: string | null
  created_at: Date
}

// 講師申請
export interface InstructorApplication {
  id: number
  user_id: number
  bio: string
  qualifications: string
  specialization: string
  years_of_experience: number
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: Date
  reviewed_at: Date | null
  reviewed_by: number | null
  review_notes: string | null
}

// 講師課程
export interface InstructorCourse {
  id: number
  instructor_id: number
  course_id: number
  assigned_at: Date
  is_primary: boolean
}

// 講師統計
export interface InstructorStats {
  total_courses: number
  total_students: number
  average_rating: number
  total_ratings: number
  completion_rate: number
  revenue: number
}

// 講師創建請求
export interface CreateInstructorRequest {
  bio: string
  qualifications: string
  specialization: string
  years_of_experience: number
}

// 講師更新請求
export interface UpdateInstructorRequest {
  bio?: string
  qualifications?: string
  specialization?: string
  years_of_experience?: number
  is_active?: boolean
}

// 講師評分請求
export interface CreateRatingRequest {
  instructor_id: number
  course_id: number
  rating: number
  comment?: string
}

// 講師申請請求
export interface CreateApplicationRequest {
  bio: string
  qualifications: string
  specialization: string
  years_of_experience: number
}

// 講師申請審核請求
export interface ReviewApplicationRequest {
  status: 'approved' | 'rejected'
  review_notes?: string
}

// 講師搜索參數
export interface InstructorSearchParams {
  specialization?: string
  min_rating?: number
  min_experience?: number
  is_active?: boolean
  search?: string
}

// 講師申請狀態
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

// 講師狀態
export type InstructorStatus = 'active' | 'inactive' | 'suspended'

