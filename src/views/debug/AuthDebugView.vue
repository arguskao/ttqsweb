<template>
  <div class="auth-debug-view">
    <section class="section">
      <div class="container">
        <h1 class="title">認證狀態調試</h1>

        <div class="columns">
          <div class="column">
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">localStorage</p>
              </header>
              <div class="card-content">
                <div class="content">
                  <p><strong>auth_token:</strong></p>
                  <pre>{{ localStorageToken || '無' }}</pre>

                  <p><strong>auth_user:</strong></p>
                  <pre>{{ localStorageUser || '無' }}</pre>
                </div>
              </div>
            </div>
          </div>

          <div class="column">
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">sessionStorage</p>
              </header>
              <div class="card-content">
                <div class="content">
                  <p><strong>access_token:</strong></p>
                  <pre>{{ sessionStorageToken || '無' }}</pre>

                  <p><strong>user:</strong></p>
                  <pre>{{ sessionStorageUser || '無' }}</pre>

                  <p><strong>token_expiry:</strong></p>
                  <pre>{{ sessionStorageExpiry || '無' }}</pre>

                  <p><strong>是否過期:</strong></p>
                  <pre>{{ isTokenExpired ? '是' : '否' }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <header class="card-header">
            <p class="card-header-title">Auth Store 狀態</p>
          </header>
          <div class="card-content">
            <div class="content">
              <p><strong>isAuthenticated:</strong> {{ authStore.isAuthenticated }}</p>
              <p><strong>user:</strong></p>
              <pre>{{ JSON.stringify(authStore.user, null, 2) }}</pre>
              <p><strong>token:</strong></p>
              <pre>{{ authStore.token || '無' }}</pre>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <header class="card-header">
            <p class="card-header-title">操作</p>
          </header>
          <div class="card-content">
            <div class="buttons">
              <button class="button is-primary" @click="refreshAuth">重新載入認證</button>
              <button class="button is-warning" @click="syncStorage">同步儲存</button>
              <button class="button is-danger" @click="clearAuth">清除認證</button>
              <button class="button is-info" @click="testToken">測試 Token</button>
            </div>
          </div>
        </div>

        <div v-if="testResult" class="card mt-4">
          <header class="card-header">
            <p class="card-header-title">測試結果</p>
          </header>
          <div class="card-content">
            <div class="content">
              <pre>{{ testResult }}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'

const authStore = useAuthStore()

const localStorageToken = ref<string | null>(null)
const localStorageUser = ref<string | null>(null)
const sessionStorageToken = ref<string | null>(null)
const sessionStorageUser = ref<string | null>(null)
const sessionStorageExpiry = ref<string | null>(null)
const testResult = ref<string>('')

const isTokenExpired = computed(() => {
  if (!sessionStorageExpiry.value) return true
  return Date.now() > parseInt(sessionStorageExpiry.value, 10)
})

const loadStorageData = () => {
  localStorageToken.value = localStorage.getItem('auth_token')
  localStorageUser.value = localStorage.getItem('auth_user')
  sessionStorageToken.value = sessionStorage.getItem('access_token')
  sessionStorageUser.value = sessionStorage.getItem('user')
  sessionStorageExpiry.value = sessionStorage.getItem('token_expiry')
}

const refreshAuth = () => {
  authStore.loadAuth()
  loadStorageData()
}

const syncStorage = () => {
  // 如果 localStorage 有資料但 sessionStorage 沒有，同步過去
  if (localStorageToken.value && !sessionStorageToken.value) {
    sessionStorage.setItem('access_token', localStorageToken.value)
    if (localStorageUser.value) {
      sessionStorage.setItem('user', localStorageUser.value)
    }
    // 設定 1 小時後過期
    const expiryTime = Date.now() + 60 * 60 * 1000
    sessionStorage.setItem('token_expiry', expiryTime.toString())
  }

  // 如果 sessionStorage 有資料但 localStorage 沒有，同步過去
  if (sessionStorageToken.value && !localStorageToken.value) {
    localStorage.setItem('auth_token', sessionStorageToken.value)
    if (sessionStorageUser.value) {
      localStorage.setItem('auth_user', sessionStorageUser.value)
    }
  }

  loadStorageData()
  authStore.loadAuth()
}

const clearAuth = () => {
  authStore.clearAuth()
  loadStorageData()
}

const testToken = async () => {
  try {
    const token = sessionStorageToken.value || localStorageToken.value
    if (!token) {
      testResult.value = '沒有找到 token'
      return
    }

    // 測試 token 是否有效
    const response = await api.get('/auth/profile')
    testResult.value = `Token 有效！用戶資料：\n${JSON.stringify(response.data, null, 2)}`
  } catch (error: any) {
    testResult.value = `Token 測試失敗：\n${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`
  }
}

onMounted(() => {
  loadStorageData()
})
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}
</style>
