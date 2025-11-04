import axios, { type AxiosRequestConfig } from 'axios'

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

// 解析 API Base URL：正式環境一律使用同源路徑以避免 CORS
const resolveBaseURL = () => {
  const isProd = import.meta.env.MODE === 'production'
  if (isProd) return '/api/v1'
  
  // 開發環境使用環境變數或默認值
  const apiUrl = import.meta.env.VITE_API_BASE_URL
  return apiUrl || '/api/v1'
}

// 創建 axios 實例
const api = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Token 刷新狀態管理
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (error: any) => void
}> = []

// 處理隊列中的請求
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })

  failedQueue = []
}

// 請求攔截器 - 添加認證 token
api.interceptors.request.use(
  async config => {
    // 獲取有效的 access token
    const token = sessionStorage.getItem('access_token')
    const tokenExpiry = sessionStorage.getItem('token_expiry')

    // 只在 token 有效且未過期時才添加到請求中
    if (token && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10)
      const now = Date.now()
      
      if (now < expiryTime) {
        // Token 還沒過期，添加到請求中
        config.headers.Authorization = `Bearer ${token}`
      } else {
        // Token 已過期，清除它
        console.log('Token expired, removing from storage')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('token_expiry')
        sessionStorage.removeItem('user')
      }
    }

    // 添加請求 ID 用於追蹤
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 添加 CSRF token (如果存在)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 響應攔截器 - 處理 token 刷新和錯誤
api.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config

    // 處理 401 錯誤 - token 過期
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新，將請求加入隊列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // 嘗試刷新 token
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(
          '/auth/refresh',
          {
            refreshToken
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.data.success && response.data.data) {
          const {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn
          } = response.data.data.tokens

          // 更新 tokens
          sessionStorage.setItem('access_token', accessToken)
          sessionStorage.setItem('token_expiry', (Date.now() + expiresIn * 1000).toString())
          localStorage.setItem('refresh_token', newRefreshToken)

          // 處理隊列中的請求
          processQueue(null, accessToken)

          // 重試原始請求
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } else {
          throw new Error('Invalid refresh response')
        }
      } catch (refreshError) {
        // 刷新失敗，清除認證狀態
        processQueue(refreshError, null)

        // 只在非公開頁面上清除認證狀態
        const currentPath = window.location.pathname
        const isPublicPage = currentPath === '/' || 
                           currentPath.startsWith('/courses') || 
                           currentPath === '/login' ||
                           currentPath === '/register'
        
        if (!isPublicPage) {
          const authStore = useAuthStore()
          authStore.clearAuth()

          // 清除 tokens
          sessionStorage.removeItem('access_token')
          sessionStorage.removeItem('token_expiry')
          localStorage.removeItem('refresh_token')

          window.location.href = '/login'
        }
        // 在公開頁面上，只是靜默失敗，不清除認證狀態也不跳轉

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 重試機制 - 處理 5xx 錯誤
    if (!originalRequest.__isRetryRequest && error.response?.status >= 500) {
      originalRequest.__isRetryRequest = true
      originalRequest.__retryCount = (originalRequest.__retryCount ?? 0) + 1

      if (originalRequest.__retryCount <= 3) {
        // 指數退避延遲
        const delay = Math.pow(2, originalRequest.__retryCount) * 1000
        console.log(`重試請求 ${originalRequest.__retryCount}/3，延遲 ${delay}ms`)

        await new Promise(resolve => setTimeout(resolve, delay))
        return api(originalRequest)
      }
    }

    // 處理其他認證錯誤
    if (error.response?.status === 403) {
      console.error('權限不足，無法訪問此資源')
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
  },

  // 批量請求方法
  batch: async <T>(requests: Array<() => Promise<ApiResponse<T>>>): Promise<ApiResponse<T>[]> => {
    try {
      return await Promise.all(requests.map(request => request()))
    } catch (error) {
      console.error('Batch request failed:', error)
      throw error
    }
  },

  // 取消請求方法
  createCancelToken: () => {
    return axios.CancelToken.source()
  }
}

export { api }
export default api
