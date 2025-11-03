<template>
  <div class="courses-view">
    <section class="section">
      <div class="container">
        <!-- Header -->
        <div class="has-text-centered mb-6">
          <h1 class="title is-2">課程列表</h1>
          <p class="subtitle">選擇適合您的學習課程</p>
        </div>

        <!-- Filters and Search -->
        <div class="box mb-5">
          <div class="columns">
            <div class="column is-4">
              <div class="field">
                <label class="label">課程類型</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="filters.courseType" @change="handleFilterChange">
                      <option :value="undefined">全部課程</option>
                      <option value="basic">基礎課程</option>
                      <option value="advanced">進階課程</option>
                      <option value="internship">實習課程</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="column is-8">
              <div class="field">
                <label class="label">搜尋課程</label>
                <div class="control has-icons-left">
                  <input
                    v-model="searchQuery"
                    class="input"
                    type="text"
                    placeholder="輸入課程名稱或關鍵字..."
                    @input="handleSearchInput"
                  />
                  <span class="icon is-left">
                    <i class="fas fa-search"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>



        <!-- Loading State -->
        <div v-if="loading" class="has-text-centered py-6">
          <button class="button is-loading is-large is-white" disabled>載入中...</button>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="notification is-danger">
          <button class="delete" @click="error = null"></button>
          {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="courses.length === 0" class="notification is-info">
          <p class="has-text-centered">
            <i class="fas fa-info-circle"></i>
            目前沒有符合條件的課程
          </p>
        </div>

        <!-- Course Grid -->
        <div v-else class="columns is-multiline">
          <div
            v-for="course in courses"
            :key="course.id"
            class="column is-12-mobile is-6-tablet is-4-desktop"
          >
            <CourseCard
              :course="course"
            />
          </div>
        </div>

        <!-- Pagination -->
        <nav
          v-if="!loading && courses.length > 0"
          class="pagination is-centered mt-6"
          role="navigation"
          aria-label="pagination"
        >
          <button
            class="pagination-previous"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            上一頁
          </button>
          <button
            class="pagination-next"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            下一頁
          </button>
          <ul class="pagination-list">
            <li v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="pagination-link"
                :class="{ 'is-current': page === currentPage }"
                @click="goToPage(page as number)"
              >
                {{ page }}
              </button>
              <span v-else class="pagination-ellipsis">&hellip;</span>
            </li>
          </ul>
        </nav>

        <!-- Results Info -->
        <div v-if="!loading && courses.length > 0" class="has-text-centered mt-4">
          <p class="has-text-grey">
            顯示第 {{ (currentPage - 1) * pageLimit + 1 }} -
            {{ Math.min(currentPage * pageLimit, totalCourses) }} 筆， 共 {{ totalCourses }} 筆課程
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import CourseCard from '@/components/common/CourseCard.vue'
import courseService from '@/services/course-service'
import type { Course, CourseFilters } from '@/types'

const router = useRouter()

// State
const courses = ref<Course[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const searchTimeout = ref<number | null>(null)

// Filters
const filters = ref<CourseFilters>({
  courseType: undefined,
  search: '',
  page: 1,
  limit: 20  // 增加每頁顯示數量以顯示所有課程
})

// Pagination
const currentPage = ref(1)
const totalCourses = ref(0)
const totalPages = ref(0)
const pageLimit = ref(20)

// Computed
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 5

  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages.value)
    } else if (currentPage.value >= totalPages.value - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      pages.push(currentPage.value - 1)
      pages.push(currentPage.value)
      pages.push(currentPage.value + 1)
      pages.push('...')
      pages.push(totalPages.value)
    }
  }

  return pages
})

// Methods
const loadCourses = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('載入課程，篩選條件:', filters.value) // 調試日誌
    const response = await courseService.getCourses(filters.value)
    console.log('API響應:', response) // 調試日誌
    console.log('response.data 類型:', typeof response.data, 'Array.isArray:', Array.isArray(response.data))
    console.log('response.data 內容:', response.data)

    if (response && response.data) {
      // 確保 response.data 是數組
      const coursesData = Array.isArray(response.data) ? response.data : []
      courses.value = coursesData
      totalCourses.value = response.meta?.total || coursesData.length
      totalPages.value = response.meta?.totalPages || Math.ceil(coursesData.length / (filters.value.limit || 9))
      currentPage.value = response.meta?.page || 1
    } else {
      courses.value = []
      totalCourses.value = 0
      totalPages.value = 0
      currentPage.value = 1
    }

    console.log('處理後的課程數據:', courses.value) // 調試日誌
    console.log('課程數量:', courses.value.length) // 調試日誌
    console.log('總課程數:', totalCourses.value) // 調試日誌
  } catch (err: any) {
    console.error('Error loading courses:', err)
    error.value = err.response?.data?.message || err.message || '載入課程失敗，請稍後再試'
    courses.value = []
    totalCourses.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  filters.value.page = 1
  currentPage.value = 1
  console.log('篩選變更:', filters.value) // 調試日誌
  loadCourses()
}

const handleSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = window.setTimeout(() => {
    filters.value.search = searchQuery.value
    filters.value.page = 1
    currentPage.value = 1
    loadCourses()
  }, 500)
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return

  filters.value.page = page
  currentPage.value = page
  loadCourses()

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleEnroll = (courseId: number) => {
  router.push(`/courses/${courseId}`)
}



// Lifecycle
onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.courses-view {
  min-height: calc(100vh - 200px);
}

.pagination-link.is-current {
  background-color: #00d1b2;
  border-color: #00d1b2;
  color: #fff;
}
</style>
