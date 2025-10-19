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
        <div v-else>
          <div v-for="job in jobs" :key="job.id" class="box">
            <div class="columns is-vcentered">
              <div class="column">
                <h3 class="title is-5">{{ job.title }}</h3>
                <div class="tags">
                  <span class="tag" :class="job.isActive ? 'is-success' : 'is-danger'">
                    {{ job.isActive ? '啟用中' : '已關閉' }}
                  </span>
                  <span v-if="job.jobType" class="tag is-info">
                    {{ getJobTypeLabel(job.jobType) }}
                  </span>
                  <span v-if="job.location" class="tag is-light">
                    <span class="icon is-small">
                      <i class="fas fa-map-marker-alt"></i>
                    </span>
                    <span>{{ job.location }}</span>
                  </span>
                </div>
                <p class="has-text-grey">
                  <span class="icon-text">
                    <span class="icon">
                      <i class="fas fa-users"></i>
                    </span>
                    <span>{{ job.applicationCount }} 個申請</span>
                  </span>
                  <span class="ml-4">
                    發布於 {{ formatDate(job.createdAt) }}
                  </span>
                </p>
              </div>
              <div class="column is-narrow">
                <div class="buttons">
                  <button class="button is-info" @click="viewApplications(job.id)">
                    <span class="icon">
                      <i class="fas fa-users"></i>
                    </span>
                    <span>查看申請</span>
                  </button>
                  <button class="button is-light" @click="editJob(job)">
                    <span class="icon">
                      <i class="fas fa-edit"></i>
                    </span>
                    <span>編輯</span>
                  </button>
                  <button
                    class="button"
                    :class="job.isActive ? 'is-warning' : 'is-success'"
                    @click="toggleJobStatus(job)"
                  >
                    <span class="icon">
                      <i :class="job.isActive ? 'fas fa-pause' : 'fas fa-play'"></i>
                    </span>
                    <span>{{ job.isActive ? '關閉' : '啟用' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Create/Edit Job Modal -->
    <div class="modal" :class="{ 'is-active': showCreateModal || showEditModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">{{ showEditModal ? '編輯職缺' : '發布新職缺' }}</p>
          <button class="delete" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <form @submit.prevent="submitJob">
            <div class="field">
              <label class="label">職缺標題 *</label>
              <div class="control">
                <input
                  v-model="jobForm.title"
                  class="input"
                  type="text"
                  placeholder="例如：藥局助理"
                  required
                />
              </div>
            </div>

            <div class="field">
              <label class="label">職缺描述</label>
              <div class="control">
                <textarea
                  v-model="jobForm.description"
                  class="textarea"
                  placeholder="詳細描述職缺內容..."
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div class="columns">
              <div class="column">
                <div class="field">
                  <label class="label">工作類型</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="jobForm.jobType">
                        <option value="">請選擇</option>
                        <option value="full_time">全職</option>
                        <option value="part_time">兼職</option>
                        <option value="internship">實習</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="field">
                  <label class="label">地區</label>
                  <div class="control">
                    <input
                      v-model="jobForm.location"
                      class="input"
                      type="text"
                      placeholder="例如：台北市"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="columns">
              <div class="column">
                <div class="field">
                  <label class="label">最低薪資 (NT$)</label>
                  <div class="control">
                    <input
                      v-model.number="jobForm.salaryMin"
                      class="input"
                      type="number"
                      placeholder="30000"
                    />
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="field">
                  <label class="label">最高薪資 (NT$)</label>
                  <div class="control">
                    <input
                      v-model.number="jobForm.salaryMax"
                      class="input"
                      type="number"
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">職缺要求</label>
              <div class="control">
                <textarea
                  v-model="jobForm.requirements"
                  class="textarea"
                  placeholder="列出職缺的要求和條件..."
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div class="field">
              <label class="label">截止日期</label>
              <div class="control">
                <input v-model="jobForm.expiresAt" class="input" type="date" />
              </div>
            </div>

            <div v-if="formError" class="notification is-danger is-light">
              {{ formError }}
            </div>
          </form>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-primary"
            @click="submitJob"
            :class="{ 'is-loading': submitting }"
            :disabled="submitting"
          >
            {{ showEditModal ? '更新職缺' : '發布職缺' }}
          </button>
          <button class="button" @click="closeModal">取消</button>
        </footer>
      </div>
    </div>

    <!-- Applications Modal -->
    <div class="modal" :class="{ 'is-active': showApplicationsModal }">
      <div class="modal-background" @click="closeApplicationsModal"></div>
      <div class="modal-card" style="width: 90%; max-width: 1200px">
        <header class="modal-card-head">
          <p class="modal-card-title">申請者列表</p>
          <button class="delete" @click="closeApplicationsModal"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="loadingApplications" class="has-text-centered py-4">
            <button class="button is-loading is-white"></button>
          </div>

          <div v-else-if="applications.length === 0" class="has-text-centered py-4">
            <p class="has-text-grey">目前沒有申請者</p>
          </div>

          <div v-else>
            <div v-for="app in applications" :key="app.id" class="box">
              <div class="columns">
                <div class="column">
                  <h4 class="title is-6">{{ app.applicantName }}</h4>
                  <p class="has-text-grey">
                    <span class="icon-text">
                      <span class="icon">
                        <i class="fas fa-envelope"></i>
                      </span>
                      <span>{{ app.applicantEmail }}</span>
                    </span>
                  </p>
                  <p v-if="app.applicantPhone" class="has-text-grey">
                    <span class="icon-text">
                      <span class="icon">
                        <i class="fas fa-phone"></i>
                      </span>
                      <span>{{ app.applicantPhone }}</span>
                    </span>
                  </p>
                  <p class="mt-2">
                    <span class="tag" :class="getStatusClass(app.status)">
                      {{ getStatusLabel(app.status) }}
                    </span>
                  </p>
                  <p class="has-text-grey mt-2">
                    <small>申請於 {{ formatDate(app.applicationDate) }}</small>
                  </p>
                </div>
                <div class="column">
                  <p class="has-text-weight-semibold">求職信：</p>
                  <p class="content">{{ app.coverLetter || '未提供' }}</p>
                  <p v-if="app.resumeUrl" class="mt-2">
                    <a :href="app.resumeUrl" target="_blank" class="button is-small is-link">
                      <span class="icon">
                        <i class="fas fa-file-pdf"></i>
                      </span>
                      <span>查看履歷</span>
                    </a>
                  </p>
                </div>
                <div class="column is-narrow">
                  <div class="buttons is-flex-direction-column">
                    <button
                      class="button is-success is-small"
                      @click="updateApplicationStatus(app.id, 'accepted')"
                      :disabled="app.status === 'accepted'"
                    >
                      錄取
                    </button>
                    <button
                      class="button is-danger is-small"
                      @click="updateApplicationStatus(app.id, 'rejected')"
                      :disabled="app.status === 'rejected'"
                    >
                      拒絕
                    </button>
                    <button
                      class="button is-info is-small"
                      @click="updateApplicationStatus(app.id, 'reviewed')"
                      :disabled="app.status === 'reviewed'"
                    >
                      已審核
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button" @click="closeApplicationsModal">關閉</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

interface Job {
  id: number
  title: string
  description?: string | null
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  jobType?: 'full_time' | 'part_time' | 'internship' | null
  requirements?: string | null
  isActive: boolean
  createdAt: string
  expiresAt?: string | null
  applicationCount: number
}

interface Application {
  id: number
  jobId: number
  applicantId: number
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  applicationDate: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  coverLetter?: string | null
  resumeUrl?: string | null
}

const router = useRouter()

const jobs = ref<Job[]>([])
const applications = ref<Application[]>([])
const loading = ref(false)
const loadingApplications = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const submitting = ref(false)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showApplicationsModal = ref(false)
const currentJobId = ref<number | null>(null)

const jobForm = ref({
  title: '',
  description: '',
  location: '',
  salaryMin: null as number | null,
  salaryMax: null as number | null,
  jobType: '',
  requirements: '',
  expiresAt: ''
})

const fetchJobs = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/api/v1/employer/jobs')

    if (response.data.success) {
      jobs.value = response.data.data
    }
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '載入職缺失敗'
    console.error('Failed to fetch jobs:', err)
  } finally {
    loading.value = false
  }
}

const submitJob = async () => {
  formError.value = null
  submitting.value = true

  try {
    const payload = {
      ...jobForm.value,
      salaryMin: jobForm.value.salaryMin || null,
      salaryMax: jobForm.value.salaryMax || null,
      jobType: jobForm.value.jobType || null,
      expiresAt: jobForm.value.expiresAt || null
    }

    if (showEditModal.value && currentJobId.value) {
      await api.put(`/api/v1/jobs/${currentJobId.value}`, payload)
    } else {
      await api.post('/api/v1/jobs', payload)
    }

    closeModal()
    fetchJobs()
  } catch (err: any) {
    formError.value = err.response?.data?.error?.message || '操作失敗'
    console.error('Failed to submit job:', err)
  } finally {
    submitting.value = false
  }
}

const editJob = (job: Job) => {
  currentJobId.value = job.id
  jobForm.value = {
    title: job.title,
    description: job.description || '',
    location: job.location || '',
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    jobType: job.jobType || '',
    requirements: job.requirements || '',
    expiresAt: job.expiresAt ? job.expiresAt.split('T')[0] : ''
  }
  showEditModal.value = true
}

const toggleJobStatus = async (job: Job) => {
  try {
    await api.put(`/api/v1/jobs/${job.id}`, {
      isActive: !job.isActive
    })
    fetchJobs()
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '更新職缺狀態失敗'
    console.error('Failed to toggle job status:', err)
  }
}

const viewApplications = async (jobId: number) => {
  currentJobId.value = jobId
  showApplicationsModal.value = true
  loadingApplications.value = true

  try {
    const response = await api.get(`/api/v1/jobs/${jobId}/applications`)

    if (response.data.success) {
      applications.value = response.data.data
    }
  } catch (err: any) {
    console.error('Failed to fetch applications:', err)
  } finally {
    loadingApplications.value = false
  }
}

const updateApplicationStatus = async (applicationId: number, status: string) => {
  try {
    await api.patch(`/api/v1/applications/${applicationId}/status`, { status })

    // Update local state
    const app = applications.value.find((a) => a.id === applicationId)
    if (app) {
      app.status = status as any
    }
  } catch (err: any) {
    alert(err.response?.data?.error?.message || '更新申請狀態失敗')
    console.error('Failed to update application status:', err)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  currentJobId.value = null
  formError.value = null
  jobForm.value = {
    title: '',
    description: '',
    location: '',
    salaryMin: null,
    salaryMax: null,
    jobType: '',
    requirements: '',
    expiresAt: ''
  }
}

const closeApplicationsModal = () => {
  showApplicationsModal.value = false
  applications.value = []
}

const getJobTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    full_time: '全職',
    part_time: '兼職',
    internship: '實習'
  }
  return labels[type] || type
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待審核',
    reviewed: '已審核',
    accepted: '已錄取',
    rejected: '已拒絕'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'is-warning',
    reviewed: 'is-info',
    accepted: 'is-success',
    rejected: 'is-danger'
  }
  return classes[status] || ''
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchJobs()
})
</script>

<style scoped>
.employer-jobs-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.py-6 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.icon-text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.buttons.is-flex-direction-column {
  flex-direction: column;
}

.buttons.is-flex-direction-column .button {
  width: 100%;
}
</style>
