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
                      <i class="fas fa-search"></i>
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
                  <i class="fas fa-times"></i>
                </span>
                <span>清除篩選</span>
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
                :show-apply="isJobSeeker"
                @view-details="viewJobDetails"
                @apply="applyToJob"
                @toggle-favorite="toggleFavorite"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import JobCard from '@/components/common/JobCard.vue'
import jobService from '@/services/job-service'
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
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  router.push(`/jobs/${jobId}`)
}

const toggleFavorite = (jobId: number) => {
  // TODO: Implement favorite functionality
  console.log('Toggle favorite for job:', jobId)
}

onMounted(() => {
  fetchJobs()
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
