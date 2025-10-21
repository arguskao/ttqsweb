import { apiService } from './api'
import { useAuthStore } from '@/stores/auth'
import type { User, LoginCredentials, RegisterData } from '@/types'

// 增強的認證響應接口
interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface AuthResponse {
  user: User
  tokens: TokenResponse
}

// 認證安全增強服務
export class AuthServiceEnhanced {
  private refreshPromise: Promise<string> | null = null
  private refreshTokenKey = 'refresh_token'
  private accessTokenKey = 'access_token'
  private tokenExpiryKey = 'token_expiry'

  // 註冊用戶
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.post<AuthResponse>('/auth/register', data)

      if (response.success && response.data) {
        this.setTokens(response.data.tokens)
        authStore.setAuth(response.data.user, response.data.tokens.accessToken)
        return { user: response.data.user, token: response.data.tokens.accessToken }
      }

      throw new Error(response.error?.message || '註冊失敗')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '註冊失敗'
      authStore.setError(errorMessage)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  // 登入用戶
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.post<AuthResponse>('/auth/login', credentials)

      if (response.success && response.data) {
        this.setTokens(response.data.tokens)
        authStore.setAuth(response.data.user, response.data.tokens.accessToken)
        return { user: response.data.user, token: response.data.tokens.accessToken }
      }

      throw new Error(response.error?.message || '登入失敗')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登入失敗'
      authStore.setError(errorMessage)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  // 登出用戶
  async logout(): Promise<void> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)

      // 嘗試撤銷 refresh token
      try {
        await apiService.post('/auth/logout', {
          refreshToken: this.getRefreshToken()
        })
      } catch (error) {
        console.warn('Logout API call failed:', error)
      }
    } finally {
      this.clearTokens()
      authStore.clearAuth()
      authStore.setLoading(false)
    }
  }

  // 獲取用戶資料
  async getProfile(): Promise<User> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.get<{ user: User }>('/auth/profile')

      if (response.success && response.data) {
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
  }

  // 更新用戶資料
  async updateProfile(
    data: Partial<{ firstName: string; lastName: string; phone: string }>
  ): Promise<User> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.put<{ user: User }>('/auth/profile', data)

      if (response.success && response.data) {
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
  }

  // 設置tokens
  private setTokens(tokens: TokenResponse): void {
    // Access token 存儲在 sessionStorage (更安全)
    sessionStorage.setItem(this.accessTokenKey, tokens.accessToken)
    sessionStorage.setItem(this.tokenExpiryKey, (Date.now() + tokens.expiresIn * 1000).toString())

    // Refresh token 存儲在 httpOnly cookie (由後端設置)
    // 這裡我們暫時存儲在 localStorage，實際應用中應該由後端設置 httpOnly cookie
    localStorage.setItem(this.refreshTokenKey, tokens.refreshToken)
  }

  // 清除tokens
  private clearTokens(): void {
    sessionStorage.removeItem(this.accessTokenKey)
    sessionStorage.removeItem(this.tokenExpiryKey)
    localStorage.removeItem(this.refreshTokenKey)
  }

  // 獲取 refresh token
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey)
  }

  // 檢查 token 是否過期
  isTokenExpired(): boolean {
    const expiry = sessionStorage.getItem(this.tokenExpiryKey)
    if (!expiry) return true

    // 提前1分鐘刷新
    const expiryTimestamp = parseInt(expiry, 10)
    const currentTime = Date.now()
    const bufferTime = 60 * 1000 // 1 minute buffer

    // Token 過期當且僅當當前時間 >= (過期時間 - 緩衝時間)
    return currentTime >= expiryTimestamp - bufferTime
  }

  // 刷新 access token
  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performTokenRefresh()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  // 執行 token 刷新
  private async performTokenRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`
        },
        credentials: 'include' // 包含 httpOnly cookies
      })

      if (!response.ok) {
        this.clearTokens()
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      if (data.success && data.data) {
        this.setTokens(data.data.tokens)
        return data.data.tokens.accessToken
      }

      throw new Error('Invalid refresh response')
    } catch (error) {
      this.clearTokens()
      throw error
    }
  }

  // 獲取有效的 access token
  async getValidToken(): Promise<string | null> {
    const token = sessionStorage.getItem(this.accessTokenKey)

    if (!token) return null

    if (this.isTokenExpired()) {
      try {
        return await this.refreshToken()
      } catch {
        return null
      }
    }

    return token
  }

  // 檢查用戶是否已認證
  isAuthenticated(): boolean {
    const authStore = useAuthStore()
    const token = sessionStorage.getItem(this.accessTokenKey)
    return !!token && !this.isTokenExpired() && !!authStore.user
  }

  // 獲取當前用戶
  getCurrentUser(): User | null {
    const authStore = useAuthStore()
    return authStore.user
  }

  // 獲取當前 token
  getToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey)
  }

  // 初始化認證狀態
  async initializeAuth(): Promise<void> {
    const authStore = useAuthStore()

    try {
      // 嘗試從存儲中恢復認證狀態
      const token = sessionStorage.getItem(this.accessTokenKey)
      const refreshToken = this.getRefreshToken()

      if (token && refreshToken) {
        if (this.isTokenExpired()) {
          // Token 過期，嘗試刷新
          try {
            const newToken = await this.refreshToken()
            // 獲取用戶資料
            const user = await this.getProfile()
            authStore.setAuth(user, newToken)
          } catch {
            // 刷新失敗，清除認證狀態
            this.clearTokens()
            authStore.clearAuth()
          }
        } else {
          // Token 有效，獲取用戶資料
          try {
            const user = await this.getProfile()
            authStore.setAuth(user, token)
          } catch {
            // 獲取用戶資料失敗，清除認證狀態
            this.clearTokens()
            authStore.clearAuth()
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      this.clearTokens()
      authStore.clearAuth()
    }
  }
}

// 導出單例實例
export const authServiceEnhanced = new AuthServiceEnhanced()

// 向後兼容的接口
export const authService = {
  async register(data: RegisterData) {
    const result = await authServiceEnhanced.register(data)
    return { user: result.user, token: result.token }
  },

  async login(credentials: LoginCredentials) {
    const result = await authServiceEnhanced.login(credentials)
    return { user: result.user, token: result.token }
  },

  async logout() {
    await authServiceEnhanced.logout()
  },

  async getProfile() {
    return await authServiceEnhanced.getProfile()
  },

  async updateProfile(data: Partial<{ firstName: string; lastName: string; phone: string }>) {
    return await authServiceEnhanced.updateProfile(data)
  },

  isAuthenticated() {
    return authServiceEnhanced.isAuthenticated()
  },

  getCurrentUser() {
    return authServiceEnhanced.getCurrentUser()
  },

  getToken() {
    return authServiceEnhanced.getToken()
  }
}

// 表單驗證工具函數
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  // 至少8個字符，包含大小寫字母和數字
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

// 表單驗證消息
export const validationMessages = {
  required: '此欄位為必填',
  email: '請輸入有效的電子郵件地址',
  password: '密碼必須至少8個字符，包含字母和數字',
  passwordMatch: '密碼確認不一致',
  userType: '請選擇身份類型'
}
