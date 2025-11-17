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
  private readonly refreshTokenKey = 'refresh_token'
  private readonly accessTokenKey = 'access_token'
  private readonly tokenExpiryKey = 'token_expiry'

  // 註冊用戶
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const authStore = useAuthStore()

    try {
      authStore.setLoading(true)
      authStore.setError(null)

      const response = await apiService.post<AuthResponse>('/auth/register', data)

      if (response.success && response.data) {
        // 適配後端實際返回的格式
        const token = (response.data as any).token || response.data.tokens?.accessToken
        const refreshToken = (response.data as any).refreshToken || response.data.tokens?.refreshToken || token
        
        if (token) {
          // 直接存儲 token 到 sessionStorage
          sessionStorage.setItem(this.accessTokenKey, token)
          sessionStorage.setItem(this.tokenExpiryKey, (Date.now() + 3600 * 1000).toString())
          localStorage.setItem(this.refreshTokenKey, refreshToken)
          
          // 存儲用戶資料到 sessionStorage
          sessionStorage.setItem('user', JSON.stringify(response.data.user))
          authStore.setAuth(response.data.user, token)
          return { user: response.data.user, token }
        }
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
        // 適配後端實際返回的格式
        const token = (response.data as any).token || response.data.tokens?.accessToken
        const refreshToken = (response.data as any).refreshToken || response.data.tokens?.refreshToken || token
        
        if (token) {
          // 直接存儲 token 到 sessionStorage
          sessionStorage.setItem(this.accessTokenKey, token)
          sessionStorage.setItem(this.tokenExpiryKey, (Date.now() + 3600 * 1000).toString()) // 默認 1 小時
          localStorage.setItem(this.refreshTokenKey, refreshToken)
          
          // 存儲用戶資料到 sessionStorage
          sessionStorage.setItem('user', JSON.stringify(response.data.user))
          authStore.setAuth(response.data.user, token)
          return { user: response.data.user, token }
        }
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

      console.log('[getProfile] Fetching profile from /auth/profile')
      console.log('[getProfile] Token:', sessionStorage.getItem(this.accessTokenKey))

      const response = await apiService.get<User>('/auth/profile')

      console.log('[getProfile] Response:', response)

      if (response.success && response.data) {
        authStore.updateUser(response.data)
        return response.data
      }

      throw new Error(response.error?.message || '獲取用戶資料失敗')
    } catch (error) {
      console.error('[getProfile] Error:', error)
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

      console.log('[updateProfile] Updating profile with data:', data)

      const response = await apiService.put<{ user: User }>('/auth/profile', data)

      console.log('[updateProfile] Response:', response)

      if (response.success && response.data) {
        // 更新 auth store
        authStore.updateUser(response.data.user)

        // 同時更新 sessionStorage 中的用戶資料
        sessionStorage.setItem('user', JSON.stringify(response.data.user))

        console.log('[updateProfile] Profile updated successfully')

        return response.data.user
      }

      throw new Error(response.error?.message || '更新用戶資料失敗')
    } catch (error) {
      console.error('[updateProfile] Error:', error)
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
    sessionStorage.removeItem('user')
    localStorage.removeItem(this.refreshTokenKey)
  }

  // 獲取 refresh token
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey)
  }

  // 檢查 token 是否過期
  isTokenExpired(): boolean {
    // First check sessionStorage
    const sessionExpiry = sessionStorage.getItem(this.tokenExpiryKey)
    if (sessionExpiry) {
      const expiryTimestamp = parseInt(sessionExpiry, 10)
      const currentTime = Date.now()
      const bufferTime = 60 * 1000 // 1 minute buffer
      return currentTime >= expiryTimestamp - bufferTime
    }

    // Fallback: check token directly from either storage
    const sessionToken = sessionStorage.getItem(this.accessTokenKey)
    const localToken = localStorage.getItem('auth_token')
    const token = sessionToken || localToken

    if (!token) return true

    try {
      // 簡單的 JWT 解析 (不驗證簽名)
      const parts = token.split('.')
      if (parts.length !== 3) return true

      const payload = JSON.parse(atob(parts[1] || ''))

      // 如果沒有 exp 字段，檢查是否是我們的測試 token
      if (!payload.exp) {
        console.warn('[Auth] Token 沒有過期時間')
        // For tokens without expiry, assume they're valid for a reasonable time
        // or implement your own logic here
        return false // Don't expire tokens without exp field for now
      }

      const now = Math.floor(Date.now() / 1000)
      const bufferTime = 60 // 1 minute buffer in seconds
      return payload.exp < (now + bufferTime)
    } catch (error) {
      console.error('[Auth] Token parsing error (可能包含中文或無效字符):', error)
      // 解析失敗時清除舊 token，強制用戶重新登入
      this.clearTokens()
      return true
    }
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
    const sessionToken = sessionStorage.getItem(this.accessTokenKey)
    const localToken = localStorage.getItem('auth_token')
    const token = sessionToken || localToken
    const isExpired = this.isTokenExpired()
    const hasUser = !!authStore.user

    console.log('isAuthenticated check:', {
      hasSessionToken: !!sessionToken,
      hasLocalToken: !!localToken,
      hasToken: !!token,
      isExpired,
      hasUser,
      user: authStore.user
    })

    // If we have a valid token but no user in store, try to sync
    if (token && !isExpired && !hasUser) {
      console.log('Token valid but no user in store, attempting to sync...')
      const sessionUser = sessionStorage.getItem('user')
      const localUser = localStorage.getItem('auth_user')
      const userStr = sessionUser || localUser

      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          authStore.setAuth(userData, token)
          console.log('Auth state synced successfully')
          return true
        } catch (error) {
          console.error('Failed to sync auth state:', error)
        }
      }
    }

    return !!token && !isExpired && !!authStore.user
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
      const userDataStr = sessionStorage.getItem('user')

      if (token && refreshToken && userDataStr) {
        try {
          // 先驗證 token 是否可以被正確解析
          const parts = token.split('.')
          if (parts.length === 3) {
            JSON.parse(atob(parts[1]))
          }
          
          const userData = JSON.parse(userDataStr)

          if (this.isTokenExpired()) {
            // Token 過期，嘗試刷新
            try {
              const newToken = await this.refreshToken()
              authStore.setAuth(userData, newToken)
            } catch {
              // 刷新失敗，清除認證狀態
              this.clearTokens()
              authStore.clearAuth()
            }
          } else {
            // Token 有效，直接使用存儲的用戶資料
            authStore.setAuth(userData, token)
          }
        } catch (error) {
          console.warn('[Auth] 偵測到無效 token，已自動清除')
          this.clearTokens()
          authStore.clearAuth()
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
