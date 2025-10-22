/**
 * 增強版錯誤處理系統
 * 提供結構化錯誤、錯誤分類、錯誤追蹤等功能
 */

import type { ApiResponse, ApiError, Middleware } from './types'

// 錯誤嚴重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 錯誤分類
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  DATABASE = 'database',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  EXTERNAL_SERVICE = 'external_service'
}

// 錯誤上下文
export interface ErrorContext {
  userId?: number
  requestId?: string
  userAgent?: string
  ip?: string
  url?: string
  method?: string
  timestamp?: string
  stack?: string
  additionalData?: Record<string, any>
}

// 增強錯誤類
export class EnhancedError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly context: ErrorContext
  public readonly isRetryable: boolean
  public readonly retryAfter?: number
  public readonly details?: Record<string, any>

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    context: ErrorContext = {},
    isRetryable = false,
    retryAfter?: number,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = 'EnhancedError'
    this.code = code
    this.statusCode = statusCode
    this.severity = severity
    this.category = category
    this.context = {
      timestamp: new Date().toISOString(),
      ...context
    }
    this.isRetryable = isRetryable
    this.retryAfter = retryAfter
    this.details = details
  }

  // 轉換為API錯誤格式
  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: {
        severity: this.severity,
        category: this.category,
        isRetryable: this.isRetryable.toString(),
        ...(this.retryAfter && { retryAfter: this.retryAfter.toString() }),
        ...this.details
      }
    }
  }

  // 添加上下文信息
  withContext(context: Partial<ErrorContext>): EnhancedError {
    return new EnhancedError(
      this.message,
      this.code,
      this.statusCode,
      this.severity,
      this.category,
      { ...this.context, ...context },
      this.isRetryable,
      this.retryAfter,
      this.details
    )
  }
}

// 預定義錯誤類型
export class ValidationError extends EnhancedError {
  constructor(message: string, details?: Record<string, any>, context: ErrorContext = {}) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      context,
      false,
      undefined,
      details
    )
  }
}

export class AuthenticationError extends EnhancedError {
  constructor(message = '認證失敗', context: ErrorContext = {}) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      401,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHENTICATION,
      context,
      false
    )
  }
}

export class AuthorizationError extends EnhancedError {
  constructor(message = '權限不足', context: ErrorContext = {}) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHORIZATION,
      context,
      false
    )
  }
}

export class NotFoundError extends EnhancedError {
  constructor(message = '資源不存在', context: ErrorContext = {}) {
    super(
      message,
      'NOT_FOUND_ERROR',
      404,
      ErrorSeverity.LOW,
      ErrorCategory.NOT_FOUND,
      context,
      false
    )
  }
}

export class RateLimitError extends EnhancedError {
  constructor(message = '請求過於頻繁', retryAfter?: number, context: ErrorContext = {}) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      ErrorSeverity.MEDIUM,
      ErrorCategory.RATE_LIMIT,
      context,
      true,
      retryAfter
    )
  }
}

export class DatabaseError extends EnhancedError {
  constructor(message = '數據庫操作失敗', context: ErrorContext = {}) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      ErrorSeverity.HIGH,
      ErrorCategory.DATABASE,
      context,
      true,
      5000 // 5秒後重試
    )
  }
}

export class NetworkError extends EnhancedError {
  constructor(message = '網絡錯誤', context: ErrorContext = {}) {
    super(
      message,
      'NETWORK_ERROR',
      502,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      context,
      true,
      10000 // 10秒後重試
    )
  }
}

export class BusinessLogicError extends EnhancedError {
  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(message, code, 422, ErrorSeverity.MEDIUM, ErrorCategory.BUSINESS_LOGIC, context, false)
  }
}

export class SystemError extends EnhancedError {
  constructor(message = '系統錯誤', context: ErrorContext = {}) {
    super(
      message,
      'SYSTEM_ERROR',
      500,
      ErrorSeverity.CRITICAL,
      ErrorCategory.SYSTEM,
      context,
      true,
      30000 // 30秒後重試
    )
  }
}

// 錯誤追蹤器
export class ErrorTracker {
  private static errorLog: Array<{
    error: EnhancedError
    count: number
    firstOccurrence: string
    lastOccurrence: string
  }> = []

  // 記錄錯誤
  static track(error: EnhancedError): void {
    const errorKey = `${error.code}:${error.message}`
    const existing = this.errorLog.find(
      entry => entry.error.code === error.code && entry.error.message === error.message
    )

    if (existing) {
      existing.count++
      existing.lastOccurrence = new Date().toISOString()
    } else {
      this.errorLog.push({
        error,
        count: 1,
        firstOccurrence: new Date().toISOString(),
        lastOccurrence: new Date().toISOString()
      })
    }

    // 記錄到控制台
    this.logError(error)
  }

  // 記錄錯誤到控制台
  private static logError(error: EnhancedError): void {
    const logData = {
      timestamp: error.context.timestamp,
      severity: error.severity,
      category: error.category,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('CRITICAL ERROR:', JSON.stringify(logData, null, 2))
        break
      case ErrorSeverity.HIGH:
        console.error('HIGH ERROR:', JSON.stringify(logData, null, 2))
        break
      case ErrorSeverity.MEDIUM:
        console.warn('MEDIUM ERROR:', JSON.stringify(logData, null, 2))
        break
      case ErrorSeverity.LOW:
        console.info('LOW ERROR:', JSON.stringify(logData, null, 2))
        break
    }
  }

  // 獲取錯誤統計
  static getErrorStats(): {
    totalErrors: number
    errorsBySeverity: Record<ErrorSeverity, number>
    errorsByCategory: Record<ErrorCategory, number>
    topErrors: Array<{
      code: string
      message: string
      count: number
      severity: ErrorSeverity
    }>
    } {
    const totalErrors = this.errorLog.reduce((sum, entry) => sum + entry.count, 0)

    const errorsBySeverity = Object.values(ErrorSeverity).reduce(
      (acc, severity) => {
        acc[severity] = this.errorLog
          .filter(entry => entry.error.severity === severity)
          .reduce((sum, entry) => sum + entry.count, 0)
        return acc
      },
      {} as Record<ErrorSeverity, number>
    )

    const errorsByCategory = Object.values(ErrorCategory).reduce(
      (acc, category) => {
        acc[category] = this.errorLog
          .filter(entry => entry.error.category === category)
          .reduce((sum, entry) => sum + entry.count, 0)
        return acc
      },
      {} as Record<ErrorCategory, number>
    )

    const topErrors = this.errorLog
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(entry => ({
        code: entry.error.code,
        message: entry.error.message,
        count: entry.count,
        severity: entry.error.severity
      }))

    return {
      totalErrors,
      errorsBySeverity,
      errorsByCategory,
      topErrors
    }
  }

  // 清理舊的錯誤記錄
  static cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    // 24小時
    const cutoff = Date.now() - maxAge
    this.errorLog = this.errorLog.filter(entry => {
      const lastOccurrence = new Date(entry.lastOccurrence).getTime()
      return lastOccurrence > cutoff
    })
  }
}

// 錯誤處理中間件
export const enhancedErrorHandlingMiddleware = (): Middleware => {
  return async (req, next) => {
    try {
      return await next()
    } catch (error) {
      // 提取請求上下文
      const context: ErrorContext = {
        userId: req.user?.id,
        requestId: req.headers['x-request-id'] as string,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        url: req.url,
        method: req.method,
        additionalData: {
          headers: req.headers,
          query: req.query,
          params: req.params
        }
      }

      let enhancedError: EnhancedError

      // 轉換為增強錯誤
      if (error instanceof EnhancedError) {
        enhancedError = error.withContext(context)
      } else if (error instanceof Error) {
        // 根據錯誤類型創建相應的增強錯誤
        if (error.name === 'ValidationError') {
          enhancedError = new ValidationError(error.message, undefined, context)
        } else if (error.name === 'AuthenticationError') {
          enhancedError = new AuthenticationError(error.message, context)
        } else if (error.name === 'AuthorizationError') {
          enhancedError = new AuthorizationError(error.message, context)
        } else if (error.name === 'NotFoundError') {
          enhancedError = new NotFoundError(error.message, context)
        } else if (error.name === 'RateLimitError') {
          enhancedError = new RateLimitError(error.message, undefined, context)
        } else if (error.name === 'DatabaseError') {
          enhancedError = new DatabaseError(error.message, context)
        } else {
          enhancedError = new SystemError(error.message, context)
        }
      } else {
        enhancedError = new SystemError('未知錯誤', context)
      }

      // 追蹤錯誤
      ErrorTracker.track(enhancedError)

      // 返回結構化錯誤響應
      return {
        success: false,
        error: enhancedError.toApiError(),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: context.requestId,
          severity: enhancedError.severity,
          category: enhancedError.category,
          isRetryable: enhancedError.isRetryable.toString(),
          retryAfter: enhancedError.retryAfter?.toString()
        }
      }
    }
  }
}

// 錯誤恢復中間件
export const errorRecoveryMiddleware = (): Middleware => {
  return async (req, next) => {
    try {
      return await next()
    } catch (error) {
      if (error instanceof EnhancedError && error.isRetryable) {
        // 對於可重試的錯誤，添加重試標頭
        const response: ApiResponse = {
          success: false,
          error: error.toApiError(),
          meta: {
            timestamp: new Date().toISOString(),
            retryAfter: error.retryAfter?.toString(),
            isRetryable: 'true'
          }
        }

        // 添加重試標頭
        response.headers = {
          'Retry-After': error.retryAfter?.toString() || '30',
          'X-Retryable': 'true'
        }

        return response
      }

      throw error
    }
  }
}

// 錯誤監控中間件
export const errorMonitoringMiddleware = (): Middleware => {
  return async (req, next) => {
    const startTime = Date.now()

    try {
      const response = await next()

      // 記錄成功請求
      if (response.success !== false) {
        console.log(`Request successful: ${req.method} ${req.url} (${Date.now() - startTime}ms)`)
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // 記錄失敗請求
      console.error(`Request failed: ${req.method} ${req.url} (${duration}ms)`, error)

      throw error
    }
  }
}

// 組合所有錯誤處理中間件
export const enhancedErrorHandlingMiddlewareChain = (): Middleware[] => {
  return [errorMonitoringMiddleware(), errorRecoveryMiddleware(), enhancedErrorHandlingMiddleware()]
}
