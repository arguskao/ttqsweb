import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authServiceEnhanced } from '@/services/auth-service-enhanced'
import type { LoginCredentials, RegisterData } from '@/types/enhanced'

// Mock Pinia store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    setLoading: vi.fn(),
    setError: vi.fn(),
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
    updateUser: vi.fn(),
    user: null
  })
}))

describe('AuthServiceEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear storage mocks
    sessionStorage.clear()
    localStorage.clear()
  })

  describe('isTokenExpired', () => {
    it('should return true when no expiry time is stored', () => {
      expect(authServiceEnhanced.isTokenExpired()).toBe(true)
    })

    it('should return false when token is not expired', () => {
      const futureTime = Date.now() + 600000 // 10 minutes from now (more than 1 minute buffer)
      sessionStorage.setItem('token_expiry', futureTime.toString())
      expect(authServiceEnhanced.isTokenExpired()).toBe(false)
    })

    it('should return true when token is expired', () => {
      const pastTime = Date.now() - 300000 // 5 minutes ago
      sessionStorage.setItem('token_expiry', pastTime.toString())
      expect(authServiceEnhanced.isTokenExpired()).toBe(true)
    })
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            userType: 'job_seeker',
            firstName: 'Test',
            lastName: 'User',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isActive: true
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600
          }
        }
      }

      // Mock the API service directly
      const { apiService } = await import('@/services/api')
      vi.spyOn(apiService, 'post').mockResolvedValue(mockResponse)

      const result = await authServiceEnhanced.login(mockCredentials)

      expect(result.user.email).toBe('test@example.com')
      expect(result.token).toBe('mock-access-token')
      expect(sessionStorage.getItem('access_token')).toBe('mock-access-token')
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
    })

    it('should throw error when login fails', async () => {
      const mockCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const mockResponse = {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: '登入失敗'
        }
      }

      // Mock the API service directly
      const { apiService } = await import('@/services/api')
      vi.spyOn(apiService, 'post').mockResolvedValue(mockResponse)

      await expect(authServiceEnhanced.login(mockCredentials)).rejects.toThrow('登入失敗')
    })
  })

  describe('register', () => {
    it('should successfully register with valid data', async () => {
      const mockRegisterData: RegisterData = {
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'job_seeker',
        firstName: 'New',
        lastName: 'User',
        phone: '0912345678'
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 2,
            email: 'newuser@example.com',
            userType: 'job_seeker',
            firstName: 'New',
            lastName: 'User',
            phone: '0912345678',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isActive: true
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600
          }
        }
      }

      // Mock the API service directly
      const { apiService } = await import('@/services/api')
      vi.spyOn(apiService, 'post').mockResolvedValue(mockResponse)

      const result = await authServiceEnhanced.register(mockRegisterData)

      expect(result.user.email).toBe('newuser@example.com')
      expect(result.token).toBe('mock-access-token')
    })
  })

  describe('logout', () => {
    it('should clear tokens and auth state on logout', async () => {
      // Set up initial state
      sessionStorage.setItem('access_token', 'mock-token')
      localStorage.setItem('refresh_token', 'mock-refresh-token')

      await authServiceEnhanced.logout()

      expect(sessionStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('getValidToken', () => {
    it('should return token when not expired', async () => {
      const futureTime = Date.now() + 600000 // 10 minutes from now (more than 1 minute buffer)
      sessionStorage.setItem('access_token', 'valid-token')
      sessionStorage.setItem('token_expiry', futureTime.toString())

      const token = await authServiceEnhanced.getValidToken()
      expect(token).toBe('valid-token')
    })

    it('should return null when no token exists', async () => {
      const token = await authServiceEnhanced.getValidToken()
      expect(token).toBeNull()
    })
  })
})
