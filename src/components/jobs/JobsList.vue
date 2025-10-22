<template>
  <div class="jobs-list">
    <!-- 篩選和搜索 -->
    <div class="box">
      <div class="columns">
        <div class="column is-4">
          <div class="field">
            <label class="label">搜索職缺</label>
            <div class="control has-icons-left">
              <input
                :value="searchQuery"
                class="input"
                type="text"
                placeholder="搜索職缺標題或描述..."
                @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              />
              <span class="icon is-small is-left">
                <i class="fas fa-search"></i>
              </span>
            </div>
          </div>
        </div>
        <div class="column is-3">
          <div class="field">
            <label class="label">狀態篩選</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select
                  :value="statusFilter"
                  @change="$emit('update:statusFilter', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">全部狀態</option>
                  <option value="active">活躍</option>
                  <option value="paused">暫停</option>
                  <option value="closed">已關閉</option>
                  <option value="expired">已過期</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="column is-3">
          <div class="field">
            <label class="label">排序方式</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select
                  :value="sortBy"
                  @change="$emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="created_at">發布時間</option>
                  <option value="title">標題</option>
                  <option value="applications">申請數量</option>
                  <option value="expires_at">過期時間</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="column is-2">
          <div class="field">
            <label class="label">&nbsp;</label>
            <div class="control">
              <button class="button is-light is-fullwidth" @click="$emit('reset-filters')">
                <span class="icon">
                  <i class="fas fa-undo"></i>
                </span>
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 職缺列表 -->
    <div class="jobs-grid">
      <div
        v-for="job in jobs"
        :key="job.id"
        class="job-card"
        :class="{ 'is-expired': isJobExpired(job) }"
      >
        <div class="card">
          <div class="card-header">
            <div class="card-header-title">
              <div class="job-title">
                <h3 class="title is-5">{{ job.title }}</h3>
                <span class="tag" :class="getStatusClass(job.status)">
                  {{ getStatusText(job.status) }}
                </span>
              </div>
            </div>
            <div class="card-header-icon">
              <div class="dropdown is-right" :class="{ 'is-active': activeDropdown === job.id }">
                <div class="dropdown-trigger">
                  <button
                    class="button is-ghost"
                    @click="toggleDropdown(job.id)"
                    aria-haspopup="true"
                    aria-controls="dropdown-menu"
                  >
                    <span class="icon">
                      <i class="fas fa-ellipsis-v"></i>
                    </span>
                  </button>
                </div>
                <div class="dropdown-menu" role="menu">
                  <div class="dropdown-content">
                    <a class="dropdown-item" @click="$emit('edit-job', job)">
                      <span class="icon">
                        <i class="fas fa-edit"></i>
                      </span>
                      <span>編輯</span>
                    </a>
                    <a class="dropdown-item" @click="$emit('view-applications', job)">
                      <span class="icon">
                        <i class="fas fa-users"></i>
                      </span>
                      <span>查看申請者</span>
                    </a>
                    <a class="dropdown-item" @click="$emit('duplicate-job', job)">
                      <span class="icon">
                        <i class="fas fa-copy"></i>
                      </span>
                      <span>複製職缺</span>
                    </a>
                    <hr class="dropdown-divider" />
                    <a class="dropdown-item has-text-danger" @click="$emit('delete-job', job)">
                      <span class="icon">
                        <i class="fas fa-trash"></i>
                      </span>
                      <span>刪除</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-content">
            <div class="content">
              <p class="job-description">{{ truncateText(job.description, 150) }}</p>

              <div class="job-details">
                <div class="detail-item">
                  <span class="icon">
                    <i class="fas fa-map-marker-alt"></i>
                  </span>
                  <span>{{ job.location }}</span>
                </div>
                <div class="detail-item">
                  <span class="icon">
                    <i class="fas fa-dollar-sign"></i>
                  </span>
                  <span>{{ formatSalary(job.salary) }}</span>
                </div>
                <div class="detail-item">
                  <span class="icon">
                    <i class="fas fa-clock"></i>
                  </span>
                  <span>{{ job.employmentType }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="card-footer-item">
              <div class="applications-info">
                <span class="icon">
                  <i class="fas fa-users"></i>
                </span>
                <span>{{ job.applicationCount }} 個申請</span>
              </div>
            </div>
            <div class="card-footer-item">
              <div class="date-info">
                <span class="icon">
                  <i class="fas fa-calendar"></i>
                </span>
                <span>{{ formatDate(job.createdAt) }}</span>
              </div>
            </div>
            <div class="card-footer-item">
              <div class="expiry-info" :class="{ 'is-expired': isJobExpired(job) }">
                <span class="icon">
                  <i class="fas fa-hourglass-end"></i>
                </span>
                <span>{{ formatExpiryDate(job.expiresAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分頁 -->
    <div v-if="totalPages > 1" class="pagination-container">
      <nav class="pagination is-centered" role="navigation" aria-label="pagination">
        <button
          class="pagination-previous"
          :disabled="currentPage === 1"
          @click="$emit('change-page', currentPage - 1)"
        >
          上一頁
        </button>
        <button
          class="pagination-next"
          :disabled="currentPage === totalPages"
          @click="$emit('change-page', currentPage + 1)"
        >
          下一頁
        </button>

        <ul class="pagination-list">
          <li v-for="page in visiblePages" :key="page">
            <button
              class="pagination-link"
              :class="{ 'is-current': page === currentPage }"
              @click="$emit('change-page', page)"
            >
              {{ page }}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Job {
  id: number
  title: string
  description: string
  location: string
  salary: number | null
  employmentType: string
  status: string
  applicationCount: number
  createdAt: string
  expiresAt: string | null
}

interface Props {
  jobs: Job[]
  searchQuery: string
  statusFilter: string
  sortBy: string
  currentPage: number
  totalPages: number
  loading?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'update:searchQuery': [value: string]
  'update:statusFilter': [value: string]
  'update:sortBy': [value: string]
  'reset-filters': []
  'edit-job': [job: Job]
  'view-applications': [job: Job]
  'duplicate-job': [job: Job]
  'delete-job': [job: Job]
  'change-page': [page: number]
}>()

const activeDropdown = ref<number | null>(null)

const toggleDropdown = (jobId: number) => {
  activeDropdown.value = activeDropdown.value === jobId ? null : jobId
}

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, props.currentPage + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const getStatusClass = (status: string) => {
  const statusClasses = {
    active: 'is-success',
    paused: 'is-warning',
    closed: 'is-danger',
    expired: 'is-dark'
  }
  return statusClasses[status as keyof typeof statusClasses] || 'is-light'
}

const getStatusText = (status: string) => {
  const statusTexts = {
    active: '活躍',
    paused: '暫停',
    closed: '已關閉',
    expired: '已過期'
  }
  return statusTexts[status as keyof typeof statusTexts] || status
}

const isJobExpired = (job: Job) => {
  if (!job.expiresAt) return false
  return new Date(job.expiresAt) < new Date()
}

const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

const formatSalary = (salary: number | null) => {
  if (!salary) return '面議'
  return `NT$ ${salary.toLocaleString()}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

const formatExpiryDate = (dateString: string | null) => {
  if (!dateString) return '無期限'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '已過期'
  if (diffDays === 0) return '今天過期'
  if (diffDays === 1) return '明天過期'
  return `${diffDays} 天後過期`
}
</script>

<style scoped>
.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.job-card {
  transition: transform 0.2s ease;
}

.job-card:hover {
  transform: translateY(-2px);
}

.job-card.is-expired {
  opacity: 0.7;
}

.card-header-title {
  flex: 1;
}

.job-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.job-title .title {
  margin-bottom: 0;
  flex: 1;
}

.job-description {
  margin-bottom: 1rem;
  color: #666;
  line-height: 1.5;
}

.job-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.card-footer {
  background-color: #f8f9fa;
}

.card-footer-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.applications-info,
.date-info,
.expiry-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.expiry-info.is-expired {
  color: #ff3860;
  font-weight: 600;
}

.pagination-container {
  margin-top: 2rem;
}

.dropdown-menu {
  min-width: 150px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-item.has-text-danger {
  color: #ff3860 !important;
}

.dropdown-item.has-text-danger:hover {
  background-color: #ff3860;
  color: white !important;
}
</style>
