/**
 * 課程功能類型定義
 * 定義所有課程相關的TypeScript接口
 */

// 課程基本信息
export interface Course {
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

// 課程註冊
export interface CourseEnrollment {
  id: number
  user_id: number
  course_id: number
  enrollment_date: Date
  completion_date: Date | null
  progress_percentage: number
  final_score: number | null
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
  createdAt: Date
  updatedAt: Date
}

// 課程創建請求
export interface CreateCourseRequest {
  title: string
  description?: string
  course_type: 'basic' | 'advanced' | 'internship'
  duration_hours?: number
  price?: number
  instructor_id?: number
  // 向後相容的 camelCase 屬性
  courseType?: 'basic' | 'advanced' | 'internship'
  duration?: number
  maxStudents?: number
  prerequisites?: string[]
  learningObjectives?: string[]
}

// 課程更新請求
export interface UpdateCourseRequest {
  title?: string
  description?: string
  course_type?: 'basic' | 'advanced' | 'internship'
  duration_hours?: number
  price?: number
  instructor_id?: number
  is_active?: boolean
  // 向後相容的 camelCase 屬性
  courseType?: 'basic' | 'advanced' | 'internship'
  duration?: number
  maxStudents?: number
  prerequisites?: string[]
  learningObjectives?: string[]
}

// 課程註冊請求
export interface CreateEnrollmentRequest {
  course_id: number
}

// 課程註冊更新請求
export interface UpdateEnrollmentRequest {
  progress_percentage?: number
  final_score?: number
  status?: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
}

// 課程搜索參數
export interface CourseSearchParams {
  course_type?: string
  search?: string
  instructor_id?: number
  is_active?: boolean
  min_price?: number
  max_price?: number
  page?: number
  limit?: number
}

// 課程註冊搜索參數
export interface EnrollmentSearchParams {
  user_id?: number
  course_id?: number
  status?: string
  enrollment_date_from?: string
  enrollment_date_to?: string
  page?: number
  limit?: number
}

// 課程統計
export interface CourseStats {
  totalCourses: number
  activeCourses: number
  totalEnrollments: number
  completedEnrollments: number
  averageCompletionRate: number
  averageScore: number
}

// 課程詳情（包含講師信息）
export interface CourseWithInstructor extends Course {
  instructor_name?: string
  instructor_bio?: string
  enrollment_count?: number
  average_rating?: number
}

// 課程註冊詳情（包含課程和用戶信息）
export interface EnrollmentWithDetails extends CourseEnrollment {
  course_title?: string
  course_description?: string
  course_type?: string
  user_name?: string
  user_email?: string
}

// 課程進度
export interface CourseProgress {
  courseId: number
  userId: number
  progressPercentage: number
  completedModules: number
  totalModules: number
  lastAccessed: Date | null
  estimatedCompletion: Date | null
}

// 課程評價
export interface CourseRating {
  id: number
  course_id: number
  user_id: number
  rating: number
  comment: string | null
  created_at: Date
}

// 課程評價請求
export interface CreateRatingRequest {
  course_id: number
  rating: number
  comment?: string
}

// 課程評價更新請求
export interface UpdateRatingRequest {
  rating?: number
  comment?: string
}

// 課程類型
export type CourseType = 'basic' | 'advanced' | 'internship'

// 註冊狀態
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped'

// 課程篩選器
export interface CourseFilters {
  courseType?: CourseType
  search?: string
  instructorId?: number
  isActive?: boolean
  priceRange?: {
    min: number
    max: number
  }
  sortBy?: 'title' | 'created_at' | 'price' | 'duration_hours'
  sortOrder?: 'asc' | 'desc'
}

// 課程分頁元數據
export interface CoursePaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 課程列表響應
export interface CourseListResponse {
  courses: CourseWithInstructor[]
  meta: CoursePaginationMeta
}

// 課程註冊列表響應
export interface EnrollmentListResponse {
  enrollments: EnrollmentWithDetails[]
  meta: CoursePaginationMeta
}

// ==================== 課程申請相關類型 ====================

// 課程申請狀態
export type CourseApplicationStatus = 'pending' | 'approved' | 'rejected'

// 課程申請
export interface CourseApplication {
  id: number
  instructor_id: number
  course_name: string
  description: string
  category: string
  target_audience: string
  duration: number
  price: number
  delivery_methods: string
  syllabus: string
  teaching_experience: string
  materials: string | null
  special_requirements: string | null
  status: CourseApplicationStatus
  submitted_at: Date
  reviewed_at: Date | null
  review_notes: string | null
  created_at: Date
  updated_at: Date
}

// 課程申請詳情（包含講師信息）
export interface CourseApplicationWithInstructor extends CourseApplication {
  instructor_name?: string
  instructor_email?: string
  instructor_bio?: string
  user_id?: number
}

// 創建課程申請請求
export interface CreateCourseApplicationRequest {
  course_name: string
  description: string
  category: string
  target_audience: string
  duration: number
  price: number
  delivery_methods?: string
  syllabus: string
  teaching_experience: string
  materials?: string
  special_requirements?: string
}

// 審核課程申請請求
export interface ReviewCourseApplicationRequest {
  status: 'approved' | 'rejected'
  review_notes?: string
}

// 課程申請搜索參數
export interface CourseApplicationSearchParams {
  instructor_id?: number
  status?: CourseApplicationStatus
  category?: string
  page?: number
  limit?: number
}

// 課程申請列表響應
export interface CourseApplicationListResponse {
  applications: CourseApplicationWithInstructor[]
  meta: CoursePaginationMeta
}
