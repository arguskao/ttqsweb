<template>
  <div class="employer-jobs-view">
    <section class="hero is-primary">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">職缺管理</h1>
          <h2 class="subtitle">管理您發布的職缺和申請者</h2>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="level">
          <div class="level-left">
            <div class="level-item">
              <h2 class="title is-4">我的職缺</h2>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <button class="button is-primary" @click="showCreateModal = true">
                <span class="icon">
                  <i class="fas fa-plus"></i>
                </span>
                <span>發布新職缺</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="has-text-centered py-6">
          <button class="button is-loading is-large is-white"></button>
          <p class="mt-4">載入職缺中...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="notification is-danger">
          <button class="delete" @click="error = null"></button>
          {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="jobs.length === 0" class="box has-text-centered py-6">
          <span class="icon is-large has-text-grey-light">
            <i class="fas fa-briefcase fa-3x"></i>
          </span>
          <p class="title is-5 mt-4">您還沒有發布任何職缺</p>
          <p class="subtitle is-6">點擊上方按鈕開始發布職缺</p>
        </div>

        <!-- Jobs List -->
        <JobsList
          v-else
          :jobs="jobs"
          :search-query="searchQuery"
          :status-filter="statusFilter"
          :sort-by="sortBy"
          :current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
          @update:search-query="searchQuery = $event"
          @update:status-filter="statusFilter = $event"
          @update:sort-by="sortBy = $event"
          @reset-filters="resetFilters"
          @edit-job="handleEditJob"
          @view-applications="handleViewApplications"
          @duplicate-job="handleDuplicateJob"
          @delete-job="handleDeleteJob"
          @change-page="handlePageChange"
        />
      </div>
    </section>

    <!-- Create/Edit Job Modal -->
    <JobModal
      :is-visible="showCreateModal || showEditModal"
      :is-editing="showEditModal"
      :job-data="editingJob"
      :is-submitting="isSubmitting"
      @close="closeModals"
      @submit="handleJobSubmit"
    />

    <!-- Applications Modal -->
    <ApplicationsModal
      :is-visible="showApplicationsModal"
      :job-title="selectedJob?.title ?? ''"
      :applications="applications"
      :status-filter="applicationStatusFilter"
      :search-query="applicationSearchQuery"
      @close="showApplicationsModal = false"
      @update:status-filter="applicationStatusFilter = $event"
      @update:search-query="applicationSearchQuery = $event"
      @reset-filters="resetApplicationFilters"
      @view-resume="handleViewResume"
      @accept-application="handleAcceptApplication"
      @reject-application="handleRejectApplication"
      @contact-applicant="handleContactApplicant"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import ApplicationsModal from '@/components/jobs/ApplicationsModal.vue'
import JobModal from '@/components/jobs/JobModal.vue'
import JobsList from '@/components/jobs/JobsList.vue'

// 響應式數據
const loading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// 職缺相關
const jobs = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('created_at')
const currentPage = ref(1)
const totalPages = ref(1)

// 模態框狀態
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showApplicationsModal = ref(false)
const editingJob = ref<any>(null)
const selectedJob = ref<any>(null)

// 申請者相關
const applications = ref<any[]>([])
const applicationStatusFilter = ref('')
const applicationSearchQuery = ref('')

// 載入職缺列表
const loadJobs = async () => {
  loading.value = true
  error.value = null

  try {
    // 模擬API調用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模擬數據
    jobs.value = [
      {
        id: 1,
        title: '藥局助理',
        description: '協助藥師處理日常事務，包括藥品管理、客戶服務等。需要具備基本的藥品知識和良好的溝通能力。',
        location: '台北市信義區',
        salary: 30000,
        employmentType: 'full_time',
        status: 'active',
        applicationCount: 15,
        createdAt: '2024-01-15T10:00:00Z',
        expiresAt: '2024-02-15T23:59:59Z'
      },
      {
        id: 2,
        title: '藥品管理專員',
        description: '負責藥品庫存管理、進貨驗收、品質控制等工作。需要有相關工作經驗。',
        location: '新北市板橋區',
        salary: 35000,
        employmentType: 'full_time',
        status: 'active',
        applicationCount: 8,
        createdAt: '2024-01-10T14:30:00Z',
        expiresAt: '2024-02-10T23:59:59Z'
      },
      {
        id: 3,
        title: '藥局實習生',
        description: '學習藥局基本操作，協助藥師工作。適合藥學相關科系學生。',
        location: '桃園市中壢區',
        salary: null,
        employmentType: 'internship',
        status: 'paused',
        applicationCount: 23,
        createdAt: '2024-01-05T09:15:00Z',
        expiresAt: null
      }
    ]

    totalPages.value = 1
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入職缺時發生錯誤'
  } finally {
    loading.value = false
  }
}

// 載入申請者列表
const loadApplications = async (jobId: number) => {
  try {
    // 模擬API調用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模擬數據
    applications.value = [
      {
        id: 1,
        applicantName: '張小明',
        applicantEmail: 'zhang@example.com',
        appliedAt: '2024-01-20T10:00:00Z',
        status: 'pending',
        message: '我對這個職位很感興趣，希望能有機會面試。',
        resumeFileName: '張小明_履歷.pdf'
      },
      {
        id: 2,
        applicantName: '李美華',
        applicantEmail: 'li@example.com',
        appliedAt: '2024-01-19T15:30:00Z',
        status: 'accepted',
        message: '我有相關工作經驗，希望能為貴公司貢獻所長。',
        resumeFileName: '李美華_履歷.pdf'
      },
      {
        id: 3,
        applicantName: '王大偉',
        applicantEmail: 'wang@example.com',
        appliedAt: '2024-01-18T11:45:00Z',
        status: 'rejected',
        message: '雖然沒有相關經驗，但我學習能力強，希望能給我機會。',
        resumeFileName: null
      }
    ]
  } catch (err) {
    error.value = '載入申請者時發生錯誤'
  }
}

// 事件處理
const handleEditJob = (job: any) => {
  editingJob.value = job
  showEditModal.value = true
}

const handleViewApplications = async (job: any) => {
  selectedJob.value = job
  await loadApplications(job.id)
  showApplicationsModal.value = true
}

const handleDuplicateJob = (job: any) => {
  editingJob.value = { ...job, id: null, title: `${job.title} (複製)` }
  showEditModal.value = true
}

const handleDeleteJob = async (job: any) => {
  if (confirm(`確定要刪除職缺「${job.title}」嗎？`)) {
    try {
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 500))

      jobs.value = jobs.value.filter(j => j.id !== job.id)
    } catch (err) {
      error.value = '刪除職缺時發生錯誤'
    }
  }
}

const handleJobSubmit = async (jobData: any) => {
  isSubmitting.value = true

  try {
    // 模擬API調用
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (showEditModal.value && editingJob.value) {
      // 更新職缺
      const index = jobs.value.findIndex(j => j.id === editingJob.value.id)
      if (index !== -1) {
        jobs.value[index] = { ...jobs.value[index], ...jobData }
      }
    } else {
      // 創建新職缺
      const newJob = {
        id: Date.now(),
        ...jobData,
        status: 'active',
        applicationCount: 0,
        createdAt: new Date().toISOString()
      }
      jobs.value.unshift(newJob)
    }

    closeModals()
  } catch (err) {
    error.value = '儲存職缺時發生錯誤'
  } finally {
    isSubmitting.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadJobs()
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingJob.value = null
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  sortBy.value = 'created_at'
  currentPage.value = 1
  loadJobs()
}

const resetApplicationFilters = () => {
  applicationStatusFilter.value = ''
  applicationSearchQuery.value = ''
}

const handleViewResume = (application: any) => {
  // 實現查看履歷邏輯
  console.log('查看履歷:', application)
}

const handleAcceptApplication = async (application: any) => {
  try {
    // 模擬API調用
    await new Promise(resolve => setTimeout(resolve, 500))

    application.status = 'accepted'
  } catch (err) {
    error.value = '更新申請狀態時發生錯誤'
  }
}

const handleRejectApplication = async (application: any) => {
  try {
    // 模擬API調用
    await new Promise(resolve => setTimeout(resolve, 500))

    application.status = 'rejected'
  } catch (err) {
    error.value = '更新申請狀態時發生錯誤'
  }
}

const handleContactApplicant = (application: any) => {
  // 實現聯絡申請者邏輯
  console.log('聯絡申請者:', application)
}

// 組件掛載時載入數據
onMounted(() => {
  loadJobs()
})
</script>

<style scoped>
.employer-jobs-view {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.hero {
  margin-bottom: 0;
}

.section {
  padding-top: 2rem;
}

.level {
  margin-bottom: 2rem;
}

.notification {
  margin-bottom: 2rem;
}

.empty-state {
  margin: 2rem 0;
}

.title {
  color: #363636;
}

.subtitle {
  color: #666;
}
</style>
