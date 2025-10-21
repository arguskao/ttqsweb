<template>
  <div class="analytics-dashboard">
    <section class="section">
      <div class="container">
        <h1 class="title">數據分析儀表板</h1>
        <p class="subtitle">系統統計與報告</p>

        <!-- 日期篩選器 -->
        <div class="box">
          <div class="columns">
            <div class="column is-3">
              <div class="field">
                <label class="label">開始日期</label>
                <div class="control">
                  <input
                    v-model="filters.startDate"
                    type="date"
                    class="input"
                    @change="loadAllStats"
                  />
                </div>
              </div>
            </div>
            <div class="column is-3">
              <div class="field">
                <label class="label">結束日期</label>
                <div class="control">
                  <input
                    v-model="filters.endDate"
                    type="date"
                    class="input"
                    @change="loadAllStats"
                  />
                </div>
              </div>
            </div>
            <div class="column is-3">
              <div class="field">
                <label class="label">報告類型</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="exportType">
                      <option value="learning">學習統計</option>
                      <option value="job-matching">就業媒合</option>
                      <option value="satisfaction">課程滿意度</option>
                      <option value="comprehensive">綜合報告</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="column is-3">
              <div class="field">
                <label class="label">&nbsp;</label>
                <div class="control">
                  <button
                    class="button is-primary is-fullwidth"
                    @click="exportReport"
                    :class="{ 'is-loading': exporting }"
                  >
                    <span class="icon">
                      <i class="fas fa-download"></i>
                    </span>
                    <span>匯出報告</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 關鍵指標卡片 -->
        <div v-if="dashboardStats" class="columns is-multiline">
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">總學員數</p>
              <p class="title">{{ dashboardStats.keyMetrics.total_learners }}</p>
            </div>
          </div>
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">活躍課程</p>
              <p class="title">{{ dashboardStats.keyMetrics.active_courses }}</p>
            </div>
          </div>
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">活躍職缺</p>
              <p class="title">{{ dashboardStats.keyMetrics.active_jobs }}</p>
            </div>
          </div>
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">認證講師</p>
              <p class="title">{{ dashboardStats.keyMetrics.active_instructors }}</p>
            </div>
          </div>
        </div>

        <!-- 最近30天活動 -->
        <div v-if="dashboardStats" class="box">
          <h2 class="title is-4">最近30天活動</h2>
          <div class="columns is-multiline">
            <div class="column is-3">
              <div class="notification is-info is-light">
                <p class="heading">新用戶</p>
                <p class="title is-5">{{ dashboardStats.recentActivity.new_users_30d }}</p>
              </div>
            </div>
            <div class="column is-3">
              <div class="notification is-success is-light">
                <p class="heading">新註冊課程</p>
                <p class="title is-5">{{ dashboardStats.recentActivity.new_enrollments_30d }}</p>
              </div>
            </div>
            <div class="column is-3">
              <div class="notification is-warning is-light">
                <p class="heading">新求職申請</p>
                <p class="title is-5">{{ dashboardStats.recentActivity.new_applications_30d }}</p>
              </div>
            </div>
            <div class="column is-3">
              <div class="notification is-primary is-light">
                <p class="heading">課程完成數</p>
                <p class="title is-5">{{ dashboardStats.recentActivity.completions_30d }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 成功率指標 -->
        <div v-if="dashboardStats" class="box">
          <h2 class="title is-4">成功率指標</h2>
          <div class="columns">
            <div class="column">
              <div class="content">
                <p><strong>平均課程分數:</strong> {{ dashboardStats.successRates.avg_course_score || 'N/A' }}</p>
                <progress
                  class="progress is-primary"
                  :value="dashboardStats.successRates.avg_course_score || 0"
                  max="100"
                ></progress>
              </div>
            </div>
            <div class="column">
              <div class="content">
                <p><strong>及格率:</strong> {{ dashboardStats.successRates.passing_rate || 'N/A' }}%</p>
                <progress
                  class="progress is-success"
                  :value="dashboardStats.successRates.passing_rate || 0"
                  max="100"
                ></progress>
              </div>
            </div>
            <div class="column">
              <div class="content">
                <p><strong>就業成功率:</strong> {{ dashboardStats.successRates.job_success_rate || 'N/A' }}%</p>
                <progress
                  class="progress is-info"
                  :value="dashboardStats.successRates.job_success_rate || 0"
                  max="100"
                ></progress>
              </div>
            </div>
            <div class="column">
              <div class="content">
                <p><strong>平均滿意度:</strong> {{ dashboardStats.successRates.avg_satisfaction_score || 'N/A' }}</p>
                <progress
                  class="progress is-warning"
                  :value="dashboardStats.successRates.avg_satisfaction_score || 0"
                  max="100"
                ></progress>
              </div>
            </div>
          </div>
        </div>

        <!-- 學習統計 -->
        <div class="box">
          <h2 class="title is-4">學習統計</h2>
          <div v-if="loading.learning" class="has-text-centered">
            <p>載入中...</p>
          </div>
          <div v-else-if="learningStats">
            <div class="columns">
              <div class="column is-half">
                <h3 class="subtitle is-5">總體統計</h3>
                <table class="table is-fullwidth">
                  <tbody>
                    <tr>
                      <td>總學員數</td>
                      <td><strong>{{ learningStats.overall.total_learners }}</strong></td>
                    </tr>
                    <tr>
                      <td>總註冊數</td>
                      <td><strong>{{ learningStats.overall.total_enrollments }}</strong></td>
                    </tr>
                    <tr>
                      <td>已完成</td>
                      <td><strong>{{ learningStats.overall.completed_enrollments }}</strong></td>
                    </tr>
                    <tr>
                      <td>進行中</td>
                      <td><strong>{{ learningStats.overall.in_progress_enrollments }}</strong></td>
                    </tr>
                    <tr>
                      <td>平均進度</td>
                      <td><strong>{{ learningStats.overall.avg_progress }}%</strong></td>
                    </tr>
                    <tr>
                      <td>平均分數</td>
                      <td><strong>{{ learningStats.overall.avg_score }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="column is-half">
                <h3 class="subtitle is-5">按課程類型統計</h3>
                <table class="table is-fullwidth">
                  <thead>
                    <tr>
                      <th>類型</th>
                      <th>學員數</th>
                      <th>完成數</th>
                      <th>平均分數</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="stat in learningStats.byType" :key="stat.course_type">
                      <td>{{ getCourseTypeName(stat.course_type) }}</td>
                      <td>{{ stat.learner_count }}</td>
                      <td>{{ stat.completed_count }}</td>
                      <td>{{ stat.avg_score }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 熱門課程 -->
            <h3 class="subtitle is-5 mt-5">熱門課程排行</h3>
            <table class="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>課程名稱</th>
                  <th>類型</th>
                  <th>註冊數</th>
                  <th>完成數</th>
                  <th>完成率</th>
                  <th>平均分數</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in learningStats.topCourses" :key="course.id">
                  <td>{{ course.title }}</td>
                  <td>{{ getCourseTypeName(course.course_type) }}</td>
                  <td>{{ course.enrollment_count }}</td>
                  <td>{{ course.completion_count }}</td>
                  <td>{{ course.completion_rate }}%</td>
                  <td>{{ course.avg_score }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 就業媒合統計 -->
        <div class="box">
          <h2 class="title is-4">就業媒合統計</h2>
          <div v-if="loading.jobMatching" class="has-text-centered">
            <p>載入中...</p>
          </div>
          <div v-else-if="jobMatchingStats">
            <div class="columns">
              <div class="column is-half">
                <h3 class="subtitle is-5">總體統計</h3>
                <table class="table is-fullwidth">
                  <tbody>
                    <tr>
                      <td>總申請人數</td>
                      <td><strong>{{ jobMatchingStats.overall.total_applicants }}</strong></td>
                    </tr>
                    <tr>
                      <td>總申請數</td>
                      <td><strong>{{ jobMatchingStats.overall.total_applications }}</strong></td>
                    </tr>
                    <tr>
                      <td>已錄取</td>
                      <td><strong class="has-text-success">{{ jobMatchingStats.overall.accepted_applications }}</strong></td>
                    </tr>
                    <tr>
                      <td>已拒絕</td>
                      <td><strong class="has-text-danger">{{ jobMatchingStats.overall.rejected_applications }}</strong></td>
                    </tr>
                    <tr>
                      <td>待處理</td>
                      <td><strong>{{ jobMatchingStats.overall.pending_applications }}</strong></td>
                    </tr>
                    <tr>
                      <td>成功率</td>
                      <td><strong class="has-text-primary">{{ jobMatchingStats.overall.success_rate }}%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="column is-half">
                <h3 class="subtitle is-5">按職位類型統計</h3>
                <table class="table is-fullwidth">
                  <thead>
                    <tr>
                      <th>類型</th>
                      <th>申請數</th>
                      <th>錄取數</th>
                      <th>成功率</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="stat in jobMatchingStats.byJobType" :key="stat.job_type">
                      <td>{{ getJobTypeName(stat.job_type) }}</td>
                      <td>{{ stat.application_count }}</td>
                      <td>{{ stat.accepted_count }}</td>
                      <td>{{ stat.success_rate }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 學員就業成功率 -->
            <div v-if="jobMatchingStats.learnerSuccess" class="notification is-info is-light">
              <h3 class="subtitle is-5">學員就業成功率</h3>
              <p>
                <strong>有申請記錄的學員:</strong> {{ jobMatchingStats.learnerSuccess.total_learners_with_applications }} 人<br>
                <strong>已就業學員:</strong> {{ jobMatchingStats.learnerSuccess.employed_learners }} 人<br>
                <strong>就業率:</strong> <span class="tag is-success is-large">{{ jobMatchingStats.learnerSuccess.employment_rate }}%</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 課程滿意度統計 -->
        <div class="box">
          <h2 class="title is-4">課程滿意度統計</h2>
          <div v-if="loading.satisfaction" class="has-text-centered">
            <p>載入中...</p>
          </div>
          <div v-else-if="satisfactionStats">
            <div class="columns">
              <div class="column">
                <h3 class="subtitle is-5">總體滿意度</h3>
                <table class="table is-fullwidth">
                  <tbody>
                    <tr>
                      <td>總評價數</td>
                      <td><strong>{{ satisfactionStats.overall.total_evaluations }}</strong></td>
                    </tr>
                    <tr>
                      <td>平均反應分數</td>
                      <td><strong>{{ satisfactionStats.overall.avg_reaction_score }}</strong></td>
                    </tr>
                    <tr>
                      <td>平均學習分數</td>
                      <td><strong>{{ satisfactionStats.overall.avg_learning_score }}</strong></td>
                    </tr>
                    <tr>
                      <td>平均行為分數</td>
                      <td><strong>{{ satisfactionStats.overall.avg_behavior_score }}</strong></td>
                    </tr>
                    <tr>
                      <td>平均成果分數</td>
                      <td><strong>{{ satisfactionStats.overall.avg_result_score }}</strong></td>
                    </tr>
                    <tr>
                      <td>整體平均分數</td>
                      <td><strong class="has-text-primary">{{ satisfactionStats.overall.avg_overall_score }}</strong></td>
                    </tr>
                    <tr>
                      <td>滿意度達標率</td>
                      <td><strong class="has-text-success">{{ satisfactionStats.overall.satisfaction_rate }}%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 按講師統計 -->
            <h3 class="subtitle is-5 mt-5">講師滿意度排行</h3>
            <table class="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>講師姓名</th>
                  <th>授課數</th>
                  <th>評價數</th>
                  <th>平均分數</th>
                  <th>滿意評價數</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="instructor in satisfactionStats.byInstructor" :key="instructor.id">
                  <td>{{ instructor.name }}</td>
                  <td>{{ instructor.courses_taught }}</td>
                  <td>{{ instructor.evaluation_count }}</td>
                  <td>
                    <span
                      class="tag"
                      :class="{
                        'is-success': instructor.avg_score >= 80,
                        'is-warning': instructor.avg_score >= 60 && instructor.avg_score < 80,
                        'is-danger': instructor.avg_score < 60
                      }"
                    >
                      {{ instructor.avg_score }}
                    </span>
                  </td>
                  <td>{{ instructor.satisfactory_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import api from '@/services/api'

const filters = ref({
  startDate: '',
  endDate: ''
})

const exportType = ref('comprehensive')
const exporting = ref(false)

const loading = ref({
  learning: false,
  jobMatching: false,
  satisfaction: false,
  dashboard: false
})

const dashboardStats = ref<any>(null)
const learningStats = ref<any>(null)
const jobMatchingStats = ref<any>(null)
const satisfactionStats = ref<any>(null)

onMounted(() => {
  loadAllStats()
})

async function loadAllStats() {
  await Promise.all([
    loadDashboardStats(),
    loadLearningStats(),
    loadJobMatchingStats(),
    loadSatisfactionStats()
  ])
}

async function loadDashboardStats() {
  loading.value.dashboard = true
  try {
    const response = await api.get('/analytics/dashboard')
    if (response.data.success) {
      dashboardStats.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
  } finally {
    loading.value.dashboard = false
  }
}

async function loadLearningStats() {
  loading.value.learning = true
  try {
    const params: any = {}
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate

    const response = await api.get('/analytics/learning-stats', { params })
    if (response.data.success) {
      learningStats.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading learning stats:', error)
  } finally {
    loading.value.learning = false
  }
}

async function loadJobMatchingStats() {
  loading.value.jobMatching = true
  try {
    const params: any = {}
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate

    const response = await api.get('/analytics/job-matching-stats', { params })
    if (response.data.success) {
      jobMatchingStats.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading job matching stats:', error)
  } finally {
    loading.value.jobMatching = false
  }
}

async function loadSatisfactionStats() {
  loading.value.satisfaction = true
  try {
    const params: any = {}
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate

    const response = await api.get('/analytics/course-satisfaction-stats', { params })
    if (response.data.success) {
      satisfactionStats.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading satisfaction stats:', error)
  } finally {
    loading.value.satisfaction = false
  }
}

async function exportReport() {
  exporting.value = true
  try {
    const params: any = {
      reportType: exportType.value,
      format: 'json'
    }
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate

    const response = await api.get('/analytics/export', { params })
    if (response.data.success) {
      // 下載報告
      const data = response.data.data
      const blob = new Blob([JSON.stringify(data.content, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename
      link.click()
      window.URL.revokeObjectURL(url)

      alert('報告已成功匯出！')
    }
  } catch (error) {
    console.error('Error exporting report:', error)
    alert('匯出報告失敗，請稍後再試')
  } finally {
    exporting.value = false
  }
}

function getCourseTypeName(type: string): string {
  const types: Record<string, string> = {
    basic: '基礎課程',
    advanced: '進階課程',
    internship: '實習課程'
  }
  return types[type] || type
}

function getJobTypeName(type: string): string {
  const types: Record<string, string> = {
    full_time: '全職',
    part_time: '兼職',
    internship: '實習'
  }
  return types[type] || type
}
</script>

<style scoped>
.analytics-dashboard {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.box {
  margin-bottom: 2rem;
}

.notification {
  margin-bottom: 0;
}

.progress {
  margin-top: 0.5rem;
}
</style>
