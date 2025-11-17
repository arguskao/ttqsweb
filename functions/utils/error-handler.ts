/**
 * 統一的錯誤處理工具
 * 用於 Cloudflare Workers/Pages Functions
 */

// 錯誤類型定義
export enum ErrorCode {
  // 認證相關
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 權限相關
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 驗證相關
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // 資源相關
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // 資料庫相關
  DB_ERROR = 'DB_ERROR',
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  
  // 伺服器相關
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  
  // 外部服務相關
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// 錯誤狀態碼映射
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.DB_ERROR]: 500,
  [ErrorCode.DB_CONNECTION_ERROR]: 500,
  [ErrorCode.DB_QUERY_ERROR]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429
}

// 自定義 API 錯誤類
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode || ERROR_STATUS_MAP[code] || 500
  }
}

// 錯誤回應介面
interface ErrorResponse {
  success: false
  message: string
  code?: string
  details?: any
}

/**
 * 創建標準化的錯誤回應
 */
export function createErrorResponse(
  error: unknown,
  context?: string
): Response {
  let errorResponse: ErrorResponse
  let statusCode = 500

  if (error instanceof ApiError) {
    // 自定義 API 錯誤
    errorResponse = {
      success: false,
      message: error.message,
      code: error.code,
      details: error.details
    }
    statusCode = error.statusCode
  } else if (error instanceof Error) {
    // 標準 JavaScript 錯誤
    errorResponse = {
      success: false,
      message: error.message,
      code: ErrorCode.INTERNAL_ERROR
    }
    
    // 在開發環境中包含堆疊追蹤
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.stack
    }
  } else {
    // 未知錯誤
    errorResponse = {
      success: false,
      message: '發生未知錯誤',
      code: ErrorCode.INTERNAL_ERROR,
      details: String(error)
    }
  }

  // 記錄錯誤
  const logPrefix = context ? `[${context}]` : '[Error]'
  console.error(`${logPrefix} ${errorResponse.code}:`, errorResponse.message, errorResponse.details || '')

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

/**
 * 創建成功回應
 */
export function createSuccessResponse<T = any>(
  data: T,
  metaOrMessage?: Record<string, any> | string,
  statusCode: number = 200
): Response {
  const isMessage = typeof metaOrMessage === 'string'
  
  return new Response(
    JSON.stringify({
      success: true,
      data,
      ...(isMessage && metaOrMessage && { message: metaOrMessage }),
      ...(!isMessage && metaOrMessage && { meta: metaOrMessage })
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}

/**
 * 錯誤處理包裝器
 * 用於包裝 API 處理函數，自動捕獲和處理錯誤
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<Response>,
  context?: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      return createErrorResponse(error, context)
    }
  }
}

/**
 * 驗證必填欄位
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new ApiError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `缺少必填欄位: ${missingFields.join(', ')}`,
      { missingFields }
    )
  }
}

/**
 * 驗證 JWT Token
 */
export function validateToken(authHeader: string | null): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED,
      '未提供認證 token'
    )
  }

  return authHeader.substring(7)
}

/**
 * 解析 JWT Token
 */
export function parseJwtToken(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) {
      throw new Error('Invalid token format')
    }

    const payload = JSON.parse(atob(parts[1]))
    
    // 檢查是否過期
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new ApiError(
        ErrorCode.TOKEN_EXPIRED,
        'Token 已過期'
      )
    }

    // 檢查必要欄位
    if (!payload.userId && !payload.user_id && !payload.id) {
      throw new ApiError(
        ErrorCode.INVALID_TOKEN,
        'Token 缺少用戶 ID'
      )
    }

    // 標準化 userId 欄位
    if (!payload.userId) {
      payload.userId = payload.user_id || payload.id
    }

    return payload
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      ErrorCode.INVALID_TOKEN,
      '無效的 token'
    )
  }
}

/**
 * 檢查用戶權限
 */
export function checkPermission(
  userType: string,
  allowedTypes: string[]
): void {
  if (!allowedTypes.includes(userType)) {
    throw new ApiError(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      '您沒有權限執行此操作',
      { userType, allowedTypes }
    )
  }
}

/**
 * 處理資料庫錯誤
 */
export function handleDatabaseError(error: any, context?: string): Response {
  const logPrefix = context ? `[${context}]` : '[Database]'
  console.error(`${logPrefix} 資料庫錯誤:`, error)

  const apiError = new ApiError(
    ErrorCode.DB_ERROR,
    '資料庫操作失敗',
    process.env.NODE_ENV === 'development' ? error.message : undefined
  )
  
  return createErrorResponse(apiError, context)
}

/**
 * 驗證資料庫連接
 */
export function validateDatabaseUrl(databaseUrl: string | undefined): string {
  if (!databaseUrl) {
    throw new ApiError(
      ErrorCode.DB_CONNECTION_ERROR,
      'Database URL not configured'
    )
  }
  return databaseUrl
}

/**
 * 創建 CORS 標頭
 */
export function createCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
    'Access-Control-Max-Age': '86400'
  }
}

/**
 * 創建 OPTIONS 回應
 */
export function createOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders()
  })
}
