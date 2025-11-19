<template>
  <div class="job-detail-view">
    <!-- Loading State -->
    <div v-if="loading" class="section">
      <div class="container has-text-centered">
        <button class="button is-loading is-large is-white"></button>
        <p class="mt-4">載入職缺資訊中...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="section">
      <div class="container">
        <div class="notification is-danger">
          {{ error }}
        </div>
        <button class="button" @click="router.back()">返回</button>
      </div>
    </div>

    <!-- Job Details -->
    <div v-else-if="job" class="section">
      <div class="container">
        <div class="columns">
          <!-- Main Content -->
          <div class="column is-8">
            <div class="box">
              <div class="level">
                <div class="level-left">
                  <div class="level-item">
                    <button class="button is-light" @click="router.back()">
                      <span class="icon">
                        <span>←</span>
                      </span>
                      <span>返回</span>
                    </button>
                  </div>
                </div>
              </div>

              <h1 class="title is-3">{{ job.title }}</h1>
              <h2 class="subtitle is-5">{{ job.employerName || job.employer_name || '未提供雇主名稱' }}</h2>

              <div class="tags mb-4">
                <span v-if="job.jobType || job.job_type" class="tag is-info is-medium">
                  {{ jobTypeLabel }}
                </span>
                <span v-if="job.location" class="tag is-light is-medium">
                  <span class="icon">
                    <span>📍</span>
                  </span>
                  <span>{{ job.location }}</span>
                </span>
                <span v-if="salaryRange" class="tag is-success is-light is-medium">
                  <span class="icon">
                    <span>💰</span>
                  </span>
                  <span>{{ salaryRange }}</span>
                </span>
              </div>

              <div class="content">
                <h3 class="title is-5">職缺描述</h3>
                <p class="job-description">{{ job.description || '無職缺描述' }}</p>

                <h3 class="title is-5 mt-5">職缺要求</h3>
                <div class="job-requirements">
                  <p v-if="job.requirements">{{ job.requirements }}</p>
                  <p v-else class="has-text-grey">無特殊要求</p>
                </div>
              </div>

              <hr />

              <div class="job-meta">
                <p class="has-text-grey">
                  <span class="icon-text">
                    <span class="icon">
                      <span>📅</span>
                    </span>
                    <span>發布於 {{ formattedDate }}</span>
                  </span>
                </p>
                <p v-if="job.expiresAt || job.expires_at" class="has-text-grey mt-2">
                  <span class="icon-text">
                    <span class="icon">
                      <span>⏰</span>
                    </span>
                    <span>截止於 {{ formattedExpiryDate }}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="column is-4">
            <!-- Quick Apply Card -->
            <div class="box">
              <h3 class="title is-5">快速申請</h3>

              <div v-if="job.hasApplied" class="notification is-info is-light">
                <p class="has-text-centered">
                  <span class="icon">
                    <span>✅</span>
                  </span>
                  您已申請此職缺
                </p>
              </div>

              <div v-else-if="!authStore.isAuthenticated" class="notification is-warning is-light">
                <p>請先登入才能申請職缺</p>
                <button class="button is-primary is-fullwidth mt-3" @click="router.push('/login')">
                  前往登入
                </button>
              </div>

              <div v-else>
                <button class="button is-primary is-fullwidth is-large" @click="showApplicationModal = true">
                  <span>✈️ 立即申請</span>
                </button>
              </div>
            </div>

            <!-- Employer Info Card -->
            <div class="box">
              <h3 class="title is-5">雇主資訊</h3>
              <div class="content">
                <p>
                  <strong>公司名稱：</strong><br />
                  {{ job.employerName || job.employer_name || '未提供' }}
                </p>
                <p v-if="job.employerEmail || job.employer_email">
                  <strong>聯絡信箱：</strong><br />
                  <a :href="`mailto:${job.employerEmail || job.employer_email}`">{{ job.employerEmail || job.employer_email }}</a>
                </p>
              </div>
            </div>

            <!-- Share Card -->
            <div class="box">
              <h3 class="title is-5">分享職缺</h3>
              <div class="buttons">
                <button class="button is-light is-fullwidth" @click="shareJob">
                  <span class="icon">
                    <span>🔗</span>
                  </span>
                  <span>分享</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Application Modal -->
    <div class="modal" :class="{ 'is-active': showApplicationModal }">
      <div class="modal-background" @click="showApplicationModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">申請職缺：{{ job?.title }}</p>
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
import { useRouter, useRoute } from 'vue-router'

import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface Job {
  id: number
  employer_id?: number
  employerId?: number
  title: string
  description?: string | null
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salary?: string | null // 單一字串欄位（如 "30000-35000"）
  jobType?: 'full_time' | 'part_time' | 'internship' | null
  job_type?: string // 資料庫欄位名稱
  requirements?: string | null
  employerName?: string
  employer_name?: string // 資料庫欄位名稱
  employerEmail?: string
  employer_email?: string // 資料庫欄位名稱
  createdAt?: string
  created_at?: string // 資料庫欄位名稱
  expiresAt?: string | null
  expires_at?: string | null // 資料庫欄位名稱
  hasApplied?: boolean
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const job = ref<Job | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const submitting = ref(false)
const applicationError = ref<string | null>(null)
const showApplicationModal = ref(false)
const showSuccessModal = ref(false)

const resumeInput = ref<HTMLInputElement | null>(null)
const selectedResumeFile = ref<File | null>(null)
const uploadingResume = ref(false)

const applicationForm = ref({
  coverLetter: '',
  resumeUrl: ''
})

// 移除用戶類型限制，允許所有登入用戶申請工作

const jobTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    full_time: '全職',
    part_time: '兼職',
    internship: '實習'
  }
  const jobType = job.value?.jobType || job.value?.job_type
  return jobType ? labels[jobType] : ''
})

const salaryRange = computed(() => {
  if (!job.value) return null
  
  // 優先使用組合的 salary 字串
  if (job.value.salary) {
    return `NT$ ${job.value.salary}`
  }
  
  // 否則使用 salaryMin/salaryMax
  const { salaryMin, salaryMax } = job.value
  if (!salaryMin && !salaryMax) return null
  if (salaryMin && salaryMax) {
    return `NT$ ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}`
  }
  if (salaryMin) return `NT$ ${salaryMin.toLocaleString()}+`
  if (salaryMax) return `最高 NT$ ${salaryMax.toLocaleString()}`
  return null
})

const formattedDate = computed(() => {
  try {
    const createdAt = job.value?.createdAt || job.value?.created_at
    if (!createdAt) return '未知日期'
    const date = new Date(createdAt)
    if (isNaN(date.getTime())) return '無效日期'
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('日期格式化錯誤:', error)
    return '日期錯誤'
  }
})

const formattedExpiryDate = computed(() => {
  try {
    const expiresAt = job.value?.expiresAt || job.value?.expires_at
    if (!expiresAt) return ''
    const date = new Date(expiresAt)
    if (isNaN(date.getTime())) return '無效日期'
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('截止日期格式化錯誤:', error)
    return '日期錯誤'
  }
})

const fetchJobDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const jobId = route.params.id
    const response = await api.get(`/jobs/${jobId}`)

    if (response.data.success) {
      job.value = response.data.data
    }
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '載入職缺資訊失敗'
    console.error('Failed to fetch job details:', err)
  } finally {
    loading.value = false
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

    // 直接調用 Cloudflare Pages Function
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
      console.log('履歷上傳成功:', response.data.url)
    }
  } catch (err: any) {
    applicationError.value = err.message || err.response?.data?.error?.message || '上傳履歷失敗，請稍後再試'
    console.error('Failed to upload resume:', err)
    selectedResumeFile.value = null
  } finally {
    uploadingResume.value = false
  }
}

const submitApplication = async () => {
  if (!job.value) return

  submitting.value = true
  applicationError.value = null

  try {
    const response = await api.post(`/jobs/${job.value.id}/apply`, applicationForm.value)

    if (response.data.success) {
      showSuccessModal.value = true
      job.value.hasApplied = true
      applicationForm.value = {
        coverLetter: '',
        resumeUrl: ''
      }
      selectedResumeFile.value = null
      if (resumeInput.value) {
        resumeInput.value.value = ''
      }
    }
  } catch (err: any) {
    applicationError.value = err.response?.data?.error?.message || '提交申請失敗，請稍後再試'
    console.error('Failed to submit application:', err)
  } finally {
    submitting.value = false
  }
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  showApplicationModal.value = false
}

const shareJob = () => {
  if (navigator.share && job.value) {
    navigator
      .share({
        title: job.value.title,
        text: `查看這個職缺：${job.value.title}`,
        url: window.location.href
      })
      .catch((err) => console.log('Share failed:', err))
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
    alert('職缺連結已複製到剪貼簿')
  }
}

onMounted(() => {
  fetchJobDetails()
})
</script>

<style scoped>
.job-detail-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.job-description {
  white-space: pre-wrap;
  line-height: 1.8;
}

.job-requirements {
  white-space: pre-wrap;
  line-height: 1.8;
}

.job-meta {
  margin-top: 1.5rem;
}

.icon-text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
