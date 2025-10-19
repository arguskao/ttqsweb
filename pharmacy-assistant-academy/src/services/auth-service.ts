import { apiService } from './api'
import type { User, LoginCredentials, RegisterData, ApiResponse } from '@/types'

// Authentication response interface
interface AuthResponse {
    user: User
    token: string
}

// Authentication service
export const authService = {
    // Register new user
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/register', data)

        if (response.success && response.data) {
            // Store token in localStorage
            localStorage.setItem('auth_token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            return response.data
        }

        throw new Error(response.error?.message || '註冊失敗')
    },

    // Login user
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/login', credentials)

        if (response.success && response.data) {
            // Store token in localStorage
            localStorage.setItem('auth_token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            return response.data
        }

        throw new Error(response.error?.message || '登入失敗')
    },

    // Logout user
    async logout(): Promise<void> {
        try {
            await apiService.post('/auth/logout')
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error)
        } finally {
            // Clear local storage
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
        }
    },

    // Get current user profile
    async getProfile(): Promise<User> {
        const response = await apiService.get<{ user: User }>('/auth/profile')

        if (response.success && response.data) {
            return response.data.user
        }

        throw new Error(response.error?.message || '獲取用戶資料失敗')
    },

    // Update user profile
    async updateProfile(data: Partial<{ firstName: string; lastName: string; phone: string }>): Promise<User> {
        const response = await apiService.put<{ user: User }>('/auth/profile', data)

        if (response.success && response.data) {
            // Update user in localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user))
            return response.data.user
        }

        throw new Error(response.error?.message || '更新用戶資料失敗')
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        const token = localStorage.getItem('auth_token')
        return !!token
    },

    // Get current user from localStorage
    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                return JSON.parse(userStr)
            } catch (error) {
                console.error('Error parsing user data:', error)
                localStorage.removeItem('user')
            }
        }
        return null
    },

    // Get auth token
    getToken(): string | null {
        return localStorage.getItem('auth_token')
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