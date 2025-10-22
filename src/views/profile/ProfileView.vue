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
                          <input
                            class="input"
                            type="text"
                            v-model="editForm.lastName"
                            :readonly="!isEditing"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="column">
                      <div class="field">
                        <label class="label">名</label>
                        <div class="control">
                          <input
                            class="input"
                            type="text"
                            v-model="editForm.firstName"
                            :readonly="!isEditing"
                          />
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
                      <input
                        class="input"
                        type="tel"
                        v-model="editForm.phone"
                        :readonly="!isEditing"
                        placeholder="請輸入電話號碼"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">註冊時間</label>
                    <div class="control">
                      <input class="input" type="text" :value="formatDate(user.createdAt)" readonly />
                    </div>
                  </div>

                  <!-- Success message -->
                  <div v-if="successMessage" class="notification is-success">
                    {{ successMessage }}
                  </div>

                  <!-- Update error message -->
                  <div v-if="updateError" class="notification is-danger">
                    {{ updateError }}
                  </div>

                  <div class="field is-grouped is-grouped-multiline">
                    <div class="control" v-if="!isEditing">
                      <button class="button is-primary" @click="startEdit">編輯資料</button>
                    </div>
                    <div class="control" v-if="isEditing">
                      <button
                        class="button is-success"
                        @click="saveProfile"
                        :class="{ 'is-loading': isSaving }"
                        :disabled="isSaving"
                      >
                        儲存
                      </button>
                    </div>
                    <div class="control" v-if="isEditing">
                      <button
                        class="button is-light"
                        @click="cancelEdit"
                        :disabled="isSaving"
                      >
                        取消
                      </button>
                    </div>
                    <div class="control" v-if="!isEditing && user.userType === 'job_seeker'">
                      <router-link to="/learning-progress" class="button is-info">
                        <span class="icon">
                          <i class="fas fa-chart-line"></i>
                        </span>
                        <span>學習進度</span>
                      </router-link>
                    </div>
                    <div class="control" v-if="!isEditing && user.userType === 'job_seeker'">
                      <router-link to="/learning-history" class="button is-success">
                        <span class="icon">
                          <i class="fas fa-history"></i>
                        </span>
                        <span>學習歷程</span>
                      </router-link>
                    </div>
                    <div class="control" v-if="!isEditing && user.userType === 'job_seeker'">
                      <router-link to="/application-history" class="button is-warning">
                        <span class="icon">
                          <i class="fas fa-briefcase"></i>
                        </span>
                        <span>求職記錄</span>
                      </router-link>
                    </div>
                    <div class="control" v-if="!isEditing">
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
const isEditing = ref(false)
const isSaving = ref(false)
const successMessage = ref('')
const updateError = ref('')

// Edit form state
const editForm = ref({
  firstName: '',
  lastName: '',
  phone: ''
})

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

    // 先顯示緩存的用戶資料（如果有）
    const cachedUser = authService.getCurrentUser()
    if (cachedUser) {
      user.value = cachedUser
      updateEditForm(cachedUser)
    }

    // 從 API 獲取最新的用戶資料
    console.log('Fetching profile from API...')
    const freshUser = await authService.getProfile()
    console.log('Profile fetched successfully:', freshUser)
    user.value = freshUser
    updateEditForm(freshUser)
  } catch (error) {
    console.error('Failed to load profile:', error)
    errorMessage.value = error instanceof Error ? error.message : '載入用戶資料失敗'
  } finally {
    isLoading.value = false
  }
}

// Update edit form with user data
const updateEditForm = (userData: User) => {
  editForm.value = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone ?? ''
  }
}

// Start editing
const startEdit = () => {
  isEditing.value = true
  successMessage.value = ''
  updateError.value = ''
}

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false
  successMessage.value = ''
  updateError.value = ''
  // Reset form to current user data
  if (user.value) {
    updateEditForm(user.value)
  }
}

// Save profile changes
const saveProfile = async () => {
  try {
    isSaving.value = true
    updateError.value = ''
    successMessage.value = ''

    // Validate required fields
    if (!editForm.value.firstName.trim() || !editForm.value.lastName.trim()) {
      updateError.value = '姓名不能為空'
      return
    }

    console.log('Saving profile with data:', {
      firstName: editForm.value.firstName.trim(),
      lastName: editForm.value.lastName.trim(),
      phone: editForm.value.phone.trim() || undefined
    })

    // Update profile
    const updatedUser = await authService.updateProfile({
      firstName: editForm.value.firstName.trim(),
      lastName: editForm.value.lastName.trim(),
      phone: editForm.value.phone.trim() || undefined
    })

    console.log('Profile updated successfully:', updatedUser)

    user.value = updatedUser
    isEditing.value = false
    successMessage.value = '個人資料更新成功'

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Failed to save profile:', error)
    updateError.value = error instanceof Error ? error.message : '更新個人資料失敗'
  } finally {
    isSaving.value = false
  }
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
