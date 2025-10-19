<template>
  <div class="learning-progress-view">
    <section class="section">
      <div class="container">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="title is-2">我的學習進度</h1>
          <p class="subtitle">追蹤您的課程學習狀況</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="has-text-centered py-6">
          <button class="button is-loading is-large is-white" disabled>載入中...</button>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="notification is-danger">
          <button class="delete" @click="error = null"></button>
          {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="enrollments.length === 0" class="notification is-info">
          <p class="has-text-centered">
            <i class="fas fa-info-circle"></i>
            您尚未註冊任何課程
          </p>
          <div class="has-text-centered mt-4">
            <router-link to="/courses" class="button is-primary">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>瀏覽課程</span>
            </router-link>
          </div>
        </div>

        <!-- Enrollments List -->
        <div v-else>
          <!-- Statistics Cards -->
          <div class="columns mb-5">
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">總註冊課程</p>
                <p class="title is-3">{{ enrollments.length }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">進行中</p>
                <p class="title is-3 has-text-info">{{ inProgressCount }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">已完成</p>
                <p class="title is-3 has-text-success">{{ completedCount }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">平均進度</p>
                <p class="title is-3 has-text-primary">{{ averageProgress }}%</p>
              </div>
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="tabs is-boxed mb-4">
            <ul>
              <li :class="{ 'is-active': activeTab === 'all' }">
                <a @click="activeTab = 'all'">
                  <span class="icon is-small"><i class="fas fa-list"></i></span>
                  <span>全部課程</span>
                </a>
              </li>
              <li :class="{ 'is-active': activeTab === 'in_progress' }">
                <a @click="activeTab = 'in_progress'">
                  <span class="icon is-small"><i class="fas fa-spinner"></i></span>
                  <span>進行中</span>
                </a>
              </li>
              <li :class="{ 'is-active': activeTab === 'completed' }">
                <a @click="activeTab = 'completed'">
                  <span class="icon is-small"><i class="fas fa-check"></i></span>
                  <span>已完成</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Enrollment Cards -->
          <div class="columns is-multiline">
            <div
              v-for="enrollment in filteredEnrollments"
              :key="enrollment.id"
              class="column is-12"
            >
              <div class="box">
                <div class="columns is-vcentered">
                  <div class="column is-8">
                    <div class="level is-mobile mb-3">
                      <div class="level-left">
                        <div class="level-item">
                          <span class="tag" :class="getCourseTypeClass(enrollment.courseType)">
                            {{ getCourseTypeLabel(enrollment.courseType) }}
                          </span>
                        </div>
                        <div class="level-item">
                          <span class="tag" :class="getStatusClass(enrollment.status)">
                            {{ getStatusLabel(enrollment.status) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h3 class="title is-4">{{ enrollment.courseTitle }}</h3>
                    <p class="subtitle is-6 has-text-grey">{{ enrollment.courseDescription }}</p>

                    <div class="mb-3">
                      <ProgressBar
                        :percentage="enrollment.progressPercentage"
                        :label="`學習進度`"
                        :color="getProgressColor(enrollment.progressPercentage)"
                      />
                    </div>

                    <div class="level is-mobile">
                      <div class="level-left">
                        <div class="level-item">
                          <span class="icon-text">
                            <span class="icon has-text-info">
                              <i class="fas fa-calendar"></i>
                            </span>
                            <span class="is-size-7">
                              註冊日期：{{ formatDate(enrollment.enrollmentDate) }}
                            </span>
                          </span>
                        </div>
                        <div v-if="enrollment.completionDate" class="level-item">
                          <span class="icon-text">
                            <span class="icon has-text-success">
                              <i class="fas fa-check-circle"></i>
                            </span>
                            <span class="is-size-7">
                              完成日期：{{ formatDate(enrollment.completionDate) }}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div v-if="enrollment.finalScore !== null && enrollment.finalScore !== undefined" class="mt-3">
                      <span class="icon-text">
                        <span class="icon has-text-warning">
                          <i class="fas fa-star"></i>
                        </span>
                        <span class="has-text-weight-semibold">
                          最終成績：{{ enrollment.finalScore }} 分
                        </span>
                      </span>
                    </div>
                  </div>

                  <div class="column is-4 has-text-right">
                    <div class="buttons is-right">
                      <router-link
                        :to="`/courses/${enrollment.courseId}`"
                        class="button is-info is-light"
                      >
                        <span class="icon">
                          <i class="fas fa-info-circle"></i>
                        </span>
                        <span>課程詳情</span>
                      </router-link>

                      <button
                        v-if="enrollment.status !== 'completed'"
                        class="button is-primary"
                        @click="openQuiz(enrollment)"
                      >
                        <span class="icon">
                          <i class="fas fa-pencil-alt"></i>
                        </span>
                        <span>進行測驗</span>
                      </button>

                      <button
                        v-if="enrollment.status === 'completed'"
                        class="button is-success"
                        @click="downloadCertificate(enrollment)"
                      >
                        <span class="icon">
                          <i class="fas fa-certificate"></i>
                        </span>
                        <span>下載證書</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quiz Modal -->
    <div class="modal" :class="{ 'is-active': showQuizModal }">
      <div class="modal-background" @click="closeQuiz"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">課程測驗</p>
          <button class="delete" aria-label="close" @click="closeQuiz"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="currentEnrollment">
            <h4 class="title is-4 mb-4">{{ currentEnrollment.courseTitle }}</h4>

            <div class="notification is-info is-light mb-4">
              <p><strong>測驗說明：</strong></p>
              <ul>
                <li>本測驗共 10 題選擇題</li>
                <li>及格分數為 80 分</li>
                <li>完成測驗後將更新學習進度</li>
              </ul>
            </div>

            <div class="field">
              <label class="label">模擬測驗分數（0-100）</label>
              <div class="control">
                <input
                  v-model.number="quizScore"
                  class="input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="輸入測驗分數"
                />
              </div>
              <p class="help">實際系統中將顯示真實測驗題目</p>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-primary"
            :class="{ 'is-loading': submittingQuiz }"
            :disabled="submittingQuiz || quizScore === null"
            @click="submitQuiz"
          >
            提交測驗
          </button>
          <button class="button" @click="closeQuiz">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProgressBar from '@/components/common/ProgressBar.vue'
import courseService from '@/services/course-service'
import type { CourseEnrollment } from '@/types'

const router = useRouter()

// State
const enrollments = ref<CourseEnrollment[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'all' | 'in_progress' | 'completed'>('all')
const showQuizModal = ref(false)
const currentEnrollment = ref<CourseEnrollment | null>(null)
const quizScore = ref<number | null>(null)
const submittingQuiz = ref(false)

// Computed
const filteredEnrollments = computed(() => {
  if (activeTab.value === 'all') {
    return enrollments.value
  }
  return enrollments.value.filter(e => {
    if (activeTab.value === 'in_progress') {
      return e.status === 'enrolled' || e.status === 'in_progress'
    }
    return e.status === 'completed'
  })
})

const inProgressCount = computed(() => {
  return enrollments.value.filter(e => e.status === 'enrolled' || e.status === 'in_progress').length
})

const completedCount = computed(() => {
  return enrollments.value.filter(e => e.status === 'completed').length
})

const averageProgress = computed(() => {
  if (enrollments.value.length === 0) return 0
  const total = enrollments.value.reduce((sum, e) => sum + e.progressPercentage, 0)
  return Math.round(total / enrollments.value.length)
})

// Methods
const loadEnrollments = async () => {
  loading.value = true
  error.value = null

  try {
    enrollments.value = await courseService.getUserEnrollments()
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '載入學習進度失敗，請稍後再試'
    console.error('Error loading enrollments:', err)
  } finally {
    loading.value = false
  }
}

const getCourseTypeClass = (courseType?: string) => {
  switch (courseType) {
    case 'basic':
      return 'is-info'
    case 'advanced':
      return 'is-warning'
    case 'internship':
      return 'is-success'
    default:
      return 'is-light'
  }
}

const getCourseTypeLabel = (courseType?: string) => {
  switch (courseType) {
    case 'basic':
      return '基礎課程'
    case 'advanced':
      return '進階課程'
    case 'internship':
      return '實習課程'
    default:
      return '課程'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'is-success'
    case 'in_progress':
      return 'is-info'
    case 'enrolled':
      return 'is-warning'
    case 'dropped':
      return 'is-danger'
    default:
      return 'is-light'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '進行中'
    case 'enrolled':
      return '已註冊'
    case 'dropped':
      return '已退出'
    default:
      return '未知'
  }
}

const getProgressColor = (percentage: number): 'primary' | 'info' | 'success' | 'warning' => {
  if (percentage >= 100) return 'success'
  if (percentage >= 75) return 'info'
  if (percentage >= 50) return 'warning'
  return 'primary'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const openQuiz = (enrollment: CourseEnrollment) => {
  currentEnrollment.value = enrollment
  quizScore.value = null
  showQuizModal.value = true
}

const closeQuiz = () => {
  showQuizModal.value = false
  currentEnrollment.value = null
  quizScore.value = null
}

const submitQuiz = async () => {
  if (!currentEnrollment.value || quizScore.value === null) return

  submittingQuiz.value = true

  try {
    // Calculate new progress based on score
    const newProgress = quizScore.value >= 80 ? 100 : Math.min(currentEnrollment.value.progressPercentage + 20, 90)
    const newStatus = quizScore.value >= 80 ? 'completed' : 'in_progress'

    await courseService.updateCourseProgress(
      currentEnrollment.value.courseId,
      newProgress,
      newStatus
    )

    // Reload enrollments
    await loadEnrollments()

    // Show success message
    if (quizScore.value >= 80) {
      alert('恭喜您通過測驗！課程已完成。')
    } else {
      alert('測驗未通過，請繼續學習後再次嘗試。')
    }

    closeQuiz()
  } catch (err: any) {
    const errorMessage = err.response?.data?.error?.message || '提交測驗失敗，請稍後再試'
    alert(errorMessage)
    console.error('Error submitting quiz:', err)
  } finally {
    submittingQuiz.value = false
  }
}

const downloadCertificate = (enrollment: CourseEnrollment) => {
  alert(`下載證書功能將在後續實作\n課程：${enrollment.courseTitle}\n完成日期：${formatDate(enrollment.completionDate || '')}`)
}

// Lifecycle
onMounted(() => {
  loadEnrollments()
})
</script>

<style scoped>
.learning-progress-view {
  min-height: calc(100vh - 200px);
}

.tabs {
  margin-bottom: 1.5rem;
}
</style>
