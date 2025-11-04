<template>
  <div class="learning-progress-view">
    <div class="container">
      <h1 class="title">學習進度</h1>

      <!-- 未登入提示 -->
      <div v-if="!isAuthenticated" class="notification is-warning is-light">
        <p>請先登入以查看您的學習進度。</p>
        <button class="button is-primary mt-3" @click="goToLogin">前往登入</button>
      </div>

      <!-- 載入中 -->
      <div v-else-if="loading" class="has-text-centered py-6">
        <button class="button is-loading is-large is-white" disabled>載入中...</button>
      </div>

      <!-- 錯誤 -->
      <div v-else-if="error" class="notification is-danger">
        <button class="delete" @click="error = null"></button>
        {{ error }}
      </div>

      <!-- 無資料 -->
      <div v-else-if="!progress" class="notification is-info is-light">
        <p>目前沒有可顯示的學習進度。</p>
        <p class="is-size-7 mt-2 has-text-grey">提示：從課程詳情按「查看學習進度」會帶入該課程。</p>
      </div>

      <!-- 進度資訊 -->
      <div v-else>
        <div class="box">
          <div class="level">
            <div class="level-left">
              <div>
                <p class="title is-4">{{ progress.course_title || '課程' }}</p>
                <p class="subtitle is-6 has-text-grey">註冊日期：{{ formatDate(progress.enrollment_date) }}</p>
              </div>
            </div>
            <div class="level-right">
              <router-link :to="`/courses/${progress.course_id}`" class="button is-light">回到課程</router-link>
            </div>
          </div>

          <div v-if="progress.status === 'not_enrolled'" class="notification is-warning is-light">
            您尚未報名此課程，進度顯示為 0%。
            <router-link :to="`/courses/${progress.course_id}`" class="button is-primary is-small ml-3">前往報名</router-link>
          </div>

          <div>
            <p class="mb-2"><strong>目前進度：</strong>{{ progress.progress_percentage }}%</p>
            <progress class="progress is-primary" :value="progress.progress_percentage" max="100">{{ progress.progress_percentage }}%</progress>
          </div>

          <div class="mt-4 is-flex is-align-items-center" v-if="progress.status !== 'not_enrolled'">
            <label class="mr-3">更新進度：</label>
            <input class="input progress-input" type="number" min="0" max="100" v-model.number="updateValue" style="max-width: 120px;" />
            <button class="button is-primary ml-3" :class="{ 'is-loading': updating }" :disabled="updating" @click="updateProgress">儲存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import courseService from '@/services/course-service'
import { useAuthStore } from '@/stores/auth'
import type { CourseEnrollment } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const updating = ref(false)
const error = ref<string | null>(null)
const progress = ref<CourseEnrollment | null>(null)
const updateValue = ref<number>(0)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const formatDate = (d?: string | Date | null) => {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(date)
}

const goToLogin = () => {
  router.push('/login?redirect=/learning-progress')
}

const loadProgress = async () => {
  loading.value = true
  error.value = null

  try {
    // 優先使用從課程頁帶入的 courseId
    const lastCourseId = localStorage.getItem('last_course_id')
    if (!lastCourseId) {
      progress.value = null
      return
    }

    const enrollment = await courseService.getCourseProgress(parseInt(lastCourseId, 10))
    progress.value = enrollment
    updateValue.value = enrollment.progress_percentage ?? 0
  } catch (err: any) {
    error.value = err.response?.data?.message || '載入學習進度失敗，請稍後再試'
    progress.value = null
    console.error('Error loading progress:', err)
  } finally {
    loading.value = false
  }
}

const updateProgress = async () => {
  if (!progress.value) return
  const courseId = progress.value.course_id

  updating.value = true
  try {
    await courseService.updateCourseProgress(courseId, Math.max(0, Math.min(100, updateValue.value)))
    // 重新載入
    await loadProgress()
  } catch (err: any) {
    console.error('Error updating progress:', err)
    error.value = err.response?.data?.message || '更新進度失敗，請稍後再試'
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  if (isAuthenticated.value) {
    loadProgress()
  }
})
</script>

<style scoped>
.learning-progress-view {
  min-height: calc(100vh - 200px);
  padding: 2rem 0;
}

.progress-input {
  width: 110px;
}
</style>
