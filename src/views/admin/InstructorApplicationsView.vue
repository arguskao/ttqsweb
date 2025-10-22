<template>
  <div class="instructor-applications-view">
    <section class="section">
      <div class="container">
        <div class="has-text-centered mb-5">
          <h1 class="title is-2">講師申請管理</h1>
          <p class="subtitle">審核和管理講師申請</p>
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

        <!-- Loading state -->
        <div v-if="isLoading" class="has-text-centered">
          <div class="loader"></div>
          <p>載入中...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="notification is-danger">
          {{ errorMessage }}
        </div>

        <!-- Applications list -->
        <div v-else-if="applications.length > 0">
          <div class="box" v-for="application in applications" :key="application.id">
            <div class="columns">
              <div class="column">
                <div class="level">
                  <div class="level-left">
                    <div>
                      <p class="title is-5">
                        {{ application.first_name }} {{ application.last_name }}
                      </p>
                      <p class="subtitle is-6">{{ application.email }}</p>
                    </div>
                  </div>
                  <div class="level-right">
                    <div class="tags">
                      <span
                        class="tag is-medium"
                        :class="{
                          'is-warning': application.application_status === 'pending',
                          'is-success': application.application_status === 'approved',
                          'is-danger': application.application_status === 'rejected'
                        }"
                      >
                        {{ statusText(application.application_status) }}
                      </span>
                      <span v-if="!application.is_active" class="tag is-medium is-dark"
                        >已停用</span
                      >
                    </div>
                  </div>
                </div>

                <div class="content">
                  <div class="columns">
                    <div class="column">
                      <p><strong>專業領域：</strong>{{ application.specialization || '未提供' }}</p>
                      <p>
                        <strong>工作年資：</strong>{{ application.years_of_experience ?? 0 }} 年
                      </p>
                    </div>
                    <div class="column">
                      <p>
                        <strong>平均評分：</strong
                        >{{ (application.average_rating ?? 0).toFixed(1) }}/5.0 ({{
                          application.total_ratings ?? 0
                        }}
                        評價)
                      </p>
                      <p><strong>申請時間：</strong>{{ formatDate(application.created_at) }}</p>
                    </div>
                  </div>

                  <div class="box has-background-light">
                    <p><strong>個人簡介：</strong></p>
                    <p>{{ application.bio || '未提供' }}</p>
                  </div>

                  <div class="box has-background-light">
                    <p><strong>資格證明：</strong></p>
                    <p>{{ application.qualifications || '未提供' }}</p>
                  </div>
                </div>

                <!-- Action buttons -->
                <div v-if="application.application_status === 'pending'" class="field is-grouped">
                  <div class="control">
                    <button
                      class="button is-success"
                      @click="reviewApplication(application.id, 'approved')"
                      :disabled="isReviewing"
                    >
                      <span class="icon">
                        <i class="fas fa-check"></i>
                      </span>
                      <span>批准</span>
                    </button>
                  </div>
                  <div class="control">
                    <button
                      class="button is-danger"
                      @click="reviewApplication(application.id, 'rejected')"
                      :disabled="isReviewing"
                    >
                      <span class="icon">
                        <i class="fas fa-times"></i>
                      </span>
                      <span>拒絕</span>
                    </button>
                  </div>
                </div>

                <!-- View details button -->
                <div class="field">
                  <div class="control">
                    <router-link
                      :to="`/instructors/${application.id}`"
                      class="button is-info is-light"
                    >
                      <span class="icon">
                        <i class="fas fa-eye"></i>
                      </span>
                      <span>查看詳情</span>
                    </router-link>
                  </div>
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
          </nav>
        </div>

        <!-- Empty state -->
        <div v-else class="has-text-centered">
          <p class="title is-4">目前沒有申請</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import { api } from '@/services/api'

// Component state
const applications = ref<any[]>([])
const isLoading = ref(true)
const isReviewing = ref(false)
const errorMessage = ref('')
const filters = ref({
  status: 'pending'
})
const meta = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// Format date helper
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
      page: meta.value.page,
      limit: meta.value.limit
    }

    if (filters.value.status) {
      params.status = filters.value.status
    }

    const response = await api.get('/instructors', { params })
    applications.value = response.data?.data ?? []

    if (response.data?.meta) {
      meta.value = response.data.meta
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error?.message || '載入申請列表失敗'
  } finally {
    isLoading.value = false
  }
}

// Review application
const reviewApplication = async (instructorId: number, status: 'approved' | 'rejected') => {
  const confirmMessage =
    status === 'approved' ? '確定要批准此講師申請嗎？' : '確定要拒絕此講師申請嗎？'

  if (!confirm(confirmMessage)) {
    return
  }

  try {
    isReviewing.value = true
    await api.post(`/instructors/${instructorId}/review`, { status })
    alert(status === 'approved' ? '已批准申請' : '已拒絕申請')
    await loadApplications()
  } catch (error: any) {
    alert(error.response?.data?.error?.message || '審核失敗')
  } finally {
    isReviewing.value = false
  }
}

// Change page
const changePage = (page: number) => {
  meta.value.page = page
  loadApplications()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Load applications on component mount
onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 1rem;
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
