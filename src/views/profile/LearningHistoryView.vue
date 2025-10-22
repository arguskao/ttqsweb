<template>
  <div class="learning-history-view">
    <section class="section">
      <div class="container">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="title is-2">學習歷程</h1>
          <p class="subtitle">完整的學習記錄與成就</p>
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

        <!-- Content -->
        <div v-else>
          <!-- Overall Statistics -->
          <div class="box mb-5">
            <h2 class="title is-4 mb-4">學習統計</h2>
            <div class="columns">
              <div class="column">
                <div class="has-text-centered">
                  <p class="heading">總學習時數</p>
                  <p class="title is-3 has-text-primary">{{ totalHours }}</p>
                  <p class="subtitle is-6">小時</p>
                </div>
              </div>
              <div class="column">
                <div class="has-text-centered">
                  <p class="heading">完成課程</p>
                  <p class="title is-3 has-text-success">{{ completedCount }}</p>
                  <p class="subtitle is-6">門課程</p>
                </div>
              </div>
              <div class="column">
                <div class="has-text-centered">
                  <p class="heading">平均成績</p>
                  <p class="title is-3 has-text-info">{{ averageScore }}</p>
                  <p class="subtitle is-6">分</p>
                </div>
              </div>
              <div class="column">
                <div class="has-text-centered">
                  <p class="heading">獲得證書</p>
                  <p class="title is-3 has-text-warning">{{ certificateCount }}</p>
                  <p class="subtitle is-6">張</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Learning Chart -->
          <div class="box mb-5">
            <h2 class="title is-4 mb-4">學習進度圖表</h2>
            <div class="chart-container">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </div>

          <!-- Course Type Distribution -->
          <div class="box mb-5">
            <h2 class="title is-4 mb-4">課程類型分布</h2>
            <div class="columns">
              <div class="column is-4">
                <div class="box has-background-info-light">
                  <p class="heading">基礎課程</p>
                  <p class="title is-4">{{ basicCourseCount }}</p>
                  <progress
                    class="progress is-info"
                    :value="basicCourseCount"
                    :max="enrollments.length"
                  ></progress>
                </div>
              </div>
              <div class="column is-4">
                <div class="box has-background-warning-light">
                  <p class="heading">進階課程</p>
                  <p class="title is-4">{{ advancedCourseCount }}</p>
                  <progress
                    class="progress is-warning"
                    :value="advancedCourseCount"
                    :max="enrollments.length"
                  ></progress>
                </div>
              </div>
              <div class="column is-4">
                <div class="box has-background-success-light">
                  <p class="heading">實習課程</p>
                  <p class="title is-4">{{ internshipCourseCount }}</p>
                  <progress
                    class="progress is-success"
                    :value="internshipCourseCount"
                    :max="enrollments.length"
                  ></progress>
                </div>
              </div>
            </div>
          </div>

          <!-- Completed Courses with Certificates -->
          <div class="box">
            <h2 class="title is-4 mb-4">已完成課程與證書</h2>

            <div v-if="completedEnrollments.length === 0" class="notification is-info is-light">
              <p class="has-text-centered">尚未完成任何課程</p>
            </div>

            <div v-else class="table-container">
              <table class="table is-fullwidth is-striped is-hoverable">
                <thead>
                  <tr>
                    <th>課程名稱</th>
                    <th>課程類型</th>
                    <th>完成日期</th>
                    <th>最終成績</th>
                    <th>證書</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="enrollment in completedEnrollments" :key="enrollment.id">
                    <td>
                      <strong>{{ enrollment.courseTitle }}</strong>
                    </td>
                    <td>
                      <span class="tag" :class="getCourseTypeClass(enrollment.courseType)">
                        {{ getCourseTypeLabel(enrollment.courseType) }}
                      </span>
                    </td>
                    <td>{{ formatDate(enrollment.completionDate ?? '') }}</td>
                    <td>
                      <span
                        class="tag is-medium"
                        :class="getScoreClass(enrollment.finalScore)"
                      >
                        {{ enrollment.finalScore || 'N/A' }} 分
                      </span>
                    </td>
                    <td>
                      <button
                        class="button is-small is-success"
                        @click="downloadCertificate(enrollment)"
                      >
                        <span class="icon">
                          <i class="fas fa-download"></i>
                        </span>
                        <span>下載證書</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="buttons is-centered mt-5">
            <router-link to="/learning-progress" class="button is-primary">
              <span class="icon">
                <i class="fas fa-chart-line"></i>
              </span>
              <span>查看學習進度</span>
            </router-link>
            <router-link to="/courses" class="button is-info">
              <span class="icon">
                <i class="fas fa-book"></i>
              </span>
              <span>瀏覽更多課程</span>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

import courseService from '@/services/course-service'
import type { CourseEnrollment } from '@/types'

// State
const enrollments = ref<CourseEnrollment[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)

// Computed Statistics
const completedEnrollments = computed(() => {
  return enrollments.value.filter(e => e.status === 'completed')
})

const completedCount = computed(() => completedEnrollments.value.length)

const totalHours = computed(() => {
  return completedEnrollments.value.reduce((sum, e) => {
    return sum + (e.durationHours ?? 0)
  }, 0)
})

const averageScore = computed(() => {
  const scores = completedEnrollments.value
    .filter(e => e.finalScore !== null && e.finalScore !== undefined)
    .map(e => e.finalScore!)

  if (scores.length === 0) return 0

  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round(sum / scores.length)
})

const certificateCount = computed(() => completedCount.value)

const basicCourseCount = computed(() => {
  return enrollments.value.filter(e => e.courseType === 'basic').length
})

const advancedCourseCount = computed(() => {
  return enrollments.value.filter(e => e.courseType === 'advanced').length
})

const internshipCourseCount = computed(() => {
  return enrollments.value.filter(e => e.courseType === 'internship').length
})

// Methods
const loadEnrollments = async () => {
  loading.value = true
  error.value = null

  try {
    enrollments.value = await courseService.getUserEnrollments()

    // Draw chart after data is loaded
    await nextTick()
    drawChart()
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '載入學習歷程失敗，請稍後再試'
    console.error('Error loading enrollments:', err)
  } finally {
    loading.value = false
  }
}

const drawChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // Simple bar chart showing progress by course type
  const canvas = chartCanvas.value
  canvas.width = canvas.offsetWidth
  canvas.height = 300

  const data = [
    { label: '基礎課程', value: basicCourseCount.value, color: '#3298dc' },
    { label: '進階課程', value: advancedCourseCount.value, color: '#ffdd57' },
    { label: '實習課程', value: internshipCourseCount.value, color: '#48c774' }
  ]

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barWidth = 80
  const spacing = 100
  const startX = (canvas.width - (data.length * (barWidth + spacing))) / 2

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw bars
  data.forEach((item, index) => {
    const x = startX + index * (barWidth + spacing)
    const barHeight = (item.value / maxValue) * 200
    const y = 250 - barHeight

    // Draw bar
    ctx.fillStyle = item.color
    ctx.fillRect(x, y, barWidth, barHeight)

    // Draw value
    ctx.fillStyle = '#363636'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(item.value.toString(), x + barWidth / 2, y - 10)

    // Draw label
    ctx.font = '14px Arial'
    ctx.fillText(item.label, x + barWidth / 2, 270)
  })
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

const getScoreClass = (score?: number) => {
  if (!score) return 'is-light'
  if (score >= 90) return 'is-success'
  if (score >= 80) return 'is-info'
  if (score >= 70) return 'is-warning'
  return 'is-danger'
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const downloadCertificate = (enrollment: CourseEnrollment) => {
  try {
    const certificateHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>課程完成證書</title>
  <style>
    body {
      font-family: 'Microsoft JhengHei', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .certificate {
      width: 800px;
      padding: 60px;
      background: white;
      border: 10px solid #3273dc;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      text-align: center;
    }
    .certificate h1 {
      color: #3273dc;
      font-size: 48px;
      margin-bottom: 20px;
    }
    .certificate h2 {
      color: #363636;
      font-size: 32px;
      margin: 30px 0;
    }
    .certificate p {
      font-size: 18px;
      line-height: 1.8;
      color: #4a4a4a;
      margin: 15px 0;
    }
    .certificate .course-name {
      font-size: 28px;
      font-weight: bold;
      color: #3273dc;
      margin: 30px 0;
    }
    .certificate .score {
      font-size: 24px;
      color: #48c774;
      font-weight: bold;
      margin: 20px 0;
    }
    .certificate .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #dbdbdb;
      font-size: 16px;
      color: #7a7a7a;
    }
    @media print {
      body { background: white; }
      .certificate { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <h1>🎓 課程完成證書</h1>
    <h2>Certificate of Completion</h2>
    
    <p>茲證明</p>
    <p class="course-name">${enrollment.courseTitle}</p>
    <p>課程類型：${getCourseTypeLabel(enrollment.courseType)}</p>
    
    <p>已於 ${formatDate(enrollment.completionDate ?? '')} 完成課程</p>
    
    ${enrollment.finalScore ? `<p class="score">最終成績：${enrollment.finalScore} 分</p>` : ''}
    
    <div class="footer">
      <p><strong>藥助Next學院</strong></p>
      <p>Pharmacy Assistant Academy</p>
      <p>發證日期：${new Date().toLocaleDateString('zh-TW')}</p>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  <\/script>
<\/body>
<\/html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(certificateHTML)
      printWindow.document.close()
    } else {
      alert('請允許彈出視窗以下載證書')
    }
  } catch (err) {
    console.error('Error generating certificate:', err)
    alert('生成證書失敗，請稍後再試')
  }
}

// Lifecycle
onMounted(() => {
  loadEnrollments()
})
</script>

<style scoped>
.learning-history-view {
  min-height: calc(100vh - 200px);
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

canvas {
  width: 100%;
  height: 100%;
}

.table-container {
  overflow-x: auto;
}
</style>
