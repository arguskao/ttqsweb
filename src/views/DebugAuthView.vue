<template>
  <div class="container mt-5">
    <div class="box">
      <h1 class="title">🔍 認證狀態調試</h1>
      
      <div class="content">
        <h3>當前認證狀態</h3>
        <table class="table is-striped">
          <tbody>
            <tr>
              <td><strong>是否已登入</strong></td>
              <td>{{ authStore.isAuthenticated ? '✅ 是' : '❌ 否' }}</td>
            </tr>
            <tr>
              <td><strong>用戶類型</strong></td>
              <td>{{ authStore.userType || '無' }}</td>
            </tr>
            <tr>
              <td><strong>是否為管理員</strong></td>
              <td>{{ authStore.isAdmin ? '✅ 是' : '❌ 否' }}</td>
            </tr>
            <tr>
              <td><strong>用戶ID</strong></td>
              <td>{{ authStore.user?.id || '無' }}</td>
            </tr>
            <tr>
              <td><strong>用戶名稱</strong></td>
              <td>{{ `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim() || '無' }}</td>
            </tr>
            <tr>
              <td><strong>用戶郵箱</strong></td>
              <td>{{ authStore.user?.email || '無' }}</td>
            </tr>
          </tbody>
        </table>

        <h3>本地存儲狀態</h3>
        <table class="table is-striped">
          <tbody>
            <tr>
              <td><strong>localStorage auth_token</strong></td>
              <td>{{ localToken ? '✅ 存在' : '❌ 不存在' }}</td>
            </tr>
            <tr>
              <td><strong>localStorage auth_user</strong></td>
              <td>{{ localUser ? '✅ 存在' : '❌ 不存在' }}</td>
            </tr>
            <tr>
              <td><strong>sessionStorage access_token</strong></td>
              <td>{{ sessionToken ? '✅ 存在' : '❌ 不存在' }}</td>
            </tr>
            <tr>
              <td><strong>sessionStorage user</strong></td>
              <td>{{ sessionUser ? '✅ 存在' : '❌ 不存在' }}</td>
            </tr>
          </tbody>
        </table>

        <h3>用戶詳細資料</h3>
        <pre><code>{{ JSON.stringify(authStore.user, null, 2) }}</code></pre>

        <h3>本地存儲詳細資料</h3>
        <h4>localStorage auth_user:</h4>
        <pre><code>{{ localUserData }}</code></pre>
        
        <h4>sessionStorage user:</h4>
        <pre><code>{{ sessionUserData }}</code></pre>

        <div class="buttons mt-4">
          <button class="button is-primary" @click="refreshAuth">重新載入認證狀態</button>
          <router-link to="/admin/training-plans" class="button is-warning">
            嘗試訪問訓練計畫頁面
          </router-link>
          <router-link to="/" class="button is-light">回到首頁</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const localToken = ref<string | null>(null)
const localUser = ref<string | null>(null)
const sessionToken = ref<string | null>(null)
const sessionUser = ref<string | null>(null)
const localUserData = ref<string>('')
const sessionUserData = ref<string>('')

function loadStorageData() {
  localToken.value = localStorage.getItem('auth_token')
  localUser.value = localStorage.getItem('auth_user')
  sessionToken.value = sessionStorage.getItem('access_token')
  sessionUser.value = sessionStorage.getItem('user')
  
  try {
    localUserData.value = localStorage.getItem('auth_user') 
      ? JSON.stringify(JSON.parse(localStorage.getItem('auth_user')!), null, 2)
      : '無資料'
  } catch {
    localUserData.value = localStorage.getItem('auth_user') || '無資料'
  }
  
  try {
    sessionUserData.value = sessionStorage.getItem('user')
      ? JSON.stringify(JSON.parse(sessionStorage.getItem('user')!), null, 2)
      : '無資料'
  } catch {
    sessionUserData.value = sessionStorage.getItem('user') || '無資料'
  }
}

function refreshAuth() {
  authStore.loadAuth()
  loadStorageData()
}

onMounted(() => {
  loadStorageData()
})
</script>