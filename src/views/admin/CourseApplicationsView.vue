<template>
  <div class="course-applications-view">
    <section class="section">
      <div class="container">
        <div class="has-text-centered mb-5">
          <h1 class="title is-2">課程申請管理</h1>
          <p class="subtitle">審核和管理課程申請</p>
        </div>

        <!-- Filters -->
        <div class="box mb-5">
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label class="label">狀態篩選</label>
            </div>
            <div class="field-body">
              <div class="field is-narrow">
                <div class="control">
                  <div class="select">
                    <select v-model="filters.status" @change="loadApplications">
                      <option value="">全部</option>
                      <option value="pending">待審核</option>
                      <option value="approved">已批准</option>
                      <option value="rejected">已拒絕</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="has-text-centered py-6">
          <div class="loader"></div>
          <p class="mt-3">載入中...</p>
        </div>

        <!-- Error Message -->
        <div v-else-if="errorMessage" class="notification is-danger">
          {{ errorMessage }}
        </div>

        <!-- Applications List -->
        <div v-else-if="applications.length > 0">
          <div v-for="application in applications" :key="application.id" class="box mb-4">
            <div class="columns">
              <div class="column">
                <h3 class="title is-4">{{ application.course_name }}</h3>
                <p class="subtitle is-6">
                  講師：{{ application.instructor_name || '未知' }} ({{ application.instructor_email }})
                </p>

                <div class="content">
                  <p><strong>課程類別：</strong>{{ application.category }}</p>
                  <p><strong>目標學員：</strong>{{ application.target_audience }}</p>
                  <p><strong>課程時長：</strong>{{ application.duration }} 小時</p>
                  <p><strong>課程價格：</strong>NT$ {{ application.price }}</p>
                  <p><strong>授課方式：</strong>{{ application.delivery_methods }}</p>
                  
                  <div class="mt-3">
                    <strong>課程描述：</strong>
                    <p class="mt-2">{{ application.description }}</p>
                  </div>

                  <div class="mt-3">
                    <strong>課程大綱：</strong>
                    <p class="mt-2" style="white-space: pre-wrap">{{ application.syllabus }}</p>
                  </div>

                  <div class="mt-3">
                    <strong>教學經驗：</strong>
                    <p class="mt-2" style="white-space: pre-wrap">{{ application.teaching_experience }}</p>
                  </div>

                  <div v-if="application.materials" class="mt-3">
                    <strong>教材說明：</strong>
                    <p class="mt-2">{{ application.materials }}</p>
                  </div>

                  <div v-if="application.special_requirements" class="mt-3">
                    <strong>特殊需求：</strong>
                    <p class="mt-2">{{ application.special_requirements }}</p>
                  </div>
                </div>

                <div class="tags mt-3">
                  <span
                    class="tag"
                    :class="{
                      'is-warning': application.status === 'pending',
                      'is-success': application.status === 'approved',
                      'is-danger': application.status === 'rejected'
                    }"
                  >
                    {{ statusText(application.status) }}
                  </span>
                  <span class="tag is-light">
                    提交時間：{{ formatDate(application.submitted_at) }}
                  </span>
                  <span v-if="application.reviewed_at" class="tag is-light">
                    審核時間：{{ formatDate(application.reviewed_at) }}
                  </span>
                </div>

                <div v-if="application.review_notes" class="notification is-info is-light mt-3">
                  <strong>審核備註：</strong>
                  <p>{{ application.review_notes }}</p>
                </div>
              </div>

              <div v-if="application.status === 'pending'" class="column is-narrow">
                <div class="buttons is-flex is-flex-direction-column">
                  <button
                    class="button is-success"
                    :class="{ 'is-loading': isReviewing }"
                    :disabled="isReviewing"
                    @click="reviewApplication(application.id, 'approved')"
                  >
                    <span class="icon">
                      <i class="fas fa-check"></i>
                    </span>
                    <span>批准</span>
                  </button>
                  <button
                    class="button is-danger"
                    :class="{ 'is-loading': isReviewing }"
                    :disabled="isReviewing"
                    @click="reviewApplication(application.id, 'rejected')"
                  >
                    <span class="icon">
                      <i class="fas fa-times"></i>
                    </span>
                    <span>拒絕</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <nav v-if="meta.totalPages > 1" class="pagination is-centered mt-5" role="navigation">
            <button
              class="pagination-previous"
              :disabled="meta.page === 1"
              @click="changePage(meta.page - 1)"
            >
              上一頁
            </button>
            <button
              class="pagination-next"
              :disabled="meta.page === meta.totalPages"
              @click="changePage(meta.page + 1)"
            >
              下一頁
            </button>
            <ul class="pagination-list">
              <li v-for="page in meta.totalPages" :key="page">
                <button
                  class="pagination-link"
                  :class="{ 'is-current': page === meta.page }"
                  @click="changePage(page)"
                >
                  {{ page }}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Empty State -->
        <div v-else class="has-text-centered py-6">
          <p class="title is-4">暫無課程申請</p>
          <p class="subtitle is-6">目前沒有符合條件的課程申請</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'

interface CourseApplication {
  id: number
  instructor_id: number
  instructor_name?: string
  instructor_email?: string
  course_name: string
  description: string
  category: string
  target_audience: string
  duration: number
  price: number
  delivery_methods: string
  syllabus: string
  teaching_experience: string
  materials?: string
  special_requirements?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
}

const applications = ref<CourseApplication[]>([])
const isLoading = ref(false)
const isReviewing = ref(false)
const errorMessage = ref('')

const filters = reactive({
  status: ''
})

const meta = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// Format date helper
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Status text helper
const statusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: '待審核',
    approved: '已批准',
    rejected: '已拒絕'
  }
  return texts[status] || status
}

// Load applications
const loadApplications = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const params: any = {
      page: meta.page,
      limit: meta.limit
    }

    if (filters.status) {
      params.status = filters.status
    }

    console.log('Loading course applications with params:', params)
    const response = await api.get('/course-applications', { params })
    console.log('Course applications response:', response.data)
    applications.value = response.data?.data ?? []

    if (response.data?.meta) {
      meta.page = response.data.meta.page
      meta.limit = response.data.meta.limit
      meta.total = response.data.meta.total
      meta.totalPages = response.data.meta.totalPages
    }
  } catch (error: any) {
    console.error('Error loading course applications:', error)
    console.error('Error response:', error.response)
    errorMessage.value = error.response?.data?.error?.message || error.response?.data?.message || '載入申請列表失敗'
  } finally {
    isLoading.value = false
  }
}

// Review application
const reviewApplication = async (applicationId: number, status: 'approved' | 'rejected') => {
  const confirmMessage =
    status === 'approved' ? '確定要批准此課程申請嗎？' : '確定要拒絕此課程申請嗎？'

  if (!confirm(confirmMessage)) {
    return
  }

  const reviewNotes = prompt('請輸入審核備註（選填）：')

  try {
    isReviewing.value = true
    await api.put(`/course-applications/${applicationId}/review`, {
      status,
      review_notes: reviewNotes || undefined
    })
    alert(status === 'approved' ? '已批准課程申請' : '已拒絕課程申請')
    await loadApplications()
  } catch (error: any) {
    alert(error.response?.data?.message || '審核失敗')
  } finally {
    isReviewing.value = false
  }
}

// Change page
const changePage = (page: number) => {
  meta.page = page
  loadApplications()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Load applications on component mount
onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.course-applications-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3273dc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

