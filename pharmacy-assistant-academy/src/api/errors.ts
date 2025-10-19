import type { ApiError } from './types'

// Custom API Error class
export class ApiException extends Error {
    public statusCode: number
    public code: string
    public details?: Record<string, string>

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        details?: Record<string, string>
    ) {
        super(message)
        this.name = 'ApiException'
        this.statusCode = statusCode
        this.code = code
        this.details = details
    }

    toApiError(): ApiError {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            statusCode: this.statusCode
        }
    }
}

// Predefined error types
export class ValidationError extends ApiException {
    constructor(message: string, details?: Record<string, string>) {
        super(message, 400, 'VALIDATION_ERROR', details)
    }
}

export class AuthenticationError extends ApiException {
    constructor(message: string = '認證失敗') {
        super(message, 401, 'AUTHENTICATION_ERROR')
    }
}

export class AuthorizationError extends ApiException {
    constructor(message: string = '權限不足') {
        super(message, 403, 'AUTHORIZATION_ERROR')
    }
}

export class NotFoundError extends ApiException {
    constructor(message: string = '資源不存在') {
        super(message, 404, 'NOT_FOUND')
    }
}

export class ConflictError extends ApiException {
    constructor(message: string, details?: Record<string, string>) {
        super(message, 409, 'CONFLICT_ERROR', details)
    }
}

export class DatabaseError extends ApiException {
    constructor(message: string = '資料庫操作失敗') {
        super(message, 500, 'DATABASE_ERROR')
    }
}

// Error handler utility
export function handleApiError(error: unknown): ApiError {
    if (error instanceof ApiException) {
        return error.toApiError()
    }

    if (error instanceof Error) {
        // Log unexpected errors
        console.error('Unexpected API error:', error)

        return {
            code: 'INTERNAL_ERROR',
            message: '內部伺服器錯誤',
            statusCode: 500
        }
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: '未知錯誤',
        statusCode: 500
    }
}