<template>
  <div class="instructor-detail-view">
    <section class="section">
      <div class="container">
        <!-- Loading state -->
        <div v-if="isLoading" class="has-text-centered">
          <div class="loader"></div>
          <p>載入中...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="notification is-danger">
          {{ errorMessage }}
          <router-link to="/instructors" class="button is-light mt-3">返回講師列表</router-link>
        </div>

        <!-- Instructor details -->
        <div v-else-if="instructor">
          <!-- Back button -->
          <router-link to="/instructors" class="button is-light mb-4">
            <span class="icon">
              <span>⬅️</span>
            </span>
            <span>返回</span>
          </router-link>

          <div class="columns">
            <!-- Left column - Profile -->
            <div class="column is-one-third">
              <div class="card">
                <div class="card-content has-text-centered">
                  <figure class="image is-128x128 is-inline-block mb-4">
                    <div
                      class="has-background-primary has-text-white is-flex is-align-items-center is-justify-content-center"
                      style="
                        width: 128px;
                        height: 128px;
                        border-radius: 50%;
                        font-size: 48px;
                        font-weight: bold;
                      "
                    >
                      {{ instructor.first_name?.charAt(0) }}{{ instructor.last_name?.charAt(0) }}
                    </div>
                  </figure>

                  <h1 class="title is-4">{{ instructor.first_name }} {{ instructor.last_name }}</h1>

                  <div class="tags are-medium is-centered mb-4">
                    <span class="tag is-warning">
                      <span class="icon">
                        <i class="fas fa-star"></i>
                      </span>
                      <span>{{ (parseFloat(instructor.average_rating) || 0).toFixed(1) }}/5.0</span>
                    </span>
                    <span class="tag is-info">{{ instructor.total_ratings ?? 0 }} 評價</span>
                  </div>

                  <div class="content">
                    <p v-if="instructor.specialization">
                      <strong>專業領域</strong><br />
                      {{ instructor.specialization }}
                    </p>
                    <p v-if="instructor.years_of_experience">
                      <strong>工作年資</strong><br />
                      {{ instructor.years_of_experience }} 年
                    </p>
                  </div>
                </div>
              </div>

              <!-- Statistics -->
              <div class="card mt-4">
                <header class="card-header">
                  <p class="card-header-title">教學統計</p>
                </header>
                <div class="card-content">
                  <div class="field">
                    <label class="label">授課數量</label>
                    <p class="is-size-4">{{ stats?.total_courses ?? 0 }} 門課程</p>
                  </div>
                  <div class="field">
                    <label class="label">學員人數</label>
                    <p class="is-size-4">{{ stats?.total_students ?? 0 }} 位學員</p>
                  </div>
                  <div class="field">
                    <label class="label">百分制評分</label>
                    <p class="is-size-4">
                      {{ ((parseFloat(instructor.average_rating) || 0) * 20).toFixed(0) }}/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right column - Details -->
            <div class="column">
              <!-- Bio -->
              <div class="card mb-4">
                <header class="card-header">
                  <p class="card-header-title">個人簡介</p>
                </header>
                <div class="card-content">
                  <div class="content">
                    <p>{{ instructor.bio || '講師尚未提供個人簡介' }}</p>
                  </div>
                </div>
              </div>

              <!-- Qualifications -->
              <div class="card mb-4">
                <header class="card-header">
                  <p class="card-header-title">資格證明</p>
                </header>
                <div class="card-content">
                  <div class="content">
                    <p>{{ instructor.qualifications || '講師尚未提供資格證明' }}</p>
                  </div>
                </div>
              </div>

              <!-- Ratings -->
              <div class="card">
                <header class="card-header">
                  <p class="card-header-title">學員評價</p>
                </header>
                <div class="card-content">
                  <div v-if="loadingRatings" class="has-text-centered">
                    <p>載入評價中...</p>
                  </div>
                  <div v-else-if="ratings.length === 0" class="has-text-centered">
                    <p>尚無評價</p>
                  </div>
                  <div v-else>
                    <div v-for="rating in ratings" :key="rating.id" class="box">
                      <div class="level">
                        <div class="level-left">
                          <div>
                            <p class="heading">
                              {{ rating.student_first_name }} {{ rating.student_last_name }}
                            </p>
                            <p class="subtitle is-6">{{ rating.course_title }}</p>
                          </div>
                        </div>
                        <div class="level-right">
                          <div class="tags has-addons">
                            <span class="tag is-warning">
                              <i class="fas fa-star"></i>
                            </span>
                            <span class="tag is-warning">{{ rating.rating }}/5</span>
                          </div>
                        </div>
                      </div>
                      <p v-if="rating.comment" class="content">{{ rating.comment }}</p>
                      <p class="has-text-grey is-size-7">{{ formatDate(rating.created_at) }}</p>
                    </div>

                    <!-- Pagination for ratings -->
                    <nav
                      v-if="ratingsMeta.totalPages > 1"
                      class="pagination is-centered mt-4"
                      role="navigation"
                    >
                      <button
                        class="pagination-previous"
                        :disabled="ratingsMeta.page === 1"
                        @click="changeRatingsPage(ratingsMeta.page - 1)"
                      >
                        上一頁
                      </button>
                      <button
                        class="pagination-next"
                        :disabled="ratingsMeta.page === ratingsMeta.totalPages"
                        @click="changeRatingsPage(ratingsMeta.page + 1)"
                      >
                        下一頁
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '@/services/api'

const route = useRoute()

// Component state
const instructor = ref<any>(null)
const stats = ref<any>(null)
const ratings = ref<any[]>([])
const isLoading = ref(true)
const loadingRatings = ref(false)
const errorMessage = ref('')
const ratingsMeta = ref({
  page: 1,
  limit: 5,
  total: 0,
  totalPages: 0
})

// Computed properties for status display
const isApproved = computed(
  () =>
    (instructor.value.application_status &&
      instructor.value.application_status.toLowerCase().trim() === 'approved') ||
    (instructor.value.status && instructor.value.status.toLowerCase().trim() === 'approved')
)
const isPending = computed(
  () =>
    (instructor.value.application_status &&
      instructor.value.application_status.toLowerCase().trim() === 'pending') ||
    (instructor.value.status && instructor.value.status.toLowerCase().trim() === 'pending')
)

// Format date helper
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Load instructor details
const loadInstructor = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const instructorId = route.params.id
    const response = await api.get(`/instructors/${instructorId}`)
    console.log('講師詳情 API 響應:', response.data)

    if (response.data?.success) {
      instructor.value = response.data.data
      console.log('設置講師資料:', instructor.value)
    } else {
      throw new Error('API 響應格式錯誤')
    }

    // 暫時跳過統計和評價 API，直接使用默認值
    console.log('使用默認統計和評價數據')
    stats.value = {
      total_courses: 0,
      total_students: 0,
      completion_rate: 0
    }
    ratings.value = []
    ratingsMeta.value = {
      page: 1,
      limit: 5,
      total: 0,
      totalPages: 0
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error?.message || '載入講師資料失敗'
  } finally {
    isLoading.value = false
  }
}

// Load instructor statistics (暫時停用)
const loadStats = async () => {
  console.log('統計 API 暫時停用，使用默認值')
  stats.value = {
    total_courses: 0,
    total_students: 0,
    completion_rate: 0
  }
}

// Load instructor ratings (暫時停用)
const loadRatings = async () => {
  console.log('評價 API 暫時停用，使用默認值')
  loadingRatings.value = false
  ratings.value = []
  ratingsMeta.value = {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  }
}

// Change ratings page
const changeRatingsPage = (page: number) => {
  ratingsMeta.value.page = page
  // 暫時跳過評價 API 調用
  console.log('評價分頁功能暫時停用')
}

// Load instructor on component mount
onMounted(() => {
  loadInstructor()
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
