<template>
  <div class="instructor-profile-view">
    <section class="section">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-four-fifths">
            <!-- Page title -->
            <div class="has-text-centered mb-5">
              <h1 class="title is-2">講師管理中心</h1>
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

            <!-- Not an instructor yet -->
            <div v-else-if="!instructor" class="card">
              <div class="card-content has-text-centered">
                <h2 class="title is-4">成為講師</h2>
                <p class="mb-4">您尚未申請成為講師，立即申請加入我們的講師團隊！</p>
                <button class="button is-primary is-medium" @click="showApplicationForm = true">
                  申請成為講師
                </button>
              </div>
            </div>

            <!-- Instructor profile -->
            <div v-else>
              <!-- Status banner -->
              <div class="notification" :class="statusClass">
                <strong>申請狀態：</strong>
                <span v-if="(instructor.application_status || instructor.status) === 'pending'"
                  >審核中</span
                >
                <span
                  v-else-if="(instructor.application_status || instructor.status) === 'approved'"
                  >已批准</span
                >
                <span v-else>已拒絕</span>

                <span v-if="!instructor.is_active" class="ml-3">
                  <span class="tag is-danger">已停用</span>
                </span>
              </div>

              <!-- Statistics -->
              <div class="columns is-multiline mb-4">
                <div class="column is-3">
                  <div class="box has-text-centered">
                    <p class="heading">平均評分</p>
                    <p class="title">{{ (instructor.average_rating ?? 0).toFixed(1) }}/5.0</p>
                    <p class="subtitle is-6">({{ instructor.total_ratings ?? 0 }} 評價)</p>
                  </div>
                </div>
                <div class="column is-3">
                  <div class="box has-text-centered">
                    <p class="heading">百分制評分</p>
                    <p class="title">
                      {{ ((instructor.average_rating ?? 0) * 20).toFixed(0) }}/100
                    </p>
                  </div>
                </div>
                <div class="column is-3">
                  <div class="box has-text-centered">
                    <p class="heading">授課數量</p>
                    <p class="title">{{ stats?.total_courses ?? 0 }}</p>
                  </div>
                </div>
                <div class="column is-3">
                  <div class="box has-text-centered">
                    <p class="heading">學員人數</p>
                    <p class="title">{{ stats?.total_students ?? 0 }}</p>
                  </div>
                </div>
              </div>

              <!-- Profile information -->
              <div class="card mb-4">
                <header class="card-header">
                  <p class="card-header-title">講師資料</p>
                  <button class="card-header-icon" @click="isEditing = !isEditing">
                    <span class="icon">
                      <i class="fas" :class="isEditing ? 'fa-times' : 'fa-edit'"></i>
                    </span>
                  </button>
                </header>
                <div class="card-content">
                  <div v-if="!isEditing">
                    <div class="field">
                      <label class="label">姓名</label>
                      <p>{{ instructor.first_name }} {{ instructor.last_name }}</p>
                    </div>
                    <div class="field">
                      <label class="label">電子郵件</label>
                      <p>{{ instructor.email }}</p>
                    </div>
                    <div class="field">
                      <label class="label">個人簡介</label>
                      <p>{{ instructor.bio || '未提供' }}</p>
                    </div>
                    <div class="field">
                      <label class="label">資格證明</label>
                      <p>{{ instructor.qualifications || '未提供' }}</p>
                    </div>
                    <div class="field">
                      <label class="label">專業領域</label>
                      <p>{{ instructor.specialization || '未提供' }}</p>
                    </div>
                    <div class="field">
                      <label class="label">工作年資</label>
                      <p>{{ instructor.years_of_experience ?? 0 }} 年</p>
                    </div>
                  </div>

                  <!-- Edit form -->
                  <div v-else>
                    <div class="field">
                      <label class="label">個人簡介</label>
                      <div class="control">
                        <textarea
                          class="textarea"
                          v-model="editForm.bio"
                          placeholder="請介紹您的背景和教學經驗"
                          rows="4"
                        ></textarea>
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">資格證明</label>
                      <div class="control">
                        <textarea
                          class="textarea"
                          v-model="editForm.qualifications"
                          placeholder="請列出您的相關證照和資格"
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">專業領域</label>
                      <div class="control">
                        <input
                          class="input"
                          type="text"
                          v-model="editForm.specialization"
                          placeholder="例如：藥學、保健食品、醫療法規"
                        />
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">工作年資</label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          v-model.number="editForm.years_of_experience"
                          min="0"
                        />
                      </div>
                    </div>
                    <div class="field is-grouped">
                      <div class="control">
                        <button
                          class="button is-primary"
                          @click="updateProfile"
                          :disabled="isSaving"
                        >
                          {{ isSaving ? '儲存中...' : '儲存' }}
                        </button>
                      </div>
                      <div class="control">
                        <button class="button is-light" @click="cancelEdit">取消</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Course management section -->
              <div class="card mb-4">
                <header class="card-header">
                  <p class="card-header-title">課程管理</p>
                </header>
                <div class="card-content">
                  <p class="mb-3">申請開設新課程或管理您的授課資料</p>
                  <div class="buttons">
                    <router-link to="/instructor/course-application" class="button is-primary">
                      <span class="icon">
                        <i class="fas fa-plus"></i>
                      </span>
                      <span>申請開課</span>
                    </router-link>
                    <router-link to="/courses" class="button is-info">
                      <span class="icon">
                        <i class="fas fa-book"></i>
                      </span>
                      <span>瀏覽所有課程</span>
                    </router-link>
                  </div>
                </div>
              </div>

              <!-- Ratings section -->
              <div class="card">
                <header class="card-header">
                  <p class="card-header-title">學員評價</p>
                </header>
                <div class="card-content">
                  <div v-if="ratings.length === 0" class="has-text-centered">
                    <p>尚無評價</p>
                  </div>
                  <div v-else>
                    <div v-for="rating in ratings" :key="rating.id" class="box">
                      <div class="level">
                        <div class="level-left">
                          <div>
                            <p class="heading">
                              {{ rating.student_first_name }} {{ rating.student_last_name }}
                            </p>
                            <p class="subtitle is-6">{{ rating.course_title }}</p>
                          </div>
                        </div>
                        <div class="level-right">
                          <div class="tags has-addons">
                            <span class="tag is-warning">
                              <i class="fas fa-star"></i>
                            </span>
                            <span class="tag is-warning">{{ rating.rating }}/5</span>
                          </div>
                        </div>
                      </div>
                      <p v-if="rating.comment">{{ rating.comment }}</p>
                      <p class="has-text-grey is-size-7 mt-2">
                        {{ formatDate(rating.created_at) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Application form modal -->
            <div class="modal" :class="{ 'is-active': showApplicationForm }">
              <div class="modal-background" @click="showApplicationForm = false"></div>
              <div class="modal-card">
                <header class="modal-card-head">
                  <p class="modal-card-title">講師申請表</p>
                  <button class="delete" @click="showApplicationForm = false"></button>
                </header>
                <section class="modal-card-body">
                  <div class="field">
                    <label class="label">個人簡介 <span class="has-text-danger">*</span></label>
                    <div class="control">
                      <textarea
                        class="textarea"
                        v-model="applicationForm.bio"
                        placeholder="請介紹您的背景和教學經驗"
                        rows="4"
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div class="field">
                    <label class="label">資格證明 <span class="has-text-danger">*</span></label>
                    <div class="control">
                      <textarea
                        class="textarea"
                        v-model="applicationForm.qualifications"
                        placeholder="請列出您的相關證照和資格"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div class="field">
                    <label class="label">專業領域</label>
                    <div class="control">
                      <input
                        class="input"
                        type="text"
                        v-model="applicationForm.specialization"
                        placeholder="例如：藥學、保健食品、醫療法規"
                      />
                    </div>
                  </div>
                  <div class="field">
                    <label class="label">工作年資</label>
                    <div class="control">
                      <input
                        class="input"
                        type="number"
                        v-model.number="applicationForm.years_of_experience"
                        min="0"
                      />
                    </div>
                  </div>
                </section>
                <footer class="modal-card-foot">
                  <button
                    class="button is-primary"
                    @click="submitApplication"
                    :disabled="isSubmitting"
                  >
                    {{ isSubmitting ? '提交中...' : '提交申請' }}
                  </button>
                  <button class="button" @click="showApplicationForm = false">取消</button>
                </footer>
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

import { api } from '@/services/api'

// Component state
const instructor = ref<any>(null)
const stats = ref<any>(null)
const ratings = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const isEditing = ref(false)
const isSaving = ref(false)
const isSubmitting = ref(false)
const showApplicationForm = ref(false)

// Forms
const editForm = ref({
  bio: '',
  qualifications: '',
  specialization: '',
  years_of_experience: 0
})

const applicationForm = ref({
  bio: '',
  qualifications: '',
  specialization: '',
  years_of_experience: 0
})

// Computed status class
const statusClass = ref('is-info')

// Format date helper
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Load instructor profile
const loadProfile = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await api.get('/instructors/profile')

    // 檢查響應格式
    if (response.data?.success === false) {
      // API 返回錯誤
      if (response.status === 404) {
        instructor.value = null
      } else {
        errorMessage.value = response.data.error?.message || '載入講師資料失敗'
      }
    } else {
      // API 返回的格式是 { success: true, data: {...} }
      instructor.value = response.data.data || response.data

      // 初始化編輯表單
      editForm.value = {
        bio: instructor.value.bio ?? '',
        qualifications: instructor.value.qualifications ?? '',
        specialization: instructor.value.specialization ?? '',
        years_of_experience: instructor.value.years_of_experience ?? 0
      }

      // Set status class
      if (instructor.value.application_status === 'approved') {
        statusClass.value = 'is-success'
      } else if (instructor.value.status === 'approved') {
        statusClass.value = 'is-success'
      } else if (instructor.value.application_status === 'rejected') {
        statusClass.value = 'is-danger'
      } else {
        statusClass.value = 'is-info'
      }

      // Load stats and ratings
      await Promise.all([loadStats(), loadRatings()])
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      // User is not an instructor yet
      instructor.value = null
    } else {
      errorMessage.value = error.response?.data?.error?.message || '載入講師資料失敗'
    }
  } finally {
    isLoading.value = false
  }
}

// Load instructor statistics (暫時停用)
const loadStats = async () => {
  console.log('講師個人資料頁面 - 統計 API 暫時停用')
  stats.value = {
    total_courses: 0,
    total_students: 0,
    completion_rate: 0
  }
}

// Load instructor ratings (暫時停用)
const loadRatings = async () => {
  console.log('講師個人資料頁面 - 評價 API 暫時停用')
  ratings.value = []
}

// Submit instructor application
const submitApplication = async () => {
  if (!applicationForm.value.bio || !applicationForm.value.qualifications) {
    alert('請填寫必填欄位')
    return
  }

  try {
    isSubmitting.value = true
    await api.post('/instructors/apply', applicationForm.value)
    showApplicationForm.value = false
    alert('申請已提交，請等待審核')
    await loadProfile()
  } catch (error: any) {
    alert(error.response?.data?.error?.message || '提交申請失敗')
  } finally {
    isSubmitting.value = false
  }
}

// Start editing
const cancelEdit = () => {
  isEditing.value = false
  // Reset form
  if (instructor.value) {
    editForm.value = {
      bio: instructor.value.bio ?? '',
      qualifications: instructor.value.qualifications ?? '',
      specialization: instructor.value.specialization ?? '',
      years_of_experience: instructor.value.years_of_experience ?? 0
    }
  }
}

// Update profile
const updateProfile = async () => {
  try {
    isSaving.value = true
    await api.put('/instructors/profile', editForm.value)
    isEditing.value = false
    alert('資料已更新')
    await loadProfile()
  } catch (error: any) {
    alert(error.response?.data?.error?.message || '更新資料失敗')
  } finally {
    isSaving.value = false
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
