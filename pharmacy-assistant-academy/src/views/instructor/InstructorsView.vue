<template>
  <div class="instructors-view">
    <section class="hero is-primary">
      <div class="hero-body">
        <div class="container">
          <h1 class="title is-2">講師團隊</h1>
          <p class="subtitle">專業的藥師和資深藥局助理為您授課</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <!-- Filters -->
        <div class="box mb-5">
          <div class="columns">
            <div class="column">
              <div class="field">
                <label class="label">專業領域</label>
                <div class="control">
                  <input 
                    class="input" 
                    type="text" 
                    v-model="filters.specialization" 
                    placeholder="搜尋專業領域"
                    @input="debouncedSearch"
                  />
                </div>
              </div>
            </div>
            <div class="column is-narrow">
              <div class="field">
                <label class="label">&nbsp;</label>
                <div class="control">
                  <button class="button is-primary" @click="loadInstructors">
                    <span class="icon">
                      <i class="fas fa-search"></i>
                    </span>
                    <span>搜尋</span>
                  </button>
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

        <!-- Instructors list -->
        <div v-else-if="instructors.length > 0">
          <div class="columns is-multiline">
            <div 
              v-for="instructor in instructors" 
              :key="instructor.id" 
              class="column is-one-third"
            >
              <div class="card">
                <div class="card-content">
                  <div class="media">
                    <div class="media-left">
                      <figure class="image is-64x64">
                        <div class="has-background-primary has-text-white is-flex is-align-items-center is-justify-content-center" style="width: 64px; height: 64px; border-radius: 50%; font-size: 24px; font-weight: bold;">
                          {{ instructor.first_name?.charAt(0) }}{{ instructor.last_name?.charAt(0) }}
                        </div>
                      </figure>
                    </div>
                    <div class="media-content">
                      <p class="title is-5">{{ instructor.first_name }} {{ instructor.last_name }}</p>
                      <p class="subtitle is-6">
                        <span class="icon-text">
                          <span class="icon has-text-warning">
                            <i class="fas fa-star"></i>
                          </span>
                          <span>{{ (instructor.average_rating || 0).toFixed(1) }}/5.0</span>
                        </span>
                        <span class="ml-2">({{ instructor.total_ratings || 0 }})</span>
                      </p>
                    </div>
                  </div>

                  <div class="content">
                    <p v-if="instructor.specialization" class="mb-2">
                      <strong>專業領域：</strong>{{ instructor.specialization }}
                    </p>
                    <p v-if="instructor.years_of_experience" class="mb-2">
                      <strong>工作年資：</strong>{{ instructor.years_of_experience }} 年
                    </p>
                    <p v-if="instructor.bio" class="is-size-7">
                      {{ truncateText(instructor.bio, 100) }}
                    </p>
                  </div>

                  <footer class="card-footer">
                    <router-link 
                      :to="`/instructors/${instructor.id}`" 
                      class="card-footer-item"
                    >
                      查看詳情
                    </router-link>
                  </footer>
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
              <li v-for="page in paginationPages" :key="page">
                <button 
                  v-if="page !== '...'"
                  class="pagination-link" 
                  :class="{ 'is-current': page === meta.page }"
                  @click="changePage(page as number)"
                >
                  {{ page }}
                </button>
                <span v-else class="pagination-ellipsis">&hellip;</span>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Empty state -->
        <div v-else class="has-text-centered">
          <p class="title is-4">目前沒有講師</p>
          <p class="subtitle">請稍後再查看</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'

// Component state
const instructors = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const filters = ref({
  specialization: ''
})
const meta = ref({
  page: 1,
  limit: 9,
  total: 0,
  totalPages: 0
})

// Debounce timer
let searchTimer: number | null = null

// Truncate text helper
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Debounced search
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    meta.value.page = 1
    loadInstructors()
  }, 500)
}

// Load instructors
const loadInstructors = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const params: any = {
      status: 'approved',
      is_active: 'true',
      page: meta.value.page,
      limit: meta.value.limit
    }
    
    const response = await api.get('/api/v1/instructors', { params })
    instructors.value = response.data
    
    if (response.meta) {
      meta.value = response.meta
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error?.message || '載入講師列表失敗'
  } finally {
    isLoading.value = false
  }
}

// Change page
const changePage = (page: number) => {
  meta.value.page = page
  loadInstructors()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Compute pagination pages
const paginationPages = computed(() => {
  const pages: (number | string)[] = []
  const total = meta.value.totalPages
  const current = meta.value.page
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 3; i <= total; i++) pages.push(i)
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

// Load instructors on component mount
onMounted(() => {
  loadInstructors()
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1;
}
</style>
