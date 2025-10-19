<template>
  <div class="profile-view">
    <section class="section">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-two-thirds">
            <div class="card">
              <div class="card-content">
                <div class="has-text-centered mb-5">
                  <h1 class="title is-3">個人資料</h1>
                </div>

                <!-- Loading state -->
                <div v-if="isLoading" class="has-text-centered">
                  <div class="loader"></div>
                  <p>載入中...</p>
                </div>

                <!-- Error message -->
                <div v-else-if="errorMessage" class="notification is-danger">
                  {{ errorMessage }}
                </div>

                <!-- User profile -->
                <div v-else-if="user" class="content">
                  <div class="field">
                    <label class="label">身份類型</label>
                    <div class="control">
                      <span class="tag is-primary is-medium">
                        {{ user.userType === 'job_seeker' ? '求職者' : '雇主' }}
                      </span>
                    </div>
                  </div>

                  <div class="columns">
                    <div class="column">
                      <div class="field">
                        <label class="label">姓</label>
                        <div class="control">
                          <input class="input" type="text" :value="user.lastName" readonly />
                        </div>
                      </div>
                    </div>
                    <div class="column">
                      <div class="field">
                        <label class="label">名</label>
                        <div class="control">
                          <input class="input" type="text" :value="user.firstName" readonly />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">電子郵件</label>
                    <div class="control">
                      <input class="input" type="email" :value="user.email" readonly />
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">電話號碼</label>
                    <div class="control">
                      <input class="input" type="tel" :value="user.phone || '未提供'" readonly />
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">註冊時間</label>
                    <div class="control">
                      <input class="input" type="text" :value="formatDate(user.createdAt)" readonly />
                    </div>
                  </div>

                  <div class="field is-grouped">
                    <div class="control">
                      <button class="button is-primary" @click="editProfile">編輯資料</button>
                    </div>
                    <div class="control">
                      <router-link to="/learning-progress" class="button is-info">
                        <span class="icon">
                          <i class="fas fa-chart-line"></i>
                        </span>
                        <span>學習進度</span>
                      </router-link>
                    </div>
                    <div class="control">
                      <button class="button is-light" @click="logout">登出</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth-service'
import type { User } from '@/types'

const router = useRouter()

// Component state
const user = ref<User | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

// Format date helper
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Load user profile
const loadProfile = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // First try to get user from localStorage
    const cachedUser = authService.getCurrentUser()
    if (cachedUser) {
      user.value = cachedUser
    }
    
    // Then fetch fresh data from API
    const freshUser = await authService.getProfile()
    user.value = freshUser
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '載入用戶資料失敗'
  } finally {
    isLoading.value = false
  }
}

// Edit profile (placeholder)
const editProfile = () => {
  // TODO: Implement profile editing
  alert('編輯功能將在後續版本中實現')
}

// Logout
const logout = async () => {
  try {
    await authService.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Force logout even if API call fails
    router.push('/login')
  }
}

// Load profile on component mount
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>