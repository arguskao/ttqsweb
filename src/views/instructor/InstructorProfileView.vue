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
              <!-- Status banner → robust 寫法，顯示正確狀態與顏色 -->
              <div
                class="notification"
                :class="[isApproved ? 'is-success' : isPending ? 'is-warning' : 'is-danger']"
              >
                <strong>申請狀態：</strong>
                <span v-if="isApproved">已核准</span>
                <span v-else-if="isPending">審核中</span>
                <span v-else>已拒絕</span>
                <span v-if="instructor.is_active === false" class="ml-3 tag is-danger">已停用</span>
                <!-- <span style="color:gray;font-size:12px">({{ instructor.application_status }}/{{ instructor.status }})</span> -->
              </div>

              <!-- Statistics -->
              <div class="columns is-multiline mb-4">
                <div class="column is-3">
                  <div class="box has-text-centered">
                    <p class="heading">平均評分</p>
                    <p class="title">{{ (Number(instructor.average_rating) || 0).toFixed(1) }}/5.0</p>
                    <p class="subtitle is-6">({{ instructor.total_ratings ?? 0 }} 評價)</p>
                  </div>
                </div>
                <div class="column is-3">
                  <div class="box has-text-centered">
                    <p class="heading">百分制評分</p>
                    <p class="title">
                      {{ ((Number(instructor.average_rating) || 0) * 20).toFixed(0) }}/100
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
                    <div class="columns">
                      <div class="column is-3">
                        <div class="field">
                          <label class="label">姓名</label>
                          <p>{{ instructor.last_name }}{{ instructor.first_name }}</p>
                        </div>
                      </div>
                      <div class="column is-3">
                        <div class="field">
                          <label class="label">電子郵件</label>
                          <p>{{ instructor.email }}</p>
                        </div>
                      </div>
                      <div class="column is-3">
                        <div class="field">
                          <label class="label">專業領域</label>
                          <p>{{ instructor.specialization || '未提供' }}</p>
                        </div>
                      </div>
                      <div class="column is-3">
                        <div class="field">
                          <label class="label">工作年資</label>
                          <p>{{ instructor.years_of_experience ?? 0 }} 年</p>
                        </div>
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">個人簡介</label>
                      <p>{{ instructor.bio || '未提供' }}</p>
                    </div>
                    <div class="field">
                      <label class="label">資格證明</label>
                      <p>{{ instructor.qualifications || '未提供' }}</p>
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
                  <div class="buttons mb-4">
                    <router-link to="/instructor/course-application" class="button is-primary">
                      <span>➕ 申請開課</span>
                    </router-link>
                    <router-link to="/instructor/my-courses" class="button is-info">
                      <span>📚 我的授課</span>
                    </router-link>
                    <router-link to="/courses" class="button is-light">
                      <span>🎓 瀏覽所有課程</span>
                    </router-link>
                  </div>

                  <!-- My Courses List -->
                  <div v-if="myCourses.length > 0">
                    <h4 class="subtitle is-5 mb-3">我的課程</h4>
                    <div class="columns is-multiline">
                      <div v-for="course in myCourses" :key="course.id" class="column is-half">
                        <div class="card">
                          <div class="card-content">
                            <h5 class="title is-6">{{ course.title }}</h5>
                            <p class="subtitle is-7 has-text-grey">{{ getCourseTypeText(course.course_type) }}</p>
                            <p class="is-size-7 mb-3">{{ truncateText(course.description, 80) }}</p>

                            <div class="tags mb-3">
                              <span class="tag is-info is-small">{{ getCourseTypeText(course.course_type) }}</span>
                              <span v-if="course.duration_hours" class="tag is-small">{{ course.duration_hours }} 小時</span>
                            </div>

                            <div class="buttons are-small">
                              <router-link :to="`/courses/${course.id}`" class="button is-primary is-small">
                                <span class="icon">
                                  <i class="fas fa-eye"></i>
                                </span>
                                <span>查看詳情</span>
                              </router-link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="myCoursesLoaded && myCourses.length === 0" class="notification is-light">
                    <p class="has-text-centered">您還沒有開設任何課程</p>
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
import { ref, onMounted, computed } from 'vue'

import { api } from '@/services/api'

// Component state
const instructor = ref<any>(null)
const stats = ref<any>(null)
const ratings = ref<any[]>([])
const myCourses = ref<any[]>([])
const myCoursesLoaded = ref(false)
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

// Robust status checks
const isApproved = computed(
  () =>
    (instructor.value.application_status &&
      instructor.value.application_status.toLowerCase().trim() === 'approved') ||
    (instructor.value.status && instructor.value.status.toLowerCase().trim() === 'approved')
)
const isPending = computed(
  () =>
    (instructor.value.application_status &&
      instructor.value.application_status.toLowerCase().trim() === 'pending') ||
    (instructor.value.status && instructor.value.status.toLowerCase().trim() === 'pending')
)

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
  console.log('[loadProfile] Function called!')
  try {
    isLoading.value = true
    errorMessage.value = ''

    console.log('[loadProfile] About to call API...')
    const response = await api.get('/instructors/profile')

    console.log('[loadProfile] Full response:', response)
    console.log('[loadProfile] response.data:', response.data)
    console.log('[loadProfile] response.data.data:', response.data?.data)

    // 檢查響應格式
    if (response.data?.success === false) {
      // API 返回錯誤
      if (response.status === 404) {
        instructor.value = null
      } else {
        errorMessage.value = response.data.error?.message || '載入講師資料失敗'
      }
      return
    }

    // 提取講師資料（支援兩種格式）
    if (response.data?.success === true && response.data?.data) {
      // API 返回的格式是 { success: true, data: {...} }
      instructor.value = response.data.data
      console.log('[loadProfile] Instructor set to:', instructor.value)
    } else {
      // 直接返回數據（舊格式）
      instructor.value = response.data
      console.log('[loadProfile] Instructor set to (legacy):', instructor.value)
    }

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

    // Load stats, ratings, and courses
    await Promise.all([loadMyCourses(), loadStats(), loadRatings()])
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

// Load instructor statistics
const loadStats = async () => {
  // TODO: 實作統計 API 調用
  stats.value = {
    total_courses: myCourses.value.length,
    total_students: 0,
    completion_rate: 0
  }
}

// Load instructor ratings
const loadRatings = async () => {
  if (!instructor.value) return

  try {
    console.log('[loadRatings] Loading ratings for instructor:', instructor.value.id)

    // 使用講師 ID 查詢評價
    const instructorId = instructor.value.id || instructor.value.instructor_id || instructor.value.application_id

    if (!instructorId) {
      console.log('[loadRatings] No instructor ID found')
      return
    }

    const response = await api.get(`/instructors/${instructorId}/ratings`)

    console.log('[loadRatings] API response:', response)

    if (response.data?.success && response.data?.data) {
      ratings.value = response.data.data
      console.log('[loadRatings] Loaded ratings:', ratings.value.length)
    } else {
      ratings.value = []
    }
  } catch (error: any) {
    console.error('[loadRatings] Failed to load ratings:', error)
    ratings.value = []
  }
}

// Load instructor courses
const loadMyCourses = async () => {
  if (!instructor.value) return

  try {
    console.log('[loadMyCourses] Loading courses for instructor:', instructor.value.id)

    // 使用講師 ID 查詢課程
    const instructorId = instructor.value.id || instructor.value.instructor_id || instructor.value.application_id

    if (!instructorId) {
      console.log('[loadMyCourses] No instructor ID found')
      myCoursesLoaded.value = true
      return
    }

    const response = await api.get(`/instructors/${instructorId}/courses`, {
      params: { limit: 6 } // 只顯示前 6 個課程
    })

    console.log('[loadMyCourses] API response:', response)

    if (response.data?.success && response.data?.data) {
      myCourses.value = response.data.data
      console.log('[loadMyCourses] Loaded courses:', myCourses.value.length)
    } else {
      myCourses.value = []
    }
  } catch (error: any) {
    console.error('[loadMyCourses] Failed to load courses:', error)
    myCourses.value = []
  } finally {
    myCoursesLoaded.value = true
  }
}

// Helper functions
const getCourseTypeText = (courseType: string): string => {
  const typeMap: Record<string, string> = {
    'basic': '基礎課程',
    'advanced': '進階課程',
    'internship': '實習課程'
  }
  return typeMap[courseType] || courseType || '未分類'
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
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
  console.log('[InstructorProfileView] Component mounted, calling loadProfile...')
  loadProfile()
  // 掛載講師資料在 window，方便主控台檢查
  ;(window as any).__instructorDebug = instructor
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
