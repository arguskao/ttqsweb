// API Request and Response types
export interface ApiRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
  params?: Record<string, string>
  query?: Record<string, string>
  ip?: string
  user?: {
    id: number
    email: string
    userType: 'job_seeker' | 'employer' | 'admin'
    firstName?: string
    lastName?: string
    phone?: string
    isActive?: boolean
    // 兼容舊的屬性名稱
    user_type?: 'job_seeker' | 'employer' | 'admin'
    first_name?: string
    last_name?: string
    is_active?: boolean
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  headers?: Record<string, string>
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    timestamp?: string
    duration?: string
    requestId?: string
    severity?: string
    category?: string
    isRetryable?: string
    retryAfter?: string
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string>
  statusCode?: number
  timestamp?: string
  requestId?: string
}

// Route handler type
export type RouteHandler<T = unknown> = (req: ApiRequest) => Promise<ApiResponse<T>>

// Middleware type
export type Middleware = (req: ApiRequest, next: () => Promise<ApiResponse>) => Promise<ApiResponse>

// Route handler with middleware wrapper
export type RouteHandlerWithMiddleware = (req: ApiRequest) => Promise<ApiResponse>

// Database query result types
export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
