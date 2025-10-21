import { useAuthStore } from '@/stores/auth'

// 錯誤處理器介面（本地定義以避免循環依賴與錯誤匯入）
export interface ErrorHandler {
  handleApiError(error: any): void
}

// 自定義錯誤處理器，與 Pinia store 集成
export class CustomErrorHandler implements ErrorHandler {
  handleApiError(error: any): void {
    const authStore = useAuthStore()

    // 根據錯誤類型設置相應的錯誤信息
    let errorMessage = '發生未知錯誤'

    if (error.response) {
      // 服務器響應錯誤
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          errorMessage = data?.error?.message || '請求參數錯誤'
          break
        case 401:
          errorMessage = '登入已過期，請重新登入'
          authStore.clearAuth()
          break
        case 403:
          errorMessage = '您沒有權限執行此操作'
          break
        case 404:
          errorMessage = '請求的資源不存在'
          break
        case 409:
          errorMessage = data?.error?.message || '數據衝突，請檢查後重試'
          break
        case 422:
          errorMessage = data?.error?.message || '數據驗證失敗'
          break
        case 429:
          errorMessage = '請求過於頻繁，請稍後再試'
          break
        case 500:
          errorMessage = '服務器內部錯誤，請稍後再試'
          break
        case 502:
        case 503:
        case 504:
          errorMessage = '服務暫時不可用，請稍後再試'
          break
        default:
          errorMessage = data?.error?.message || `請求失敗 (${status})`
      }
    } else if (error.request) {
      // 網絡錯誤
      errorMessage = '網絡連接失敗，請檢查網絡設置'
    } else if (error.code === 'ECONNABORTED') {
      // 超時錯誤
      errorMessage = '請求超時，請稍後再試'
    } else {
      // 其他錯誤
      errorMessage = error.message || '發生未知錯誤'
    }

    // 設置錯誤信息到 store
    authStore.setError(errorMessage)

    // 記錄詳細錯誤信息到控制台（開發環境）
    if (import.meta.env.DEV) {
      console.group('API 錯誤詳情')
      console.error('錯誤信息:', errorMessage)
      console.error('原始錯誤:', error)
      console.error('請求配置:', error.config)
      console.error('響應數據:', error.response?.data)
      console.groupEnd()
    }

    // 發送錯誤報告到監控服務（生產環境）
    if (import.meta.env.PROD) {
      this.reportError(error)
    }
  }

  // 發送錯誤報告到監控服務
  private async reportError(error: any): Promise<void> {
    try {
      const errorReport = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: useAuthStore().user?.id,
        requestId: error.config?.headers?.['X-Request-ID']
      }

      // 這裡可以發送到錯誤監控服務
      // await fetch('/api/v1/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })

      console.log('錯誤報告已發送:', errorReport)
    } catch (reportError) {
      console.error('發送錯誤報告失敗:', reportError)
    }
  }
}

// 導出默認實例
export const customErrorHandler = new CustomErrorHandler()
