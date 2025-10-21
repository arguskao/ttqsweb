// API Request and Response types
export interface ApiRequest {
    method: string
    url: string
    headers: Record<string, string>
    body?: unknown
    params?: Record<string, string>
    query?: Record<string, string>
    user?: {
        id: number
        email: string
        userType: 'job_seeker' | 'employer'
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
    }
}

export interface ApiError {
    code: string
    message: string
    details?: Record<string, string>
    statusCode?: number
}

// Route handler type
export type RouteHandler<T = unknown> = (req: ApiRequest) => Promise<ApiResponse<T>>

// Middleware type
export type Middleware = (req: ApiRequest, next: () => Promise<ApiResponse>) => Promise<ApiResponse>

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
