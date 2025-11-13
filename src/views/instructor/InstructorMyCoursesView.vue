<template>
  <div class="instructor-my-courses-view">
    <section class="section">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-four-fifths">
            <!-- Page title -->
            <div class="mb-5">
              <h1 class="title is-2">我的授課</h1>
              <p class="subtitle">管理您教授的課程</p>
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

            <!-- Empty state -->
            <div v-else-if="courses.length === 0" class="card">
              <div class="card-content has-text-centered">
                <p class="title is-4">目前沒有授課</p>
                <p class="mb-4">您還沒有開設任何課程</p>
                <router-link to="/instructor/course-application" class="button is-primary">
                  <span class="icon">
                    <i class="fas fa-plus"></i>
                  </span>
                  <span>申請開課</span>
                </router-link>
              </div>
            </div>

            <!-- Course list -->
            <div v-else>
              <!-- Course cards -->
              <div class="columns is-multiline">
                <div v-for="course in courses" :key="course.id" class="column is-one-third">
                  <div class="card">
                    <div class="card-content">
                      <h3 class="title is-5">{{ course.title }}</h3>
                      <p class="subtitle is-6 has-text-grey">{{ getCourseTypeText(course.course_type) }}</p>

                      <div class="content">
                        <p class="is-size-7">{{ truncateText(course.description, 100) }}</p>

                        <div class="tags">
                          <span class="tag is-info">{{ getCourseTypeText(course.course_type) }}</span>
                          <span v-if="course.duration_hours" class="tag">{{ course.duration_hours }} 小時</span>
                        </div>

                        <div class="field is-grouped mt-3">
                          <div class="control">
                            <span class="tag is-success">
                              <span class="icon">
                                <i class="fas fa-user-graduate"></i>
                              </span>
                              <span>{{ course.enrollment_count ?? 0 }} 學員</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <footer class="card-footer">
                      <router-link :to="`/courses/${course.id}`" class="card-footer-item">
                        查看詳情
                      </router-link>
                      <router-link :to="`/instructor/courses/${course.id}/students`" class="card-footer-item">
                        <span class="icon">
                          <i class="fas fa-users"></i>
                        </span>
                        <span>學員管理</span>
                      </router-link>
                    </footer>
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
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import { api } from '@/services/api'

// Component state
const courses = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const meta = ref({
  page: 1,
  limit: 9,
  total: 0,
  totalPages: 0
})

// Truncate text helper
const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

// Get course type text
const getCourseTypeText = (courseType: string): string => {
  const typeMap: Record<string, string> = {
    'basic': '基礎課程',
    'advanced': '進階課程', 
    'internship': '實習課程'
  }
  return typeMap[courseType] || courseType || '未分類'
}

// Load courses
const loadCourses = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    // 首先獲取當前用戶的講師資料以取得 instructor ID
    const profileResponse = await api.get('/instructors/profile')
    
    if (!profileResponse.data?.success || !profileResponse.data?.data) {
      throw new Error('無法獲取講師資料')
    }

    const profile = profileResponse.data.data || {}
    // 依序嘗試可用的講師識別鍵（因實際 schema 可能為 instructor_id 或 application_id 等）
    const instructorIdentifier =
      profile.instructor_id ??
      profile.application_id ??
      profile.instructor_application_id ??
      profile.id // 某些實作中 profile 本身即為講師/申請的 id

    const userIdFallback = profile.user_id ?? profile.userId ?? profile.user?.id

    let response
    // 優先以講師識別鍵查課程（符合 courses.instructor_id = instructor_applications.id 的關聯）
    if (instructorIdentifier != null) {
      try {
        response = await api.get(`/instructors/${instructorIdentifier}/courses`, {
          params: { page: meta.value.page, limit: meta.value.limit }
        })
      } catch (e: any) {
        // 若此路由不存在或 404，再回退嘗試以 userId 的路由（避免舊版後端影響）
        if (userIdFallback != null) {
          response = await api.get(`/instructors/${userIdFallback}/courses`, {
            params: { page: meta.value.page, limit: meta.value.limit }
          })
        } else {
          throw e
        }
      }
    } else if (userIdFallback != null) {
      // 沒有講師識別鍵時，退而求其次用 userId 路由
      response = await api.get(`/instructors/${userIdFallback}/courses`, {
        params: { page: meta.value.page, limit: meta.value.limit }
      })
    } else {
      throw new Error('講師識別資訊缺失（instructor_id/application_id/user_id 均不存在）')
    }

    if (response?.data?.success) {
      courses.value = response.data.data || []
      if (response.data.meta) {
        meta.value = response.data.meta
      }
    } else {
      courses.value = []
    }
  } catch (error: any) {
    console.error('載入課程失敗:', error)
    if (error.response?.status === 404) {
      // 如果沒有課程，顯示空列表
      courses.value = []
    } else {
      errorMessage.value = error.response?.data?.error?.message || '載入課程失敗'
    }
  } finally {
    isLoading.value = false
  }
}

// Change page
const changePage = (page: number) => {
  meta.value.page = page
  loadCourses()
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

// Load courses on component mount
onMounted(() => {
  loadCourses()
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

.card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1;
}
</style>
