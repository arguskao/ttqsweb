import { z } from 'zod'

// 錯誤代碼枚舉
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'

// API 錯誤接口
export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, string[]>
  timestamp: string
  requestId: string
}

// API 響應接口
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: {
    pagination?: PaginationMeta
    version?: string
  }
}

// API 錯誤響應接口
export interface ApiErrorResponse {
  success: false
  error: ApiError
}

// 分頁元數據
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 基礎驗證 schemas
export const EmailSchema = z.string().email('請輸入有效的電子郵件地址').max(255, '電子郵件地址過長')

export const PasswordSchema = z
  .string()
  .min(8, '密碼至少需要8個字符')
  .max(128, '密碼過長')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含大小寫字母和數字')

export const PhoneSchema = z
  .string()
  .regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼')
  .optional()

export const NameSchema = z
  .string()
  .min(1, '姓名不能為空')
  .max(50, '姓名過長')
  .regex(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, '姓名只能包含中文、英文字母和空格')

// 用戶類型枚舉
export const UserTypeSchema = z.enum(['job_seeker', 'employer'] as const)

// 註冊數據驗證 schema
export const RegisterSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
    userType: UserTypeSchema,
    firstName: NameSchema,
    lastName: NameSchema,
    phone: PhoneSchema
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '密碼確認不一致',
    path: ['confirmPassword']
  })

// 登入數據驗證 schema
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, '密碼不能為空')
})

// 課程類型枚舉
export const CourseTypeSchema = z.enum(['basic', 'advanced', 'internship'] as const)

// 課程驗證 schema
export const CourseSchema = z.object({
  title: z.string().min(1, '課程標題不能為空').max(200, '標題過長'),
  description: z.string().min(1, '課程描述不能為空').max(2000, '描述過長'),
  courseType: CourseTypeSchema,
  durationHours: z.number().min(1, '課程時長至少1小時').max(1000, '課程時長過長'),
  price: z.number().min(0, '價格不能為負數').max(999999, '價格過高')
})

// 課程過濾器驗證 schema
export const CourseFiltersSchema = z.object({
  courseType: CourseTypeSchema.optional(),
  search: z.string().max(100, '搜索關鍵字過長').optional(),
  page: z.number().min(1, '頁碼必須大於0').optional(),
  limit: z.number().min(1, '每頁數量必須大於0').max(100, '每頁數量不能超過100').optional()
})

// 工作類型枚舉
export const JobTypeSchema = z.enum(['full_time', 'part_time', 'internship'] as const)

// 工作驗證 schema
export const JobSchema = z
  .object({
    title: z.string().min(1, '職位標題不能為空').max(200, '標題過長'),
    description: z.string().min(1, '職位描述不能為空').max(2000, '描述過長'),
    location: z.string().min(1, '工作地點不能為空').max(100, '地點過長'),
    salaryMin: z.number().min(0, '最低薪資不能為負數').optional(),
    salaryMax: z.number().min(0, '最高薪資不能為負數').optional(),
    jobType: JobTypeSchema,
    requirements: z.string().min(1, '職位要求不能為空').max(2000, '要求描述過長')
  })
  .refine(
    data => {
      if (data.salaryMin && data.salaryMax) {
        return data.salaryMax >= data.salaryMin
      }
      return true
    },
    {
      message: '最高薪資不能低於最低薪資',
      path: ['salaryMax']
    }
  )

// 文件上傳驗證 schema
export const FileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, '文件大小不能超過10MB')
    .refine(
      file =>
        ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(
          file.name.split('.').pop()?.toLowerCase() ?? ''
        ),
      '只支持 PDF、DOC、DOCX、JPG、JPEG、PNG 格式'
    ),
  title: z.string().min(1, '文件標題不能為空').max(200, '標題過長'),
  description: z.string().max(500, '描述過長').optional(),
  category: z.string().max(50, '分類名稱過長').optional(),
  isPublic: z.boolean().default(false)
})

// 導出類型
export type RegisterData = z.infer<typeof RegisterSchema>
export type LoginCredentials = z.infer<typeof LoginSchema>
export type CourseData = z.infer<typeof CourseSchema>
export type CourseFilters = z.infer<typeof CourseFiltersSchema>
export type JobData = z.infer<typeof JobSchema>
export type FileUploadData = z.infer<typeof FileUploadSchema>

// 驗證函數
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(err => err.message).join(', ')
      throw new Error(`驗證失敗: ${errorMessage}`)
    }
    throw error
  }
}

// 安全解析函數
export const safeParseData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(err => err.message).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: '未知驗證錯誤' }
  }
}
