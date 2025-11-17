import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

import { InstructorStatusService, type InstructorStatus } from '@/services/instructor-status'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const instructorStatus = ref<InstructorStatus | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userType = computed(() => user.value?.userType)
  const isJobSeeker = computed(() => user.value?.userType === 'job_seeker')
  const isEmployer = computed(() => user.value?.userType === 'employer')
  const isInstructor = computed(() => user.value?.userType === 'instructor')
  const isAdmin = computed(() => user.value?.userType === 'admin')

  // 檢查是否為已通過審核的講師
  const isApprovedInstructor = computed(() => {
    return instructorStatus.value?.isApprovedInstructor ?? false
  })

  // Actions
  function setAuth(authUser: User, authToken: string) {
    user.value = authUser
    token.value = authToken
    error.value = null

    // 持久化到 localStorage
    persistAuth()
  }

  function clearAuth() {
    user.value = null
    token.value = null
    error.value = null
    instructorStatus.value = null

    // 清除 localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('refresh_token')
    
    // 清除 sessionStorage
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('token_expiry')
    sessionStorage.removeItem('user')
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  // 持久化中間件
  function persistAuth() {
    if (token.value && user.value) {
      try {
        localStorage.setItem('auth_token', token.value)
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      } catch (err) {
        console.error('Failed to persist auth data:', err)
        setError('無法保存登入狀態')
      }
    }
  }

  function loadAuth() {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')

      if (storedToken && storedUser) {
        // 先驗證 token 是否可以被正確解析（避免中文字符問題）
        try {
          const parts = storedToken.split('.')
          if (parts.length === 3 && parts[1]) {
            // 嘗試解析 payload，如果失敗就清除舊 token
            JSON.parse(atob(parts[1]))
          }
          
          // Token 可以正確解析，設置到 store
          token.value = storedToken
          user.value = JSON.parse(storedUser)
          error.value = null
        } catch (parseError) {
          console.warn('[Auth] 偵測到舊版 token（包含中文或無效字符），已自動清除')
          // Token 解析失敗，清除所有舊資料
          clearAuth()
        }
      }
    } catch (error) {
      console.error('Error loading auth from localStorage:', error)
      clearAuth()
      setError('登入狀態載入失敗')
    }
  }

  function updateUser(updatedUser: User) {
    user.value = updatedUser
    persistAuth()
  }

  // 檢查講師狀態
  async function checkInstructorStatus() {
    if (!user.value?.id) return

    try {
      const status = await InstructorStatusService.checkInstructorStatus(user.value.id)
      instructorStatus.value = status
    } catch (error) {
      console.error('檢查講師狀態失敗:', error)
      instructorStatus.value = { isApprovedInstructor: false }
    }
  }

  // 清除講師狀態
  function clearInstructorStatus() {
    instructorStatus.value = null
  }

  // 檢查 token 是否過期 (簡單檢查)
  function isTokenExpired(): boolean {
    if (!token.value) return true

    try {
      // 簡單的 JWT 解析 (不驗證簽名)
      const part = token.value.split('.')[1] ?? ''
      const payload = JSON.parse(atob(String(part)))

      // 如果沒有 exp 字段，視為已過期
      if (!payload.exp) {
        console.warn('[Auth] Token 沒有過期時間，視為已過期')
        return true
      }

      const now = Math.floor(Date.now() / 1000)
      return payload.exp < now
    } catch (error) {
      console.error('[Auth] Token 解析失敗 (可能包含中文或無效字符)，清除舊 token:', error)
      // 解析失敗時清除舊 token，強制用戶重新登入
      clearAuth()
      return true
    }
  }

  // 初始化時載入認證狀態
  loadAuth()

  return {
    // State
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    error: readonly(error),
    instructorStatus: readonly(instructorStatus),

    // Computed
    isAuthenticated,
    userType,
    isJobSeeker,
    isEmployer,
    isInstructor,
    isAdmin,
    isApprovedInstructor,

    // Actions
    setAuth,
    clearAuth,
    setLoading,
    setError,
    loadAuth,
    updateUser,
    persistAuth,
    isTokenExpired,
    checkInstructorStatus,
    clearInstructorStatus
  }
})
