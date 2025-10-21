// 重新導出強化的類型定義
export * from './api'

// 用戶類型
export interface User {
  id: number
  email: string
  userType: 'job_seeker' | 'employer'
  firstName: string
  lastName: string
  phone?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

// 課程類型
export interface Course {
  id: number
  title: string
  description: string
  courseType: 'basic' | 'advanced' | 'internship'
  durationHours: number
  price: number
  instructorId: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  instructorFirstName?: string
  instructorLastName?: string
  instructorEmail?: string
}

export interface CourseEnrollment {
  id: number
  userId: number
  courseId: number
  enrollmentDate: string
  completionDate?: string
  progressPercentage: number
  finalScore?: number
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
  courseTitle?: string
  courseDescription?: string
  courseType?: string
  durationHours?: number
}

// 工作類型
export interface Job {
  id: number
  employerId: number
  title: string
  description: string
  location: string
  salaryMin?: number
  salaryMax?: number
  jobType: 'full_time' | 'part_time' | 'internship'
  requirements: string
  isActive: boolean
  createdAt: string
  expiresAt?: string
}

// 文件類型
export interface Document {
  id: number
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  category: string | null
  isPublic: boolean
  uploadedBy: number | null
  downloadCount: number
  createdAt: string
}

// 講師類型
export interface Instructor {
  id: number
  userId: number
  specialization: string
  experience: number
  bio: string
  rating: number
  totalStudents: number
  isVerified: boolean
  createdAt: string
  updatedAt: string
  user?: User
}

// 工作申請類型
export interface JobApplication {
  id: number
  userId: number
  jobId: number
  coverLetter: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  appliedAt: string
  reviewedAt?: string
  user?: User
  job?: Job
}

// 評估類型
export interface Evaluation {
  id: number
  userId: number
  courseId: number
  rating: number
  comment: string
  createdAt: string
  user?: User
  course?: Course
}

// 統計數據類型
export interface Analytics {
  totalUsers: number
  totalCourses: number
  totalJobs: number
  totalEnrollments: number
  activeUsers: number
  completedCourses: number
  jobPlacements: number
}

// 表單驗證錯誤類型
export interface ValidationError {
  field: string
  message: string
}

// 分頁響應類型
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
