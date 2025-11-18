/**
 * 資料庫查詢結果轉換工具
 * 統一將 snake_case 資料庫欄位轉換為 camelCase TypeScript 屬性
 */

/**
 * 用戶型別（camelCase）
 */
export interface User {
  id: number
  email: string
  userType: 'admin' | 'instructor' | 'employer' | 'job_seeker'
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * JWT Payload 型別
 */
export interface JwtPayload {
  userId: number
  email: string
  userType: string
  iat: number
  exp: number
  sessionId?: string
  tokenId?: string
}

/**
 * 請求中的用戶資訊（從 JWT 解析）
 */
export interface RequestUser {
  id: number
  email: string
  userType: string
}

/**
 * 將資料庫 row 轉換為 User 物件
 */
export function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    userType: row.user_type,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * 將 User 物件轉換為資料庫欄位（用於 INSERT/UPDATE）
 */
export function userToRow(user: Partial<User>): Record<string, any> {
  const row: Record<string, any> = {}
  
  if (user.email !== undefined) row.email = user.email
  if (user.userType !== undefined) row.user_type = user.userType
  if (user.firstName !== undefined) row.first_name = user.firstName
  if (user.lastName !== undefined) row.last_name = user.lastName
  if (user.phone !== undefined) row.phone = user.phone
  if (user.isActive !== undefined) row.is_active = user.isActive
  
  return row
}

/**
 * 將資料庫 row 轉換為 Instructor 物件
 */
export function rowToInstructor(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    bio: row.bio,
    qualifications: row.qualifications,
    specialization: row.specialization,
    yearsOfExperience: row.years_of_experience,
    status: row.status,
    isActive: row.is_active,
    averageRating: row.average_rating,
    totalRatings: row.total_ratings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // 如果有 JOIN 用戶表
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone
  }
}

/**
 * 將資料庫 row 轉換為 Course 物件
 */
export function rowToCourse(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructorId: row.instructor_id,
    durationHours: row.duration_hours,
    price: row.price,
    category: row.category,
    difficultyLevel: row.difficulty_level,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // 統計資訊
    enrollmentCount: row.enrollment_count ? parseInt(row.enrollment_count) : 0,
    averageRating: row.average_rating ? parseFloat(row.average_rating) : null,
    reviewCount: row.review_count ? parseInt(row.review_count) : 0
  }
}

/**
 * 將資料庫 row 轉換為 Job 物件
 */
export function rowToJob(row: any) {
  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name,
    location: row.location,
    jobType: row.job_type,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    description: row.description,
    requirements: row.requirements,
    benefits: row.benefits,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    postedBy: row.posted_by,
    status: row.status,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * 批量轉換用戶
 */
export function rowsToUsers(rows: any[]): User[] {
  return rows.map(rowToUser)
}

/**
 * 批量轉換講師
 */
export function rowsToInstructors(rows: any[]) {
  return rows.map(rowToInstructor)
}

/**
 * 批量轉換課程
 */
export function rowsToCourses(rows: any[]) {
  return rows.map(rowToCourse)
}

/**
 * 批量轉換工作
 */
export function rowsToJobs(rows: any[]) {
  return rows.map(rowToJob)
}
