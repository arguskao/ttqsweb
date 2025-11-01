<template>
  <div class="container mt-5">
    <div class="box">
      <h1 class="title">🔧 修復認證狀態</h1>
      
      <div class="content">
        <p>點擊下面的按鈕強制同步認證狀態：</p>
        
        <div class="buttons">
          <button class="button is-primary" @click="forceSync">強制同步認證狀態</button>
          <button class="button is-warning" @click="clearAndReload">清除並重新載入</button>
          <router-link to="/debug-auth" class="button is-info">返回調試頁面</router-link>
        </div>
        
        <div v-if="message" class="notification" :class="messageClass">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const message = ref('')
const messageClass = ref('')

function forceSync() {
  try {
    // 強制從 localStorage 同步到 authStore
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('auth_user')
    
    if (token && userStr) {
      const user = JSON.parse(userStr)
      authStore.setAuth(user, token)
      
      // 同時設置到 sessionStorage
      sessionStorage.setItem('access_token', token)
      sessionStorage.setItem('user', userStr)
      
      message.value = '✅ 認證狀態已強制同步！請嘗試訪問管理頁面。'
      messageClass.value = 'is-success'
      
      // 3秒後跳轉到訓練計畫頁面
      setTimeout(() => {
        router.push('/admin/training-plans')
      }, 3000)
    } else {
      message.value = '❌ 沒有找到認證資料'
      messageClass.value = 'is-danger'
    }
  } catch (error) {
    message.value = `❌ 同步失敗: ${error}`
    messageClass.value = 'is-danger'
  }
}

function clearAndReload() {
  // 清除所有認證資料
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('user')
  authStore.clearAuth()
  
  message.value = '🔄 認證資料已清除，請重新登入'
  messageClass.value = 'is-warning'
  
  // 3秒後跳轉到登入頁面
  setTimeout(() => {
    router.push('/auth/login')
  }, 3000)
}
</script>