<template>
  <div class="jobs-view">
    <section class="hero is-primary">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">就業媒合平台</h1>
          <h2 class="subtitle">尋找適合您的藥局工作機會</h2>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <!-- Search and Filter Section -->
        <div class="box">
          <div class="columns">
            <div class="column is-12">
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input
                    v-model="searchQuery"
                    class="input"
                    type="text"
                    placeholder="搜尋職缺標題或描述..."
                    @keyup.enter="handleSearch"
                  />
                </div>
                <div class="control">
                  <button class="button is-primary" @click="handleSearch">
                    <span class="icon">
                      <span>🔍</span>
                    </span>
                    <span>搜尋</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="columns">
            <div class="column is-3">
              <div class="field">
                <label class="label">工作類型</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="filters.jobType" @change="handleSearch">
                      <option value="">全部</option>
                      <option value="full_time">全職</option>
                      <option value="part_time">兼職</option>
                      <option value="internship">實習</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="column is-3">
              <div class="field">
                <label class="label">地區</label>
                <div class="control">
                  <input
                    v-model="filters.location"
                    class="input"
                    type="text"
                    placeholder="輸入地區..."
                    @keyup.enter="handleSearch"
                  />
                </div>
              </div>
            </div>

            <div class="column is-3">
              <div class="field">
                <label class="label">最低薪資</label>
                <div class="control">
                  <input
                    v-model.number="filters.salaryMin"
                    class="input"
                    type="number"
                    placeholder="例如: 30000"
                    @keyup.enter="handleSearch"
                  />
                </div>
              </div>
            </div>

            <div class="column is-3">
              <div class="field">
                <label class="label">最高薪資</label>
                <div class="control">
                  <input
                    v-model.number="filters.salaryMax"
                    class="input"
                    type="number"
                    placeholder="例如: 50000"
                    @keyup.enter="handleSearch"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="field is-grouped">
            <div class="control">
              <button class="button is-light" @click="clearFilters">
                <span class="icon">
                  <span>✕</span>
                </span>
                <span>清除篩選</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="has-text-centered py-6" role="status" aria-live="polite">
          <button class="button is-loading is-large is-white" aria-hidden="true"></button>
          <p class="mt-4">載入職缺中...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="notification is-danger" role="alert" aria-live="assertive">
          <button class="delete" aria-label="關閉錯誤訊息" @click="error = null"></button>
          {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="jobs.length === 0" class="box has-text-centered py-6">
          <span class="icon is-large has-text-grey-light" style="font-size: 3rem">
            <span>💼</span>
          </span>
          <p class="title is-5 mt-4">目前沒有符合條件的職缺</p>
          <p class="subtitle is-6">請嘗試調整搜尋條件</p>
        </div>

        <!-- Jobs Grid -->
        <div v-else>
          <div class="level mb-4">
            <div class="level-left">
              <div class="level-item">
                <p class="subtitle is-6">
                  找到 <strong>{{ meta.total }}</strong> 個職缺
                </p>
              </div>
            </div>
          </div>

          <div class="columns is-multiline">
            <div v-for="job in jobs" :key="job.id" class="column is-4">
              <JobCard
                :job="job"
                :show-apply="true"
                :show-favorite="false"
                :favorited="false"
                @view-details="viewJobDetails"
                @apply="applyToJob"
              />
            </div>
          </div>

          <!-- Pagination -->
          <nav v-if="meta.totalPages > 1" class="pagination is-centered mt-5" role="navigation">
            <button
              class="pagination-previous"
              :disabled="meta.page === 1"
              @click="goToPage(meta.page - 1)"
            >
              上一頁
            </button>
            <button
              class="pagination-next"
              :disabled="meta.page === meta.totalPages"
              @click="goToPage(meta.page + 1)"
            >
              下一頁
            </button>
            <ul class="pagination-list">
              <li v-for="page in visiblePages" :key="page">
                <button
                  v-if="page !== '...'"
                  class="pagination-link"
                  :class="{ 'is-current': page === meta.page }"
                  @click="goToPage(page as number)"
                >
                  {{ page }}
                </button>
                <span v-else class="pagination-ellipsis">&hellip;</span>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </section>

    <!-- Application Modal -->
    <div class="modal" :class="{ 'is-active': showApplicationModal }">
      <div class="modal-background" @click="showApplicationModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">申請職缺：{{ selectedJob?.title }}</p>
          <button class="delete" @click="showApplicationModal = false"></button>
        </header>
        <section class="modal-card-body">
          <form @submit.prevent="submitApplication">
            <div class="field">
              <label class="label">求職信</label>
              <div class="control">
                <textarea
                  v-model="applicationForm.coverLetter"
                  class="textarea"
                  placeholder="請簡述您的工作經驗和為何適合此職位..."
                  rows="6"
                ></textarea>
              </div>
            </div>

            <div class="field">
              <label class="label">履歷檔案</label>
              <div class="control">
                <div class="file has-name is-boxed is-fullwidth">
                  <label class="file-label">
                    <input
                      ref="resumeInput"
                      class="file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      @change="handleResumeSelect"
                    />
                    <span class="file-cta">
                      <span class="file-icon">
                        <span>📄</span>
                      </span>
                      <span class="file-label">選擇履歷檔案</span>
                    </span>
                    <span v-if="selectedResumeFile" class="file-name">
                      {{ selectedResumeFile.name }}
                    </span>
                    <span v-else class="file-name">未選擇檔案</span>
                  </label>
                </div>
              </div>
              <p class="help">只支持 PDF、DOC、DOCX 格式，最大 10MB</p>
            </div>
            
            <div v-if="uploadingResume" class="notification is-info is-light">
              <p class="has-text-centered">
                <span class="icon is-large">
                  <span style="animation: spin 1s linear infinite">⏳</span>
                </span>
                履歷上傳中...
              </p>
            </div>

            <div v-if="applicationError" class="notification is-danger is-light">
              {{ applicationError }}
            </div>
          </form>
        </section>
        <footer class="modal-card-foot">
          <button class="button" @click="showApplicationModal = false">取消</button>
          <button
            class="button is-primary"
            :class="{ 'is-loading': submitting }"
            :disabled="submitting"
            @click="submitApplication"
          >
            <span>✈️ 提交申請</span>
          </button>
        </footer>
      </div>
    </div>

    <!-- Success Modal -->
    <div class="modal" :class="{ 'is-active': showSuccessModal }">
      <div class="modal-background" @click="closeSuccessModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">申請成功</p>
          <button class="delete" @click="closeSuccessModal"></button>
        </header>
        <section class="modal-card-body">
          <div class="has-text-centered">
            <span class="icon is-large has-text-success" style="font-size: 3rem">
              <span>✅</span>
            </span>
            <p class="title is-4 mt-4">您的申請已成功提交！</p>
            <p class="subtitle is-6">雇主將會審核您的申請，請耐心等待回覆。</p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary is-fullwidth" @click="closeSuccessModal">
            確定
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import JobCard from '@/components/common/JobCard.vue'
import jobService from '@/services/job-service'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface Job {
  id: number
  title: string
  description?: string | null
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  jobType?: 'full_time' | 'part_time' | 'internship' | null
  employerName?: string
  createdAt: string
  expiresAt?: string | null
  hasApplied?: boolean
}

const router = useRouter()
const authStore = useAuthStore()

const jobs = ref<Job[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const filters = ref({
  jobType: '',
  location: '',
  salaryMin: null as number | null,
  salaryMax: null as number | null
})

const meta = ref({
  page: 1,
  limit: 9,
  total: 0,
  totalPages: 0
})

// Application modal related
const showApplicationModal = ref(false)
const selectedJobId = ref<number | null>(null)
const selectedJob = ref<Job | null>(null)
const submitting = ref(false)
const applicationError = ref<string | null>(null)
const showSuccessModal = ref(false)
const uploadingResume = ref(false)
const selectedResumeFile = ref<File | null>(null)
const resumeInput = ref<HTMLInputElement | null>(null)
const applicationForm = ref({
  coverLetter: '',
  resumeUrl: ''
})

const isJobSeeker = computed(() => {
  return authStore.user?.userType === 'job_seeker'
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const current = meta.value.page
  const total = meta.value.totalPages

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

const fetchJobs = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('載入工作，篩選條件:', { searchQuery: searchQuery.value, filters: filters.value }) // 調試日誌

    const params: any = {
      page: meta.value.page,
      limit: meta.value.limit
    }

    if (searchQuery.value) params.search = searchQuery.value
    if (filters.value.jobType) params.jobType = filters.value.jobType
    if (filters.value.location) params.location = filters.value.location
    if (filters.value.salaryMin) params.salaryMin = filters.value.salaryMin
    if (filters.value.salaryMax) params.salaryMax = filters.value.salaryMax

    const response = await jobService.getJobs(params)
    console.log('工作服務響應:', response) // 調試日誌

    jobs.value = response.data
    meta.value = response.meta

    console.log('工作數據:', jobs.value) // 調試日誌
    console.log('總工作數:', meta.value.total) // 調試日誌
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '載入職缺失敗，請稍後再試'
    console.error('Failed to fetch jobs:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  meta.value.page = 1
  fetchJobs()
}

const clearFilters = () => {
  searchQuery.value = ''
  filters.value = {
    jobType: '',
    location: '',
    salaryMin: null,
    salaryMax: null
  }
  handleSearch()
}

const goToPage = (page: number) => {
  meta.value.page = page
  fetchJobs()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewJobDetails = (jobId: number) => {
  router.push(`/jobs/${jobId}`)
}

const applyToJob = (jobId: number) => {
  // 允許所有用戶類型都可以申請工作（點擊時會檢查是否登入）
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  // 彈出申請 modal
  selectedJobId.value = jobId
  showApplicationModal.value = true
  // 載入該職缺的詳細資訊
  fetchJobForApplication(jobId)
}

// Application functions
const fetchJobForApplication = async (jobId: number) => {
  try {
    const job = await jobService.getJobById(jobId)
    selectedJob.value = job
  } catch (err) {
    console.error('Failed to fetch job details:', err)
  }
}

const handleResumeSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedResumeFile.value = target.files[0]!
    uploadResume()
  }
}

const uploadResume = async () => {
  if (!selectedResumeFile.value) return

  uploadingResume.value = true

  try {
    const formData = new FormData()
    formData.append('resume', selectedResumeFile.value)

    const response = await fetch('/api/v1/job-applications/upload-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('access_token') || localStorage.getItem('auth_token')}`
      },
      body: formData
    }).then(res => res.json())
    
    if (!response || response.success === false) {
      throw new Error(response?.message || '上傳失敗')
    }

    if (response.success && response.data) {
      applicationForm.value.resumeUrl = response.data.url
    }
  } catch (err: any) {
    applicationError.value = err.message || '上傳履歷失敗，請稍後再試'
    selectedResumeFile.value = null
  } finally {
    uploadingResume.value = false
  }
}

const submitApplication = async () => {
  if (!selectedJobId.value) return

  submitting.value = true
  applicationError.value = null

  try {
    // 直接使用 API 調用
    const response = await fetch(`/api/v1/jobs/${selectedJobId.value}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('access_token') || localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(applicationForm.value)
    }).then(res => res.json())

    if (response.success) {
      showSuccessModal.value = true
      showApplicationModal.value = false
      applicationForm.value = {
        coverLetter: '',
        resumeUrl: ''
      }
      selectedResumeFile.value = null
      if (resumeInput.value) {
        resumeInput.value.value = ''
      }
      // 重新載入職缺列表以更新申請狀態
      fetchJobs()
    } else {
      throw new Error(response.message || '提交申請失敗')
    }
  } catch (err: any) {
    applicationError.value = err.message || '提交申請失敗，請稍後再試'
  } finally {
    submitting.value = false
  }
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
}

// 移除收藏功能 - 網站目前不支援此功能
// const favoriteIds = ref<Set<number>>(new Set())
// const loadFavorites = async () => { ... }
// const isFavorited = (jobId: number) => favoriteIds.value.has(jobId)
// const toggleFavorite = async (jobId: number) => { ... }

onMounted(() => {
  fetchJobs()
  // 不再載入收藏列表
  // loadFavorites()
})
</script>

<style scoped>
.jobs-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.py-6 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.pagination-link,
.pagination-previous,
.pagination-next {
  cursor: pointer;
}

.pagination-link:disabled,
.pagination-previous:disabled,
.pagination-next:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
