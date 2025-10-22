<template>
  <div class="analytics-dashboard">
    <section class="section">
      <div class="container">
        <h1 class="title">數據分析儀表板</h1>
        <p class="subtitle">系統統計與報告</p>

        <!-- 日期篩選器 -->
        <AnalyticsFilters
          v-model:start-date="filters.startDate!"
          v-model:end-date="filters.endDate!"
          v-model:export-type="exportType"
          :is-exporting="isExporting"
          @filter-change="loadAllStats"
          @export-report="exportReport"
        />

        <!-- 關鍵指標卡片 -->
        <KeyMetricsCards :metrics="dashboardStats.keyMetrics" />

        <!-- 最近30天活動 -->
        <ActivityCharts :activity-data="dashboardStats.activityData" />

        <!-- 學習統計 -->
        <LearningStats :learning-stats="dashboardStats.learningStats" />

        <!-- 就業媒合統計 -->
        <JobStats :job-stats="dashboardStats.jobStats" />

        <!-- 課程滿意度統計 -->
        <SatisfactionStats :satisfaction-stats="dashboardStats.satisfactionStats" />

        <!-- 載入狀態 -->
        <div v-if="isLoading" class="has-text-centered">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p class="mt-3">載入數據中...</p>
          </div>
        </div>

        <!-- 錯誤狀態 -->
        <div v-if="error" class="notification is-danger">
          <button class="delete" @click="error = null"></button>
          <strong>載入失敗：</strong>{{ error }}
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import ActivityCharts from '@/components/admin/ActivityCharts.vue'
import AnalyticsFilters from '@/components/admin/AnalyticsFilters.vue'
import JobStats from '@/components/admin/JobStats.vue'
import KeyMetricsCards from '@/components/admin/KeyMetricsCards.vue'
import LearningStats from '@/components/admin/LearningStats.vue'
import SatisfactionStats from '@/components/admin/SatisfactionStats.vue'

// 響應式數據
const isLoading = ref(false)
const isExporting = ref(false)
const error = ref<string | null>(null)
const exportType = ref('comprehensive')

const filters = ref({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
})

const dashboardStats = ref<any>({
  keyMetrics: {
    total_learners: 0,
    active_courses: 0,
    active_jobs: 0,
    active_instructors: 0,
    learners_growth: 0,
    courses_growth: 0,
    jobs_growth: 0,
    instructors_growth: 0
  },
  activityData: {
    registrationTrend: [],
    completionRate: []
  },
  learningStats: {
    basicCourseCompletion: 0,
    advancedCourseCompletion: 0,
    practicalCourseCompletion: 0,
    popularCourses: []
  },
  jobStats: {
    overallSuccessRate: 0,
    successRateChange: 0,
    averageSalary: 0,
    salaryGrowth: 0,
    industryDistribution: [],
    totalEmployed: 0
  },
  satisfactionStats: {
    overallRating: 0,
    ratingDistribution: {},
    instructorStats: []
  }
})

// 載入所有統計數據
const loadAllStats = async () => {
  isLoading.value = true
  error.value = null

  try {
    await Promise.all([
      loadKeyMetrics(),
      loadActivityData(),
      loadLearningStats(),
      loadJobStats(),
      loadSatisfactionStats()
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入數據時發生錯誤'
  } finally {
    isLoading.value = false
  }
}

// 載入關鍵指標
const loadKeyMetrics = async () => {
  // 模擬API調用
  await new Promise(resolve => setTimeout(resolve, 500))

  dashboardStats.value.keyMetrics = {
    total_learners: 1250,
    active_courses: 45,
    active_jobs: 120,
    active_instructors: 28,
    learners_growth: 12.5,
    courses_growth: 8.3,
    jobs_growth: 15.2,
    instructors_growth: 6.7
  }
}

// 載入活動數據
const loadActivityData = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))

  dashboardStats.value.activityData = {
    registrationTrend: [
      { date: '2024-01-01', count: 45 },
      { date: '2024-01-02', count: 52 },
      { date: '2024-01-03', count: 38 },
      { date: '2024-01-04', count: 61 },
      { date: '2024-01-05', count: 47 }
    ],
    completionRate: [
      { date: '2024-01-01', rate: 78 },
      { date: '2024-01-02', rate: 82 },
      { date: '2024-01-03', rate: 85 },
      { date: '2024-01-04', rate: 79 },
      { date: '2024-01-05', rate: 88 }
    ]
  }
}

// 載入學習統計
const loadLearningStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))

  dashboardStats.value.learningStats = {
    basicCourseCompletion: 85,
    advancedCourseCompletion: 72,
    practicalCourseCompletion: 68,
    popularCourses: [
      { id: 1, name: '藥局助理基礎課程', enrollmentCount: 245, completionRate: 88, rating: 4.5 },
      { id: 2, name: '藥品知識與管理', enrollmentCount: 198, completionRate: 82, rating: 4.3 },
      { id: 3, name: '客戶服務技巧', enrollmentCount: 176, completionRate: 85, rating: 4.4 }
    ]
  }
}

// 載入就業統計
const loadJobStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 350))

  dashboardStats.value.jobStats = {
    overallSuccessRate: 78,
    successRateChange: 5.2,
    averageSalary: 32000,
    salaryGrowth: 8.5,
    industryDistribution: [
      { name: '連鎖藥局', count: 45 },
      { name: '醫院藥局', count: 32 },
      { name: '診所藥局', count: 28 },
      { name: '藥品批發', count: 15 }
    ],
    totalEmployed: 120
  }
}

// 載入滿意度統計
const loadSatisfactionStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 250))

  dashboardStats.value.satisfactionStats = {
    overallRating: 4.6,
    ratingDistribution: {
      5: 156,
      4: 89,
      3: 23,
      2: 8,
      1: 2
    },
    instructorStats: [
      { id: 1, name: '張藥師', courseCount: 8, averageRating: 4.8, studentCount: 245 },
      { id: 2, name: '李藥師', courseCount: 6, averageRating: 4.6, studentCount: 198 },
      { id: 3, name: '王藥師', courseCount: 5, averageRating: 4.4, studentCount: 176 }
    ]
  }
}

// 匯出報告
const exportReport = async () => {
  isExporting.value = true

  try {
    // 模擬匯出過程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 這裡可以實現實際的匯出邏輯
    console.log('匯出報告:', {
      type: exportType.value,
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      data: dashboardStats.value
    })

    // 顯示成功訊息
    alert('報告匯出成功！')
  } catch (err) {
    error.value = '匯出報告時發生錯誤'
  } finally {
    isExporting.value = false
  }
}

// 組件掛載時載入數據
onMounted(() => {
  loadAllStats()
})
</script>

<style scoped>
.analytics-dashboard {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.loading-spinner {
  padding: 2rem;
  color: #666;
}

.notification {
  margin: 1rem 0;
}

.title {
  color: #363636;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}
</style>
