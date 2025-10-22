import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'

import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types'

// 錯誤處理器接口
interface ErrorHandler {
  handleApiError(error: any): void
}

// 默認錯誤處理器
class DefaultErrorHandler implements ErrorHandler {
  handleApiError(error: any): void {
    console.error('API Error:', error)

    // 根據錯誤類型提供用戶友好的錯誤信息
    if (error.response?.status >= 500) {
      console.error('服務器錯誤，請稍後再試')
    } else if (error.response?.status === 404) {
      console.error('請求的資源不存在')
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('網絡連接失敗，請檢查網絡設置')
    }
  }
}

// 全局錯誤處理器實例
let errorHandler: ErrorHandler = new DefaultErrorHandler()

// 設置錯誤處理器
export const setErrorHandler = (handler: ErrorHandler): void => {
  errorHandler = handler
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Mock API responses removed - using real API endpoints
const mockApiResponses: Record<string, any> = {}

// 擴充 axios 請求的自訂 metadata 型別
declare module 'axios' {
  interface InternalAxiosRequestConfig<D = any> {
    __isRetryRequest?: boolean
    __retryCount?: number
  }
}

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加請求 ID 用於追蹤
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor with retry mechanism and enhanced error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async error => {
    const config: InternalAxiosRequestConfig | undefined = error.config

    // 重試機制
    if (config && !config.__isRetryRequest && error.response?.status >= 500) {
      config.__isRetryRequest = true
      config.__retryCount = (config.__retryCount ?? 0) + 1

      if (config.__retryCount <= 3) {
        // 指數退避延遲
        const delay = Math.pow(2, config.__retryCount) * 1000
        console.log(`重試請求 ${config.__retryCount}/3，延遲 ${delay}ms`)

        await new Promise(resolve => setTimeout(resolve, delay))
        return api.request(config as AxiosRequestConfig)
      }
    }

    // 處理認證錯誤
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.clearAuth()

      // 避免重複跳轉
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // 統一錯誤處理
    errorHandler.handleApiError(error)

    return Promise.reject(error)
  }
)

// 增強的 API 服務方法
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.get(url, config).then(response => response.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.post(url, data, config).then(response => response.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then(response => response.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.delete(url, config).then(response => response.data),

  // 上傳文件方法
  upload: <T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const uploadConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    }
    return api.post(url, formData, uploadConfig).then(response => response.data)
  },

  // 下載文件方法
  download: (url: string, filename?: string): Promise<void> => {
    return api.get(url, { responseType: 'blob' }).then(response => {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  }
}

export { api }
export default api
