import axios from 'axios'
import type { ApiResponse } from '@/types'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Generic API methods
export const apiService = {
  get: <T>(url: string): Promise<ApiResponse<T>> => api.get(url).then((response) => response.data),

  post: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    api.post(url, data).then((response) => response.data),

  put: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    api.put(url, data).then((response) => response.data),

  delete: <T>(url: string): Promise<ApiResponse<T>> =>
    api.delete(url).then((response) => response.data),
}

export { api }
export default api
