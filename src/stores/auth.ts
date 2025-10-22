import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userType = computed(() => user.value?.userType)
  const isJobSeeker = computed(() => user.value?.userType === 'job_seeker')
  const isEmployer = computed(() => user.value?.userType === 'employer')

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

    // 清除 localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
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
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        error.value = null
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
    } catch {
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

    // Computed
    isAuthenticated,
    userType,
    isJobSeeker,
    isEmployer,

    // Actions
    setAuth,
    clearAuth,
    setLoading,
    setError,
    loadAuth,
    updateUser,
    persistAuth,
    isTokenExpired
  }
})
