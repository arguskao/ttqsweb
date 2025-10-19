// User types
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

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  userType: 'job_seeker' | 'employer'
  firstName: string
  lastName: string
  phone?: string
}

// Course types
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

export interface CourseFilters {
  courseType?: 'basic' | 'advanced' | 'internship'
  search?: string
  page?: number
  limit?: number
}

// Job types
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

// Document types
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

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, string>
  }
}
