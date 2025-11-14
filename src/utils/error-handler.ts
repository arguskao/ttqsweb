/**
 * 前端統一錯誤處理工具
 */

// 錯誤類型
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// API 錯誤類
export class ApiError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 錯誤訊息映射（中文）
const ERROR_MESSAGES: Record<string, string> = {
  // 認證相關
  UNAUTHORIZED: '請先登入',
  INVALID_TOKEN: '登入已過期，請重新登入',
  TOKEN_EXPIRED: '登入已過期，請重新登入',
  
  // 權限相關
  FORBIDDEN: '您沒有權限執行此操作',
  INSUFFICIENT_PERMISSIONS: '權限不足',
  
  // 驗證相關
  VALIDATION_ERROR: '輸入資料有誤',
  INVALID_INPUT: '輸入格式不正確',
  MISSING_REQUIRED_FIELD: '請填寫所有必填欄位',
  
  // 資源相關
  NOT_FOUND: '找不到資源',
  ALREADY_EXISTS: '資源已存在',
  CONFLICT: '操作衝突',
  
  // 資料庫相關
  DB_ERROR: '資料庫錯誤',
  DB_CONNECTION_ERROR: '無法連接資料庫',
  DB_QUERY_ERROR: '資料查詢失敗',
  
  // 伺服器相關
  INTERNAL_ERROR: '伺服器內部錯誤',
  SERVER_ERROR: '伺服器錯誤',
  METHOD_NOT_ALLOWED: '不支援的請求方法',
  
  // 網路相關
  NETWORK_ERROR: '網路連線失敗',
  TIMEOUT: '請求逾時',
  RATE_LIMIT_EXCEEDED: '請求過於頻繁，請稍後再試'
}

/**
 * 解析 API 錯誤
 */
export function parseApiError(error: any): ApiError {
  // Axios 錯誤
  if (error.response) {
    const { status, data } = error.response
    const code = data?.code || data?.error?.code
    const message = data?.message || data?.error?.message || ERROR_MESSAGES[code] || '操作失敗'
    
    let type: ErrorType
    if (status === 401) type = ErrorType.AUTH
    else if (status === 403) type = ErrorType.PERMISSION
    else if (status === 404) type = ErrorType.NOT_FOUND
    else if (status === 400) type = ErrorType.VALIDATION
    else if (status >= 500) type = ErrorType.SERVER
    else type = ErrorType.UNKNOWN

    return new ApiError(type, message, status, data?.details)
  }

  // 網路錯誤
  if (error.request) {
    return new ApiError(
      ErrorType.NETWORK,
      '網路連線失敗，請檢查您的網路連線',
      0
    )
  }

  // 其他錯誤
  return new ApiError(
    ErrorType.UNKNOWN,
    error.message || '發生未知錯誤',
    undefined,
    error
  )
}

/**
 * 顯示錯誤訊息
 */
export function showError(error: unknown, fallbackMessage?: string): string {
  const apiError = error instanceof ApiError ? error : parseApiError(error)
  
  // 根據錯誤類型決定顯示方式
  switch (apiError.type) {
    case ErrorType.AUTH:
      // 認證錯誤 - 可能需要重新登入
      console.warn('[Auth Error]', apiError.message)
      return apiError.message
      
    case ErrorType.PERMISSION:
      // 權限錯誤
      console.warn('[Permission Error]', apiError.message)
      return apiError.message
      
    case ErrorType.VALIDATION:
      // 驗證錯誤 - 顯示詳細資訊
      console.warn('[Validation Error]', apiError.message, apiError.details)
      return apiError.message
      
    case ErrorType.NOT_FOUND:
      // 資源不存在
      return apiError.message
      
    case ErrorType.NETWORK:
      // 網路錯誤
      return '網路連線失敗，請檢查您的網路連線'
      
    case ErrorType.SERVER:
      // 伺服器錯誤
      console.error('[Server Error]', apiError.message, apiError.details)
      return fallbackMessage || '伺服器發生錯誤，請稍後再試'
      
    default:
      // 未知錯誤
      console.error('[Unknown Error]', apiError)
      return fallbackMessage || '發生未知錯誤，請稍後再試'
  }
}

/**
 * 錯誤處理包裝器（用於 Vue 組件）
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  errorCallback?: (error: ApiError) => void
): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    const apiError = parseApiError(error)
    
    if (errorCallback) {
      errorCallback(apiError)
    } else {
      // 預設行為：顯示錯誤訊息
      const message = showError(apiError)
      alert(message)
    }
    
    return null
  }
}

/**
 * 重試機制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    shouldRetry?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = (error) => {
      // 預設只重試網路錯誤和 5xx 錯誤
      const apiError = parseApiError(error)
      return apiError.type === ErrorType.NETWORK || 
             (apiError.statusCode && apiError.statusCode >= 500)
    }
  } = options

  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i < maxRetries - 1 && shouldRetry(error)) {
        console.log(`重試 ${i + 1}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      } else {
        break
      }
    }
  }

  throw lastError
}

/**
 * 批次錯誤處理
 */
export function collectErrors(errors: Array<{ field: string; message: string }>) {
  if (errors.length === 0) return

  throw new ApiError(
    ErrorType.VALIDATION,
    '表單驗證失敗',
    400,
    { errors }
  )
}
