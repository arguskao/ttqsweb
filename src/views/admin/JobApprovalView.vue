<template>
  <div class="container mt-5">
    <div class="level">
      <div class="level-left">
        <div class="level-item">
          <div>
            <h1 class="title">工作審核管理</h1>
            <p class="subtitle">審核雇主發布的工作需求</p>
          </div>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <div class="field has-addons">
            <div class="control">
              <div class="select">
                <select v-model="statusFilter" @change="loadJobs">
                  <option value="pending">待審核</option>
                  <option value="approved">已通過</option>
                  <option value="rejected">已拒絕</option>
                  <option value="">全部</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="has-text-centered py-6">
      <button class="button is-loading is-large is-white"></button>
      <p class="mt-4">載入工作中...</p>
    </div>

    <!-- Jobs List -->
    <div v-else>
      <div class="box" v-for="job in jobs" :key="job.id">
        <article class="media">
          <div class="media-content">
            <div class="content">
              <div class="level">
                <div class="level-left">
                  <div class="level-item">
                    <div>
                      <p class="title is-4">{{ job.title }}</p>
                      <p class="subtitle is-6">
                        <span class="tag" :class="getStatusClass(job.approval_status)">
                          {{ getStatusLabel(job.approval_status) }}
                        </span>
                        <span class="ml-2">{{ job.company_name }}</span>
                        <span class="ml-2">{{ job.location }}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div class="level-right">
                  <div class="level-item">
                    <div class="buttons" v-if="job.approval_status === 'pending'">
                      <button class="button is-success" @click="approveJob(job.id)">
                        <span class="icon"><i class="fas fa-check"></i></span>
                        <span>通過</span>
                      </button>
                      <button class="button is-danger" @click="showRejectModal(job)">
                        <span class="icon"><i class="fas fa-times"></i></span>
                        <span>拒絕</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p>{{ job.description }}</p>
              <p class="is-size-7 has-text-grey">
                發布時間: {{ formatDate(job.created_at) }}
                <span v-if="job.reviewed_at">
                  | 審核時間: {{ formatDate(job.reviewed_at) }}
                </span>
              </p>
              <div v-if="job.review_notes" class="notification is-light mt-3">
                <strong>審核備註：</strong>{{ job.review_notes }}
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div class="box has-text-centered" v-if="jobs.length === 0">
        <p class="title is-5">尚無{{ getStatusLabel(statusFilter || 'pending') }}的工作</p>
        <p class="subtitle is-6">所有工作都已完成審核</p>
      </div>

      <!-- Pagination -->
      <nav class="pagination is-centered" v-if="totalPages > 1">
        <button class="pagination-previous" @click="prevPage" :disabled="currentPage === 1">
          上一頁
        </button>
        <button
          class="pagination-next"
          @click="nextPage"
          :disabled="currentPage === totalPages"
        >
          下一頁
        </button>
        <ul class="pagination-list">
          <li v-for="page in totalPages" :key="page">
            <a
              class="pagination-link"
              :class="{ 'is-current': page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Reject Modal -->
    <div class="modal" :class="{ 'is-active': showRejectModalState }">
      <div class="modal-background" @click="closeRejectModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">拒絕工作申請</p>
          <button class="delete" @click="closeRejectModal"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">拒絕原因（選填）</label>
            <div class="control">
              <textarea
                class="textarea"
                v-model="rejectNotes"
                placeholder="請說明拒絕原因..."
              ></textarea>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-danger" @click="confirmReject">確認拒絕</button>
          <button class="button" @click="closeRejectModal">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import api from '@/services/api'

const jobs = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const statusFilter = ref('pending')
const showRejectModalState = ref(false)
const rejectNotes = ref('')
const rejectingJobId = ref<number | null>(null)

const loadJobs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: 10
    }
    if (statusFilter.value) {
      params.approvalStatus = statusFilter.value
    }

    const response = await api.get('/jobs/pending-approval', { params })
    if (response.data.success) {
      jobs.value = response.data.data
      totalPages.value = response.data.meta?.totalPages || 1
    }
  } catch (error) {
    console.error('載入工作失敗:', error)
  } finally {
    loading.value = false
  }
}

const approveJob = async (jobId: number) => {
  try {
    const response = await api.put(`/jobs/${jobId}/approve`, {
      status: 'approved'
    })
    if (response.data.success) {
      alert('工作已審核通過')
      loadJobs()
    }
  } catch (error) {
    console.error('審核失敗:', error)
    alert('審核失敗，請稍後再試')
  }
}

const showRejectModal = (job: any) => {
  rejectingJobId.value = job.id
  rejectNotes.value = ''
  showRejectModalState.value = true
}

const closeRejectModal = () => {
  showRejectModalState.value = false
  rejectingJobId.value = null
  rejectNotes.value = ''
}

const confirmReject = async () => {
  if (!rejectingJobId.value) return

  try {
    const response = await api.put(`/jobs/${rejectingJobId.value}/approve`, {
      status: 'rejected',
      review_notes: rejectNotes.value
    })
    if (response.data.success) {
      alert('工作已拒絕')
      closeRejectModal()
      loadJobs()
    }
  } catch (error) {
    console.error('拒絕失敗:', error)
    alert('拒絕失敗，請稍後再試')
  }
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'is-warning',
    approved: 'is-success',
    rejected: 'is-danger'
  }
  return classes[status] || 'is-light'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待審核',
    approved: '已通過',
    rejected: '已拒絕'
  }
  return labels[status] || status
}

const formatDate = (date: string): string => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('zh-TW')
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadJobs()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadJobs()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadJobs()
}

onMounted(() => {
  loadJobs()
})
</script>

