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
                        <i class="fas fa-arrow-left"></i>
                      </span>
                      <span>返回</span>
                    </button>
                  </div>
                </div>
              </div>

              <h1 class="title is-3">{{ job.title }}</h1>
              <h2 class="subtitle is-5">{{ job.employerName || '未提供雇主名稱' }}</h2>

              <div class="tags mb-4">
                <span v-if="job.jobType" class="tag is-info is-medium">
                  {{ jobTypeLabel }}
                </span>
                <span v-if="job.location" class="tag is-light is-medium">
                  <span class="icon">
                    <i class="fas fa-map-marker-alt"></i>
                  </span>
                  <span>{{ job.location }}</span>
                </span>
                <span v-if="salaryRange" class="tag is-success is-light is-medium">
                  <span class="icon">
                    <i class="fas fa-dollar-sign"></i>
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
                      <i class="fas fa-calendar"></i>
                    </span>
                    <span>發布於 {{ formattedDate }}</span>
                  </span>
                </p>
                <p v-if="job.expiresAt" class="has-text-grey mt-2">
                  <span class="icon-text">
                    <span class="icon">
                      <i class="fas fa-clock"></i>
                    </span>
                    <span>截止於 {{ formattedExpiryDate }}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="column is-4">
            <!-- Application Card -->
            <div class="box" v-if="isJobSeeker">
              <h3 class="title is-5">申請此職缺</h3>

              <div v-if="job.hasApplied" class="notification is-info is-light">
                <p class="has-text-centered">
                  <span class="icon">
                    <i class="fas fa-check-circle"></i>
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
                    <label class="label">履歷連結</label>
                    <div class="control">
                      <input
                        v-model="applicationForm.resumeUrl"
                        class="input"
                        type="url"
                        placeholder="https://example.com/resume.pdf"
                      />
                    </div>
                    <p class="help">請提供您的線上履歷連結或 PDF 檔案連結</p>
                  </div>

                  <div v-if="applicationError" class="notification is-danger is-light">
                    {{ applicationError }}
                  </div>

                  <div class="field">
                    <div class="control">
                      <button
                        type="submit"
                        class="button is-primary is-fullwidth"
                        :class="{ 'is-loading': submitting }"
                        :disabled="submitting"
                      >
                        <span class="icon">
                          <i class="fas fa-paper-plane"></i>
                        </span>
                        <span>提交申請</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <!-- Employer Info Card -->
            <div class="box">
              <h3 class="title is-5">雇主資訊</h3>
              <div class="content">
                <p>
                  <strong>公司名稱：</strong><br />
                  {{ job.employerName || '未提供' }}
                </p>
                <p v-if="job.employerEmail">
                  <strong>聯絡信箱：</strong><br />
                  <a :href="`mailto:${job.employerEmail}`">{{ job.employerEmail }}</a>
                </p>
              </div>
            </div>

            <!-- Share Card -->
            <div class="box">
              <h3 class="title is-5">分享職缺</h3>
              <div class="buttons">
                <button class="button is-light is-fullwidth" @click="shareJob">
                  <span class="icon">
                    <i class="fas fa-share-alt"></i>
                  </span>
                  <span>分享</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
            <span class="icon is-large has-text-success">
              <i class="fas fa-check-circle fa-3x"></i>
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
  employerId: number
  title: string
  description?: string | null
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  jobType?: 'full_time' | 'part_time' | 'internship' | null
  requirements?: string | null
  employerName?: string
  employerEmail?: string
  createdAt: string
  expiresAt?: string | null
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
const showSuccessModal = ref(false)

const applicationForm = ref({
  coverLetter: '',
  resumeUrl: ''
})

const isJobSeeker = computed(() => {
  return authStore.user?.userType === 'job_seeker'
})

const jobTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    full_time: '全職',
    part_time: '兼職',
    internship: '實習'
  }
  return job.value?.jobType ? labels[job.value.jobType] : ''
})

const salaryRange = computed(() => {
  if (!job.value) return null
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
  if (!job.value) return ''
  return new Date(job.value.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedExpiryDate = computed(() => {
  if (!job.value?.expiresAt) return ''
  return new Date(job.value.expiresAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
