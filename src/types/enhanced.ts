// 增強版類型定義 - 使用 Zod 進行運行時驗證
import { z } from 'zod'

// ==============================================
// 基礎驗證 Schemas
// ==============================================

// 電子郵件驗證
export const EmailSchema = z
  .string()
  .email('請輸入有效的電子郵件地址')
  .max(255, '電子郵件地址過長')
  .min(1, '電子郵件不能為空')

// 密碼驗證
export const PasswordSchema = z
  .string()
  .min(8, '密碼至少需要8個字符')
  .max(128, '密碼過長')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含大小寫字母和數字')

// 電話號碼驗證
export const PhoneSchema = z
  .string()
  .regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼')
  .optional()

// 用戶類型驗證
export const UserTypeSchema = z.enum(['job_seeker', 'employer'] as const, {
  message: '請選擇有效的用戶類型'
})

// 課程類型驗證
export const CourseTypeSchema = z.enum(['basic', 'advanced', 'internship'] as const, {
  message: '請選擇有效的課程類型'
})

// 工作類型驗證
export const JobTypeSchema = z.enum(['full_time', 'part_time', 'internship'] as const, {
  message: '請選擇有效的工作類型'
})

// 狀態驗證
export const EnrollmentStatusSchema = z.enum(['enrolled', 'in_progress', 'completed', 'dropped'])
export const ApplicationStatusSchema = z.enum(['pending', 'reviewed', 'accepted', 'rejected'])
export const InstructorStatusSchema = z.enum(['pending', 'approved', 'rejected'])

// ==============================================
// 業務驗證 Schemas
// ==============================================

// 用戶註冊驗證
export const RegisterSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
    userType: UserTypeSchema,
    firstName: z.string().min(1, '姓名不能為空').max(50, '姓名過長'),
    lastName: z.string().min(1, '姓名不能為空').max(50, '姓名過長'),
    phone: PhoneSchema
  })
  .refine(
    data => data.password === data.confirmPassword,
    {
      message: '密碼確認不一致',
      path: ['confirmPassword']
    }
  )

// 用戶登入驗證
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, '密碼不能為空')
})

// 用戶資料更新驗證
export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, '姓名不能為空').max(50, '姓名過長').optional(),
  lastName: z.string().min(1, '姓名不能為空').max(50, '姓名過長').optional(),
  phone: PhoneSchema
})

// 課程創建驗證
export const CourseSchema = z.object({
  title: z.string().min(1, '課程標題不能為空').max(200, '標題過長'),
  description: z.string().min(1, '課程描述不能為空').max(2000, '描述過長'),
  courseType: CourseTypeSchema,
  durationHours: z.number().min(1, '課程時長至少1小時').max(1000, '課程時長過長'),
  price: z.number().min(0, '價格不能為負數').max(999999, '價格過高'),
  instructorId: z.number().int().positive('請選擇有效的講師')
})

// 課程更新驗證
export const UpdateCourseSchema = CourseSchema.partial()

// 工作創建驗證
export const JobSchema = z.object({
  title: z.string().min(1, '工作標題不能為空').max(200, '標題過長'),
  description: z.string().min(1, '工作描述不能為空').max(2000, '描述過長'),
  location: z.string().min(1, '工作地點不能為空').max(100, '地點過長'),
  salaryMin: z.number().min(0, '最低薪資不能為負數').optional(),
  salaryMax: z.number().min(0, '最高薪資不能為負數').optional(),
  jobType: JobTypeSchema,
  requirements: z.string().min(1, '工作要求不能為空').max(1000, '要求描述過長'),
  expiresAt: z.string().datetime().optional()
}).refine(
  data => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  {
    message: '最高薪資不能低於最低薪資',
    path: ['salaryMax']
  }
)

// 工作申請驗證
export const JobApplicationSchema = z.object({
  jobId: z.number().int().positive('請選擇有效的工作'),
  coverLetter: z.string().min(10, '求職信至少需要10個字符').max(1000, '求職信過長')
})

// 講師申請驗證
export const InstructorApplicationSchema = z.object({
  specialization: z.string().min(1, '專業領域不能為空').max(100, '專業領域過長'),
  yearsOfExperience: z.number().min(0, '工作年資不能為負數').max(50, '工作年資過長'),
  bio: z.string().min(10, '個人簡介至少需要10個字符').max(500, '個人簡介過長'),
  qualifications: z.string().min(1, '資格證明不能為空').max(1000, '資格證明過長')
})

// 課程評價驗證
export const CourseEvaluationSchema = z.object({
  courseId: z.number().int().positive('請選擇有效的課程'),
  rating: z.number().min(1, '評分至少為1分').max(5, '評分最高為5分'),
  comment: z.string().min(1, '評價內容不能為空').max(500, '評價內容過長')
})

// 講師評價驗證
export const InstructorRatingSchema = z.object({
  instructorId: z.number().int().positive('請選擇有效的講師'),
  courseId: z.number().int().positive('請選擇有效的課程'),
  rating: z.number().min(1, '評分至少為1分').max(5, '評分最高為5分'),
  comment: z.string().min(1, '評價內容不能為空').max(500, '評價內容過長').optional()
})

// ==============================================
// API 錯誤類型
// ==============================================

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_TOKEN_MISMATCH'
  | 'INVALID_INPUT'
  | 'RESOURCE_NOT_FOUND'
  | 'DUPLICATE_RESOURCE'

export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, string[]>
  timestamp: string
  requestId: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    version: string
  }
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

// ==============================================
// 業務類型定義
// ==============================================

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

// 課程註冊類型
export interface CourseEnrollment {
  id: number
  userId: number
  courseId: number
  enrolledAt: string
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

// 講師類型
export interface Instructor {
  id: number
  userId: number
  specialization: string
  yearsOfExperience: number
  bio: string
  qualifications: string
  averageRating: number
  totalRatings: number
  applicationStatus: 'pending' | 'approved' | 'rejected'
  isActive: boolean
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

// 課程評價類型
export interface CourseEvaluation {
  id: number
  userId: number
  courseId: number
  rating: number
  comment: string
  createdAt: string
  user?: User
  course?: Course
}

// 講師評價類型
export interface InstructorRating {
  id: number
  studentId: number
  instructorId: number
  courseId: number
  rating: number
  comment?: string
  createdAt: string
  studentFirstName?: string
  studentLastName?: string
  courseTitle?: string
}

// 文檔類型
export interface Document {
  id: number
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  documentType: string | null
  isActive: boolean
  uploadedBy: number | null
  downloadCount: number
  createdAt: string
}

// 學習進度類型
export interface LearningProgress {
  id: number
  userId: number
  courseId: number
  progressPercentage: number
  lastAccessedAt: string
  updatedAt: string
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

// ==============================================
// 表單數據類型
// ==============================================

export type RegisterData = z.infer<typeof RegisterSchema>
export type LoginData = z.infer<typeof LoginSchema>
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>
export type CourseData = z.infer<typeof CourseSchema>
export type UpdateCourseData = z.infer<typeof UpdateCourseSchema>
export type JobData = z.infer<typeof JobSchema>
export type JobApplicationData = z.infer<typeof JobApplicationSchema>
export type InstructorApplicationData = z.infer<typeof InstructorApplicationSchema>
export type CourseEvaluationData = z.infer<typeof CourseEvaluationSchema>
export type InstructorRatingData = z.infer<typeof InstructorRatingSchema>

// ==============================================
// 驗證工具函數
// ==============================================

// 驗證函數工廠
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return { success: false, errors: result.error }
    }
  }
}

// 預定義的驗證器
export const validateRegister = createValidator(RegisterSchema)
export const validateLogin = createValidator(LoginSchema)
export const validateUpdateProfile = createValidator(UpdateProfileSchema)
export const validateCourse = createValidator(CourseSchema)
export const validateJob = createValidator(JobSchema)
export const validateJobApplication = createValidator(JobApplicationSchema)
export const validateInstructorApplication = createValidator(InstructorApplicationSchema)
export const validateCourseEvaluation = createValidator(CourseEvaluationSchema)
export const validateInstructorRating = createValidator(InstructorRatingSchema)

// 錯誤格式化函數
export function formatValidationErrors(error: z.ZodError<unknown>): Record<string, string> {
  const formattedErrors: Record<string, string> = {}

  error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path.join('.')
    formattedErrors[path] = err.message
  })

  return formattedErrors
}

// 類型守衛函數
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  )
}

export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response
  )
}


