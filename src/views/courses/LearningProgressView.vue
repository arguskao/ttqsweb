<template>
  <div class="learning-progress-view">
    <section class="section">
      <div class="container">
        <h1 class="title is-2">我的學習進度</h1>
        <p class="subtitle">追蹤您的課程學習狀況</p>

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
            您還沒有報名任何課程
          </p>
          <div class="has-text-centered mt-4">
            <router-link to="/courses" class="button is-primary">
              瀏覽課程
            </router-link>
          </div>
        </div>

        <!-- Enrollments List -->
        <div v-else class="columns is-multiline">
          <div
            v-for="enrollment in enrollments"
            :key="enrollment.id"
            class="column is-12-tablet is-6-desktop"
          >
            <div class="card">
              <div class="card-content">
                <div class="media">
                  <div class="media-content">
                    <p class="title is-4">{{ enrollment.courseTitle || '課程' }}</p>
                    <p class="subtitle is-6">
                      報名日期: {{ formatDate(enrollment.enrollmentDate) }}
                    </p>
                  </div>
                </div>

                <div class="content">
                  <!-- Progress Bar -->
                  <div class="mb-4">
                    <div class="level is-mobile mb-2">
                      <div class="level-left">
                        <div class="level-item">
                          <span class="has-text-weight-semibold">學習進度</span>
                        </div>
                      </div>
                      <div class="level-right">
                        <div class="level-item">
                          <span class="tag" :class="getStatusClass(enrollment.status)">
                            {{ getStatusText(enrollment.status) }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <progress
                      class="progress"
                      :class="getProgressClass(enrollment.progressPercentage)"
                      :value="enrollment.progressPercentage"
                      max="100"
                    >
                      {{ enrollment.progressPercentage }}%
                    </progress>
                    <p class="has-text-grey is-size-7">
                      {{ enrollment.progressPercentage }}% 完成
                    </p>
                  </div>

                  <!-- Completion Date -->
                  <div v-if="enrollment.completionDate" class="mb-3">
                    <span class="icon-text">
                      <span class="icon has-text-success">
                        <i class="fas fa-check-circle"></i>
                      </span>
                      <span>完成日期: {{ formatDate(enrollment.completionDate) }}</span>
                    </span>
                  </div>

                  <!-- Final Score -->
                  <div v-if="enrollment.finalScore" class="mb-3">
                    <span class="icon-text">
                      <span class="icon has-text-info">
                        <i class="fas fa-star"></i>
                      </span>
                      <span>最終成績: {{ enrollment.finalScore }} 分</span>
                    </span>
                  </div>

                  <!-- Actions -->
                   <div class="buttons">
                     <router-link
                       :to="`/courses/${enrollment.courseId}`"
                       class="button is-primary is-small"
                     >
                       <span class="icon">
                         <!-- Inline SVG icon to avoid external icon font dependency -->
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                           <path d="M4 5a2 2 0 0 1 2-2h13v16h-1.5a3.5 3.5 0 0 0-3.5 3.5V6H6a2 2 0 0 0-2 2v11.5c0 .276.224.5.5.5H14v2H4.5A1.5 1.5 0 0 1 3 20.5V5z"/>
                         </svg>
                       </span>
                       <span>查看課程</span>
                     </router-link>
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
import courseService from '@/services/course-service'

interface Enrollment {
  id: number
  courseId: number
  courseTitle?: string
  enrollmentDate: string
  completionDate?: string
  progressPercentage: number
  finalScore?: number
  status: string
}

const loading = ref(false)
const error = ref<string | null>(null)
const enrollments = ref<Enrollment[]>([])

const loadEnrollments = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await courseService.getUserEnrollments()
    enrollments.value = data
  } catch (err: any) {
    error.value = err.response?.data?.message || '載入學習進度失敗，請稍後再試'
    console.error('Error loading enrollments:', err)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    enrolled: '進行中',
    completed: '已完成',
    dropped: '已退出'
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    enrolled: 'is-info',
    completed: 'is-success',
    dropped: 'is-danger'
  }
  return classMap[status] || 'is-light'
}

const getProgressClass = (progress: number) => {
  if (progress >= 100) return 'is-success'
  if (progress >= 50) return 'is-info'
  if (progress >= 25) return 'is-warning'
  return 'is-danger'
}

onMounted(() => {
  loadEnrollments()
})
</script>

<style scoped>
.learning-progress-view {
  min-height: calc(100vh - 200px);
}

.card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.progress {
  height: 1.5rem;
}
</style>
