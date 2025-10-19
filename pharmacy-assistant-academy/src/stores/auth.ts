import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref<User | null>(null)
    const token = ref<string | null>(null)

    // Computed
    const isAuthenticated = computed(() => !!token.value && !!user.value)
    const userType = computed(() => user.value?.userType)

    // Actions
    function setAuth(authUser: User, authToken: string) {
        user.value = authUser
        token.value = authToken

        // Store in localStorage
        localStorage.setItem('auth_token', authToken)
        localStorage.setItem('auth_user', JSON.stringify(authUser))
    }

    function clearAuth() {
        user.value = null
        token.value = null

        // Clear from localStorage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
    }

    function loadAuth() {
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')

        if (storedToken && storedUser) {
            try {
                token.value = storedToken
                user.value = JSON.parse(storedUser)
            } catch (error) {
                console.error('Error loading auth from localStorage:', error)
                clearAuth()
            }
        }
    }

    function updateUser(updatedUser: User) {
        user.value = updatedUser
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
    }

    // Initialize auth from localStorage
    loadAuth()

    return {
        user,
        token,
        isAuthenticated,
        userType,
        setAuth,
        clearAuth,
        loadAuth,
        updateUser
    }
})
