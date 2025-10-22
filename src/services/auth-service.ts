import { apiService } from './api'

import { useAuthStore } from '@/stores/auth'
import type { User, LoginCredentials, RegisterData } from '@/types'

// Token response interface
interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Authentication response interface
interface AuthResponse {
  user: User
  tokens: TokenResponse
}

// Authentication service
export const authService = {
  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.post<AuthResponse>('/auth/register', data)

      if (response.success && response.data) {
        // 使用 Pinia store 管理狀態
        authStore.setAuth(response.data.user, response.data.tokens.accessToken)
        return response.data
      }

      throw new Error(response.error?.message || '註冊失敗')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '註冊失敗'
      authStore.setError(errorMessage)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.post<AuthResponse>('/auth/login', credentials)

      if (response.success && response.data) {
        // 使用 Pinia store 管理狀態
        authStore.setAuth(response.data.user, response.data.tokens.accessToken)
        return response.data
      }

      throw new Error(response.error?.message || '登入失敗')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登入失敗'
      authStore.setError(errorMessage)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  },

  // Logout user
  async logout(): Promise<void> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      await apiService.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // 使用 Pinia store 清除狀態
      authStore.clearAuth()
      authStore.setLoading(false)
    }
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.get<{ user: User }>('/auth/profile')

      if (response.success && response.data) {
        // 更新 store 中的用戶資料
        authStore.updateUser(response.data.user)
        return response.data.user
      }

      throw new Error(response.error?.message || '獲取用戶資料失敗')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '獲取用戶資料失敗'
      authStore.setError(errorMessage)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  },

  // Update user profile
  async updateProfile(data: Partial<{ firstName: string; lastName: string; phone: string }>): Promise<User> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.put<{ user: User }>('/auth/profile', data)

      if (response.success && response.data) {
        // 更新 store 中的用戶資料
        authStore.updateUser(response.data.user)
        return response.data.user
      }

      throw new Error(response.error?.message || '更新用戶資料失敗')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新用戶資料失敗'
      authStore.setError(errorMessage)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  },

  // Check if user is authenticated (使用 store)
  isAuthenticated(): boolean {
    const authStore = useAuthStore()
    return authStore.isAuthenticated && !authStore.isTokenExpired()
  },

  // Get current user (使用 store)
  getCurrentUser(): User | null {
    const authStore = useAuthStore()
    return authStore.user
  },

  // Get auth token (使用 store)
  getToken(): string | null {
    const authStore = useAuthStore()
    return authStore.token
  }
}

// Form validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, contains letters and numbers
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

// Form validation messages
export const validationMessages = {
  required: '此欄位為必填',
  email: '請輸入有效的電子郵件地址',
  password: '密碼必須至少8個字符，包含字母和數字',
  passwordMatch: '密碼確認不一致',
  userType: '請選擇身份類型'
}
