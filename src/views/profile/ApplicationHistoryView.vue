<template>
  <div class="application-history-view">
    <section class="section">
      <div class="container">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="title is-2">求職申請記錄</h1>
          <p class="subtitle">追蹤您的求職申請狀態</p>
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
        <div v-else-if="applications.length === 0" class="notification is-info">
          <p class="has-text-centered">
            <i class="fas fa-info-circle"></i>
            您尚未申請任何職缺
          </p>
          <div class="has-text-centered mt-4">
            <router-link to="/jobs" class="button is-primary">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>瀏覽職缺</span>
            </router-link>
          </div>
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Statistics Cards -->
          <div class="columns mb-5">
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">總申請數</p>
                <p class="title is-3">{{ applications.length }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">待審核</p>
                <p class="title is-3 has-text-warning">{{ pendingCount }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">已審核</p>
                <p class="title is-3 has-text-info">{{ reviewedCount }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">已錄取</p>
                <p class="title is-3 has-text-success">{{ acceptedCount }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">未錄取</p>
                <p class="title is-3 has-text-danger">{{ rejectedCount }}</p>
              </div>
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="tabs is-boxed mb-4">
            <ul>
              <li :class="{ 'is-active': activeTab === 'all' }">
                <a @click="activeTab = 'all'">
                  <span class="icon is-small"><i class="fas fa-list"></i></span>
                  <span>全部申請</span>
                </a>
              </li>
              <li :class="{ 'is-active': activeTab === 'pending' }">
                <a @click="activeTab = 'pending'">
                  <span class="icon is-small"><i class="fas fa-clock"></i></span>
                  <span>待審核</span>
                </a>
              </li>
              <li :class="{ 'is-active': activeTab === 'reviewed' }">
                <a @click="activeTab = 'reviewed'">
                  <span class="icon is-small"><i class="fas fa-eye"></i></span>
                  <span>已審核</span>
                </a>
              </li>
              <li :class="{ 'is-active': activeTab === 'accepted' }">
                <a @click="activeTab = 'accepted'">
                  <span class="icon is-small"><i class="fas fa-check"></i></span>
                  <span>已錄取</span>
                </a>
              </li>
              <li :class="{ 'is-active': activeTab === 'rejected' }">
                <a @click="activeTab = 'rejected'">
                  <span class="icon is-small"><i class="fas fa-times"></i></span>
                  <span>未錄取</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Applications List -->
          <div class="columns is-multiline">
            <div
              v-for="application in filteredApplications"
              :key="application.id"
              class="column is-12"
            >
              <div class="box">
                <div class="columns is-vcentered">
                  <div class="column is-8">
                    <div class="level is-mobile mb-3">
                      <div class="level-left">
                        <div class="level-item">
                          <span class="tag" :class="getStatusClass(application.status)">
                            {{ getStatusLabel(application.status) }}
                          </span>
                        </div>
                        <div class="level-item">
                          <span class="tag" :class="getJobTypeClass(application.jobType)">
                            {{ getJobTypeLabel(application.jobType) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h3 class="title is-4">{{ application.jobTitle }}</h3>

                    <div class="content">
                      <p class="mb-2">
                        <span class="icon-text">
                          <span class="icon has-text-info">
                            <i class="fas fa-building"></i>
                          </span>
                          <span>雇主：{{ application.employerName || '未提供' }}</span>
                        </span>
                      </p>

                      <p class="mb-2" v-if="application.jobLocation">
                        <span class="icon-text">
                          <span class="icon has-text-info">
                            <i class="fas fa-map-marker-alt"></i>
                          </span>
                          <span>地點：{{ application.jobLocation }}</span>
                        </span>
                      </p>

                      <p class="mb-2">
                        <span class="icon-text">
                          <span class="icon has-text-info">
                            <i class="fas fa-calendar"></i>
                          </span>
                          <span>申請日期：{{ formatDate(application.applicationDate) }}</span>
                        </span>
                      </p>

                      <div v-if="application.coverLetter" class="mt-3">
                        <p class="has-text-weight-semibold">求職信：</p>
                        <p class="is-size-7 has-text-grey">{{ truncateText(application.coverLetter, 150) }}</p>
                      </div>
                    </div>

                    <!-- Interview Notification -->
                    <div v-if="application.status === 'accepted'" class="notification is-success is-light mt-3">
                      <p class="has-text-weight-semibold">
                        <span class="icon">
                          <i class="fas fa-check-circle"></i>
                        </span>
                        恭喜！您已被錄取
                      </p>
                      <p class="is-size-7">請等待雇主聯繫您安排面試或入職事宜</p>
                    </div>

                    <div v-if="application.status === 'reviewed'" class="notification is-info is-light mt-3">
                      <p class="has-text-weight-semibold">
                        <span class="icon">
                          <i class="fas fa-info-circle"></i>
                        </span>
                        您的申請已被審核
                      </p>
                      <p class="is-size-7">雇主正在評估您的申請，請耐心等待</p>
                    </div>
                  </div>

                  <div class="column is-4 has-text-right">
                    <div class="buttons is-right">
                      <router-link
                        :to="`/jobs/${application.jobId}`"
                        class="button is-info is-light"
                      >
                        <span class="icon">
                          <i class="fas fa-info-circle"></i>
                        </span>
                        <span>職缺詳情</span>
                      </router-link>

                      <button
                        v-if="application.coverLetter"
                        class="button is-light"
                        @click="viewCoverLetter(application)"
                      >
                        <span class="icon">
                          <i class="fas fa-file-alt"></i>
                        </span>
                        <span>查看求職信</span>
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

    <!-- Cover Letter Modal -->
    <div class="modal" :class="{ 'is-active': showCoverLetterModal }">
      <div class="modal-background" @click="closeCoverLetter"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">求職信</p>
          <button class="delete" aria-label="close" @click="closeCoverLetter"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedApplication">
            <h4 class="title is-5 mb-3">{{ selectedApplication.jobTitle }}</h4>
            <p class="subtitle is-6 has-text-grey mb-4">
              申請日期：{{ formatDate(selectedApplication.applicationDate) }}
            </p>
            <div class="content">
              <p style="white-space: pre-wrap;">{{ selectedApplication.coverLetter }}</p>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button" @click="closeCoverLetter">關閉</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import { apiService } from '@/services/api'

// Application interface
interface JobApplication {
  id: number
  jobId: number
  applicantId: number
  applicationDate: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  coverLetter: string | null
  resumeUrl: string | null
  jobTitle: string
  jobLocation: string | null
  jobType: 'full_time' | 'part_time' | 'internship' | null
  employerName: string | null
}

// State
const applications = ref<JobApplication[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected'>('all')
const showCoverLetterModal = ref(false)
const selectedApplication = ref<JobApplication | null>(null)

// Computed
const filteredApplications = computed(() => {
  if (activeTab.value === 'all') {
    return applications.value
  }
  return applications.value.filter(app => app.status === activeTab.value)
})

const pendingCount = computed(() => {
  return applications.value.filter(app => app.status === 'pending').length
})

const reviewedCount = computed(() => {
  return applications.value.filter(app => app.status === 'reviewed').length
})

const acceptedCount = computed(() => {
  return applications.value.filter(app => app.status === 'accepted').length
})

const rejectedCount = computed(() => {
  return applications.value.filter(app => app.status === 'rejected').length
})

// Methods
const loadApplications = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await apiService.get<JobApplication[]>('/applications')

    if (response.success && response.data) {
      applications.value = response.data
    } else {
      throw new Error(response.error?.message || '載入申請記錄失敗')
    }
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || err.message || '載入申請記錄失敗，請稍後再試'
    console.error('Error loading applications:', err)
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'is-success'
    case 'reviewed':
      return 'is-info'
    case 'pending':
      return 'is-warning'
    case 'rejected':
      return 'is-danger'
    default:
      return 'is-light'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'accepted':
      return '已錄取'
    case 'reviewed':
      return '已審核'
    case 'pending':
      return '待審核'
    case 'rejected':
      return '未錄取'
    default:
      return '未知'
  }
}

const getJobTypeClass = (jobType: string | null) => {
  switch (jobType) {
    case 'full_time':
      return 'is-primary'
    case 'part_time':
      return 'is-info'
    case 'internship':
      return 'is-success'
    default:
      return 'is-light'
  }
}

const getJobTypeLabel = (jobType: string | null) => {
  switch (jobType) {
    case 'full_time':
      return '全職'
    case 'part_time':
      return '兼職'
    case 'internship':
      return '實習'
    default:
      return '未指定'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

const viewCoverLetter = (application: JobApplication) => {
  selectedApplication.value = application
  showCoverLetterModal.value = true
}

const closeCoverLetter = () => {
  showCoverLetterModal.value = false
  selectedApplication.value = null
}

// Lifecycle
onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.application-history-view {
  min-height: calc(100vh - 200px);
}

.tabs {
  margin-bottom: 1.5rem;
}
</style>
