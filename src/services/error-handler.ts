import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import { errorLogger, ErrorLevel, ErrorCategory } from '@/utils/error-logger'

// 錯誤處理器介面（本地定義以避免循環依賴與錯誤匯入）
export interface ErrorHandler {
  handleApiError(error: any): void
}

// 錯誤信息映射
interface ErrorInfo {
  message: string
  level: ErrorLevel
  category: ErrorCategory
  showToast: boolean
}

// 自定義錯誤處理器，與 Pinia store 集成
export class CustomErrorHandler implements ErrorHandler {
  handleApiError(error: any): void {
    const authStore = useAuthStore()
    const errorInfo = this.parseError(error)

    // 記錄錯誤到日誌系統
    errorLogger.log(
      errorInfo.level,
      errorInfo.category,
      errorInfo.message,
      {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        requestId: error.config?.headers?.['X-Request-ID'],
        responseData: error.response?.data,
        stack: error.stack
      }
    )

    // 設置錯誤信息到 store
    authStore.setError(errorInfo.message)

    // 顯示 Toast 通知
    if (errorInfo.showToast) {
      this.showErrorToast(errorInfo.message, error.response?.status)
    }

    // 處理認證錯誤
    if (error.response?.status === 401) {
      authStore.clearAuth()
    }
  }

  // 解析錯誤信息
  private parseError(error: any): ErrorInfo {
    if (error.response) {
      // 服務器響應錯誤
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          return {
            message: data?.error?.message || '請求參數錯誤',
            level: ErrorLevel.WARNING,
            category: ErrorCategory.VALIDATION,
            showToast: true
          }
        case 401:
          return {
            message: '登入已過期，請重新登入',
            level: ErrorLevel.WARNING,
            category: ErrorCategory.AUTH,
            showToast: true
          }
        case 403:
          return {
            message: '您沒有權限執行此操作',
            level: ErrorLevel.WARNING,
            category: ErrorCategory.AUTH,
            showToast: true
          }
        case 404:
          return {
            message: '請求的資源不存在',
            level: ErrorLevel.WARNING,
            category: ErrorCategory.API,
            showToast: true
          }
        case 409:
          return {
            message: data?.error?.message || '數據衝突，請檢查後重試',
            level: ErrorLevel.WARNING,
            category: ErrorCategory.VALIDATION,
            showToast: true
          }
        case 422:
          return {
            message: data?.error?.message || '數據驗證失敗',
            level: ErrorLevel.WARNING,
            category: ErrorCategory.VALIDATION,
            showToast: true
          }
        case 429:
          return {
            message: '請求過於頻繁，請稍後再試',
            level: ErrorLevel.WARNING,
            category: ErrorCategory.API,
            showToast: true
          }
        case 500:
          return {
            message: '服務器內部錯誤，請稍後再試',
            level: ErrorLevel.ERROR,
            category: ErrorCategory.API,
            showToast: true
          }
        case 502:
        case 503:
        case 504:
          return {
            message: '服務暫時不可用，請稍後再試',
            level: ErrorLevel.ERROR,
            category: ErrorCategory.NETWORK,
            showToast: true
          }
        default:
          return {
            message: data?.error?.message || `請求失敗 (${status})`,
            level: ErrorLevel.ERROR,
            category: ErrorCategory.API,
            showToast: true
          }
      }
    } else if (error.request) {
      // 網絡錯誤
      return {
        message: '網絡連接失敗，請檢查網絡設置',
        level: ErrorLevel.ERROR,
        category: ErrorCategory.NETWORK,
        showToast: true
      }
    } else if (error.code === 'ECONNABORTED') {
      // 超時錯誤
      return {
        message: '請求超時，請稍後再試',
        level: ErrorLevel.WARNING,
        category: ErrorCategory.NETWORK,
        showToast: true
      }
    } else {
      // 其他錯誤
      return {
        message: error.message || '發生未知錯誤',
        level: ErrorLevel.ERROR,
        category: ErrorCategory.UNKNOWN,
        showToast: true
      }
    }
  }

  // 顯示錯誤 Toast
  private showErrorToast(message: string, status?: number): void {
    const title = status ? `錯誤 ${status}` : '錯誤'
    toast.error(message, title)
  }
}

// 導出默認實例
export const customErrorHandler = new CustomErrorHandler()
