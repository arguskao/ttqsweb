<template>
  <div class="performance-dashboard">
    <div class="dashboard-header">
      <h1 class="title is-3">性能監控儀表板</h1>
      <div class="dashboard-controls">
        <button
          class="button is-primary"
          @click="refreshData"
          :disabled="isLoading"
        >
          <span class="icon">
            <i class="fas fa-sync" :class="{ 'fa-spin': isLoading }"></i>
          </span>
          <span>刷新數據</span>
        </button>
        <button
          class="button is-info"
          @click="exportReport"
        >
          <span class="icon">
            <i class="fas fa-download"></i>
          </span>
          <span>導出報告</span>
        </button>
      </div>
    </div>

    <!-- 性能指標卡片 -->
    <div class="columns is-multiline">
      <div class="column is-3" v-for="metric in performanceMetrics" :key="metric.name">
        <div class="card">
          <div class="card-content">
            <div class="level">
              <div class="level-left">
                <div>
                  <p class="heading">{{ metric.label }}</p>
                  <p class="title is-4" :class="getMetricClass(metric.value, metric.threshold)">
                    {{ metric.value }}
                  </p>
                </div>
              </div>
              <div class="level-right">
                <div class="icon" :class="getMetricIconClass(metric.value, metric.threshold)">
                  <i :class="getMetricIcon(metric.value, metric.threshold)"></i>
                </div>
              </div>
            </div>
            <progress
              class="progress"
              :class="getMetricClass(metric.value, metric.threshold)"
              :value="metric.value"
              :max="metric.max"
            >
              {{ metric.value }}%
            </progress>
          </div>
        </div>
      </div>
    </div>

    <!-- 數據庫性能 -->
    <div class="box">
      <h2 class="title is-4">數據庫性能</h2>
      <div class="columns">
        <div class="column is-6">
          <h3 class="subtitle is-5">緩存命中率</h3>
          <div class="field">
            <div class="control">
              <div class="tags has-addons">
                <span class="tag" :class="getCacheHitClass(dbMetrics.cacheHitRatio)">
                  {{ dbMetrics.cacheHitRatio }}%
                </span>
                <span class="tag is-light">目標: 90%+</span>
              </div>
            </div>
          </div>
        </div>
        <div class="column is-6">
          <h3 class="subtitle is-5">活躍連接數</h3>
          <div class="field">
            <div class="control">
              <div class="tags has-addons">
                <span class="tag" :class="getConnectionClass(dbMetrics.activeConnections)">
                  {{ dbMetrics.activeConnections }}
                </span>
                <span class="tag is-light">最大: {{ dbMetrics.maxConnections }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 慢查詢列表 -->
    <div class="box">
      <h2 class="title is-4">慢查詢監控</h2>
      <div v-if="slowQueries.length === 0" class="has-text-centered">
        <p class="subtitle">未發現慢查詢</p>
      </div>
      <div v-else>
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>查詢</th>
              <th>平均執行時間</th>
              <th>調用次數</th>
              <th>建議</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="query in slowQueries" :key="query.query">
              <td>
                <code class="is-small">{{ truncateQuery(query.query) }}</code>
              </td>
              <td>
                <span class="tag" :class="getQueryTimeClass(query.avgTime)">
                  {{ formatDuration(query.avgTime) }}
                </span>
              </td>
              <td>{{ query.calls }}</td>
              <td>
                <span class="tag is-light">{{ query.recommendation }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 索引使用情況 -->
    <div class="box">
      <h2 class="title is-4">索引使用情況</h2>
      <div class="columns">
        <div class="column is-4">
          <h3 class="subtitle is-5">未使用索引</h3>
          <div class="tags">
            <span
              v-for="index in unusedIndexes"
              :key="index.name"
              class="tag is-warning"
            >
              {{ index.name }}
            </span>
          </div>
        </div>
        <div class="column is-4">
          <h3 class="subtitle is-5">低使用率索引</h3>
          <div class="tags">
            <span
              v-for="index in lowUsageIndexes"
              :key="index.name"
              class="tag is-info"
            >
              {{ index.name }}
            </span>
          </div>
        </div>
        <div class="column is-4">
          <h3 class="subtitle is-5">高使用率索引</h3>
          <div class="tags">
            <span
              v-for="index in highUsageIndexes"
              :key="index.name"
              class="tag is-success"
            >
              {{ index.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能警報 -->
    <div v-if="alerts.length > 0" class="box">
      <h2 class="title is-4">性能警報</h2>
      <div class="notification"
           v-for="alert in alerts"
           :key="alert.type"
           :class="getAlertClass(alert.level)"
      >
        <div class="level">
          <div class="level-left">
            <div>
              <p class="title is-6">{{ alert.type }}</p>
              <p>{{ alert.message }}</p>
            </div>
          </div>
          <div class="level-right">
            <p class="subtitle is-6">{{ alert.recommendedAction }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 實時監控圖表 -->
    <div class="box">
      <h2 class="title is-4">實時性能監控</h2>
      <div class="columns">
        <div class="column is-6">
          <canvas ref="performanceChart" width="400" height="200"></canvas>
        </div>
        <div class="column is-6">
          <canvas ref="memoryChart" width="400" height="200"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

import { apiService } from '@/services/api-enhanced'
import type { ApiResponse } from '@/types/enhanced'

// 響應式數據
const isLoading = ref(false)
const performanceMetrics = ref([
  { name: 'cacheHitRatio', label: '緩存命中率', value: 0, max: 100, threshold: 90 },
  { name: 'responseTime', label: '平均響應時間', value: 0, max: 1000, threshold: 500 },
  { name: 'throughput', label: '吞吐量', value: 0, max: 1000, threshold: 800 },
  { name: 'errorRate', label: '錯誤率', value: 0, max: 10, threshold: 1 }
])

const dbMetrics = ref({
  cacheHitRatio: 0,
  activeConnections: 0,
  maxConnections: 0,
  databaseSize: '0 MB'
})

const slowQueries = ref<any[]>([])
const unusedIndexes = ref<any[]>([])
const lowUsageIndexes = ref<any[]>([])
const highUsageIndexes = ref<any[]>([])
const alerts = ref<any[]>([])

// 圖表引用
const performanceChart = ref<HTMLCanvasElement>()
const memoryChart = ref<HTMLCanvasElement>()

// 計算屬性
const hasAlerts = computed(() => alerts.value.length > 0)

// 方法
const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      loadPerformanceMetrics(),
      loadDatabaseMetrics(),
      loadSlowQueries(),
      loadIndexUsage(),
      loadAlerts()
    ])
  } catch (error) {
    console.error('刷新數據失敗:', error)
  } finally {
    isLoading.value = false
  }
}

const loadPerformanceMetrics = async () => {
  try {
    const response = await apiService.get<Record<string, number>>('/admin/performance/metrics')
    if (response.success && response.data) {
      const data = response.data
      performanceMetrics.value = performanceMetrics.value.map(metric => ({
        ...metric,
        value: data[metric.name] ?? 0
      }))
    }
  } catch (error) {
    console.error('載入性能指標失敗:', error)
  }
}

const loadDatabaseMetrics = async () => {
  try {
    const response = await apiService.get<typeof dbMetrics.value>('/admin/database/metrics')
    if (response.success && response.data) {
      dbMetrics.value = response.data
    }
  } catch (error) {
    console.error('載入數據庫指標失敗:', error)
  }
}

const loadSlowQueries = async () => {
  try {
    const response = await apiService.get<any[]>('/admin/database/slow-queries')
    if (response.success && response.data) {
      slowQueries.value = response.data
    }
  } catch (error) {
    console.error('載入慢查詢失敗:', error)
  }
}

const loadIndexUsage = async () => {
  try {
    const response = await apiService.get<Record<string, any>>('/admin/database/index-usage')
    if (response.success && response.data) {
      unusedIndexes.value = response.data.unused ?? []
      lowUsageIndexes.value = response.data.lowUsage ?? []
      highUsageIndexes.value = response.data.highUsage ?? []
    }
  } catch (error) {
    console.error('載入索引使用情況失敗:', error)
  }
}

const loadAlerts = async () => {
  try {
    const response = await apiService.get<any[]>('/admin/performance/alerts')
    if (response.success && response.data) {
      alerts.value = response.data
    }
  } catch (error) {
    console.error('載入警報失敗:', error)
  }
}

const exportReport = async () => {
  try {
    const response = await apiService.get<ApiResponse<any>>('/admin/performance/report')
    if (response.success && response.data) {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('導出報告失敗:', error)
  }
}

// 工具方法
const getMetricClass = (value: number, threshold: number) => {
  if (value >= threshold) return 'is-success'
  if (value >= threshold * 0.8) return 'is-warning'
  return 'is-danger'
}

const getMetricIconClass = (value: number, threshold: number) => {
  if (value >= threshold) return 'has-text-success'
  if (value >= threshold * 0.8) return 'has-text-warning'
  return 'has-text-danger'
}

const getMetricIcon = (value: number, threshold: number) => {
  if (value >= threshold) return 'fas fa-check-circle'
  if (value >= threshold * 0.8) return 'fas fa-exclamation-triangle'
  return 'fas fa-times-circle'
}

const getCacheHitClass = (ratio: number) => {
  if (ratio >= 90) return 'is-success'
  if (ratio >= 80) return 'is-warning'
  return 'is-danger'
}

const getConnectionClass = (connections: number) => {
  if (connections < 50) return 'is-success'
  if (connections < 80) return 'is-warning'
  return 'is-danger'
}

const getQueryTimeClass = (time: string) => {
  const ms = parseFloat(time.replace('ms', ''))
  if (ms < 100) return 'is-success'
  if (ms < 500) return 'is-warning'
  return 'is-danger'
}

const getAlertClass = (level: string) => {
  switch (level) {
    case 'Critical': return 'is-danger'
    case 'Warning': return 'is-warning'
    default: return 'is-info'
  }
}

const truncateQuery = (query: string) => {
  return query.length > 50 ? `${query.substring(0, 50)}...` : query
}

const formatDuration = (duration: string) => {
  return duration
}

// 初始化圖表
const initCharts = () => {
  // 這裡可以集成 Chart.js 或其他圖表庫
  console.log('初始化性能監控圖表')
}

// 自動刷新
let refreshInterval: number | null = null

onMounted(() => {
  refreshData()
  initCharts()

  // 每30秒自動刷新
  refreshInterval = window.setInterval(refreshData, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.performance-dashboard {
  padding: 1rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-controls {
  display: flex;
  gap: 1rem;
}

.card {
  height: 100%;
}

.level {
  margin-bottom: 0.5rem;
}

.tags {
  flex-wrap: wrap;
}

canvas {
  max-width: 100%;
  height: auto;
}

.notification {
  margin-bottom: 1rem;
}

.table {
  font-size: 0.9rem;
}

code {
  background-color: #f5f5f5;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
}
</style>
