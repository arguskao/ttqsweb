<template>
  <div class="course-detail-view">
    <section class="section">
      <div class="container">
        <!-- Loading State -->
        <div v-if="loading" class="has-text-centered py-6">
          <button class="button is-loading is-large is-white" disabled>載入中...</button>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="notification is-danger">
          <button class="delete" @click="error = null"></button>
          {{ error }}
        </div>

        <!-- Course Detail -->
        <div v-else-if="course">
          <!-- Breadcrumb -->
          <nav class="breadcrumb mb-5" aria-label="breadcrumbs">
            <ul>
              <li><router-link to="/">首頁</router-link></li>
              <li><router-link to="/courses">課程列表</router-link></li>
              <li class="is-active"><a href="#" aria-current="page">{{ course.title }}</a></li>
            </ul>
          </nav>

          <div class="columns">
            <!-- Main Content -->
            <div class="column is-8">
              <div class="box">
                <!-- Course Header -->
                <div class="mb-5">
                  <div class="level is-mobile mb-3">
                    <div class="level-left">
                      <div class="level-item">
                        <span class="tag is-medium" :class="courseTypeClass">
                          {{ courseTypeLabel }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h1 class="title is-2">{{ course.title }}</h1>
                  <p class="subtitle is-5 has-text-grey">{{ course.description }}</p>
                </div>

                <hr />

                <!-- Course Info -->
                <div class="content mb-5">
                  <h3 class="title is-4">課程資訊</h3>
                  <div class="columns is-mobile">
                    <div class="column">
                      <div class="icon-text">
                        <span class="icon has-text-info">
                          <i class="fas fa-clock"></i>
                        </span>
                        <span><strong>課程時數：</strong>{{ course.durationHours }} 小時</span>
                      </div>
                    </div>
                    <div class="column">
                      <div class="icon-text">
                        <span class="icon has-text-success">
                          <i class="fas fa-dollar-sign"></i>
                        </span>
                        <span><strong>課程費用：</strong>NT$ {{ course.price?.toLocaleString() || '免費' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr />

                <!-- Course Outline -->
                <div class="content mb-5">
                  <h3 class="title is-4">課程大綱</h3>
                  <div v-if="courseOutline.length > 0">
                    <div v-for="(section, index) in courseOutline" :key="index" class="mb-4">
                      <h4 class="subtitle is-5">
                        <span class="tag is-primary is-light mr-2">{{ index + 1 }}</span>
                        {{ section.title }}
                      </h4>
                      <ul>
                        <li v-for="(item, itemIndex) in section.items" :key="itemIndex">
                          {{ item }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div v-else class="notification is-light">
                    <p>課程大綱將在開課前提供</p>
                  </div>
                </div>

                <hr />

                <!-- Instructor Info -->
                <div v-if="course.instructorFirstName" class="content">
                  <h3 class="title is-4">講師資訊</h3>
                  <div class="media">
                    <div class="media-left">
                      <figure class="image is-64x64">
                        <div class="has-background-primary has-text-white is-flex is-align-items-center is-justify-content-center" style="width: 64px; height: 64px; border-radius: 50%;">
                          <span class="is-size-4">{{ course.instructorFirstName.charAt(0) }}</span>
                        </div>
                      </figure>
                    </div>
                    <div class="media-content">
                      <p class="title is-5">{{ course.instructorFirstName }} {{ course.instructorLastName }}</p>
                      <p class="subtitle is-6 has-text-grey">專業講師</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="column is-4">
              <div class="box has-background-light">
                <div class="has-text-centered mb-4">
                  <p class="title is-3 has-text-primary">
                    NT$ {{ course.price?.toLocaleString() || '免費' }}
                  </p>
                </div>

                <!-- Enrollment Status -->
                <div v-if="isAuthenticated">
                  <!-- 講師專用界面 -->
                  <div v-if="authStore.isInstructor">
                    <div class="notification is-info is-light">
                      <p class="has-text-centered">
                        <span class="icon">
                          <i class="fas fa-chalkboard-teacher"></i>
                        </span>
                        <span>您是講師身份</span>
                      </p>
                    </div>
                    <button
                      class="button is-info is-large is-fullwidth"
                      @click="goToInstructorDashboard"
                    >
                      <span class="icon">
                        <i class="fas fa-users"></i>
                      </span>
                      <span>查看學員管理</span>
                    </button>
                  </div>
                  
                  <!-- 學員/求職者界面 -->
                  <div v-else>
                    <div v-if="enrollmentStatus === 'loading'" class="has-text-centered">
                      <button class="button is-loading is-white" disabled>檢查中...</button>
                    </div>
                    <div v-else-if="isEnrolled" class="notification is-success is-light">
                      <p class="has-text-centered">
                        <span class="icon">
                          <i class="fas fa-check-circle"></i>
                        </span>
                        <span>您已註冊此課程</span>
                      </p>
                      <button
                        class="button is-primary is-fullwidth mt-3"
                        @click="goToProgress"
                      >
                        <span class="icon">
                          <!-- Inline SVG to avoid external icon dependency -->
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M3 3h2v16h16v2H3V3zm17.293 4.293l-5.586 5.586-3.293-3.293L7 13v2l4.414-4.414 3.293 3.293 6.293-6.293-1.707-1.293z"/>
                          </svg>
                        </span>
                        <span>查看學習進度</span>
                      </button>
                      <button
                        class="button is-info is-fullwidth mt-2"
                        @click="goToMessages"
                      >
                        <span class="icon">
                          <i class="fas fa-envelope"></i>
                        </span>
                        <span>查看課程訊息</span>
                      </button>
                    </div>
                    <div v-else>
                      <button
                        class="button is-primary is-large is-fullwidth"
                        :class="{ 'is-loading': enrolling }"
                        :disabled="enrolling"
                        @click="handleEnroll"
                      >
                        <span class="icon">
                          <i class="fas fa-graduation-cap"></i>
                        </span>
                        <span>立即報名</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <button
                    class="button is-primary is-large is-fullwidth"
                    @click="goToLogin"
                  >
                    <span class="icon">
                      <i class="fas fa-sign-in-alt"></i>
                    </span>
                    <span>登入後報名</span>
                  </button>
                </div>

                <hr />

                <!-- Course Features -->
                <div class="content">
                  <h4 class="title is-5">課程特色</h4>
                  <ul class="fa-ul">
                    <li>
                      <span class="fa-li"><i class="fas fa-check has-text-success"></i></span>
                      職能導向教學
                    </li>
                    <li>
                      <span class="fa-li"><i class="fas fa-check has-text-success"></i></span>
                      實務操作結合
                    </li>
                    <li>
                      <span class="fa-li"><i class="fas fa-check has-text-success"></i></span>
                      就業媒合服務
                    </li>
                    <li>
                      <span class="fa-li"><i class="fas fa-check has-text-success"></i></span>
                      完課證書認證
                    </li>
                  </ul>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import courseService from '@/services/course-service'
import { useAuthStore } from '@/stores/auth'
import type { Course } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const course = ref<Course | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const enrolling = ref(false)
const enrollmentStatus = ref<'loading' | 'enrolled' | 'not_enrolled'>('loading')
const isEnrolled = ref(false)

// Computed
const isAuthenticated = computed(() => {
  // 檢查是否有有效的 token
  const token = sessionStorage.getItem('access_token')
  const tokenExpiry = sessionStorage.getItem('token_expiry')
  const hasValidToken = token && tokenExpiry && Date.now() < parseInt(tokenExpiry, 10)
  
  return authStore.isAuthenticated && hasValidToken
})

const courseTypeClass = computed(() => {
  if (!course.value) return 'is-light'

  switch (course.value.courseType) {
    case 'basic':
      return 'is-info'
    case 'advanced':
      return 'is-warning'
    case 'internship':
      return 'is-success'
    default:
      return 'is-light'
  }
})

const courseTypeLabel = computed(() => {
  if (!course.value) return '課程'

  switch (course.value.courseType) {
    case 'basic':
      return '基礎課程'
    case 'advanced':
      return '進階課程'
    case 'internship':
      return '實習課程'
    default:
      return '課程'
  }
})

// Course outline based on course type
const courseOutline = computed(() => {
  if (!course.value) return []

  switch (course.value.courseType) {
    case 'basic':
      return [
        {
          title: '藥學入門',
          items: ['藥品基礎知識', '常見藥品分類', '藥品儲存與管理']
        },
        {
          title: '庫存管理',
          items: ['進銷存系統操作', '盤點作業流程', '過期藥品處理']
        },
        {
          title: '溝通技巧',
          items: ['顧客服務技巧', '專業諮詢能力', '問題處理方法']
        },
        {
          title: '職場倫理',
          items: ['職業道德規範', '個資保護法規', '工作安全守則']
        }
      ]
    case 'advanced':
      return [
        {
          title: '保健食品',
          items: ['保健食品分類', '產品諮詢技巧', '銷售實務演練']
        },
        {
          title: '處方箋辨識',
          items: ['處方箋格式認識', '常見處方解讀', '調劑輔助作業']
        },
        {
          title: '櫃台管理',
          items: ['收銀系統操作', '健保申報流程', '顧客關係管理']
        },
        {
          title: '醫療法規',
          items: ['藥事法規概要', '健保相關法規', '消費者保護法']
        }
      ]
    case 'internship':
      return [
        {
          title: '實習前準備',
          items: ['實習規範說明', '職場禮儀訓練', '安全衛生教育']
        },
        {
          title: '實務操作',
          items: ['藥局日常作業', '顧客服務實習', '庫存管理實作']
        },
        {
          title: '專業技能',
          items: ['藥品調劑輔助', '保健諮詢實務', '系統操作熟練']
        },
        {
          title: '成果評估',
          items: ['實習表現評核', '職能測驗考核', '就業媒合準備']
        }
      ]
    default:
      return []
  }
})

// Methods
const loadCourse = async () => {
  const courseId = parseInt(route.params.id as string)

  if (!courseId) {
    error.value = '無效的課程 ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    course.value = await courseService.getCourseById(courseId)

    // Check enrollment status if authenticated
    // 只有在有有效 token 時才檢查報名狀態
    const token = sessionStorage.getItem('access_token')
    const tokenExpiry = sessionStorage.getItem('token_expiry')
    const hasValidToken = token && tokenExpiry && Date.now() < parseInt(tokenExpiry, 10)
    
    if (isAuthenticated.value && hasValidToken) {
      await checkEnrollmentStatus(courseId)
    } else {
      enrollmentStatus.value = 'not_enrolled'
    }
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '載入課程失敗，請稍後再試'
    console.error('Error loading course:', err)
  } finally {
    loading.value = false
  }
}

const checkEnrollmentStatus = async (courseId: number) => {
  try {
    const progress = await courseService.getCourseProgress(courseId)
    isEnrolled.value = true
    enrollmentStatus.value = 'enrolled'
  } catch (err) {
    isEnrolled.value = false
    enrollmentStatus.value = 'not_enrolled'
  }
}

const handleEnroll = async () => {
  if (!course.value) return

  enrolling.value = true

  try {
    await courseService.enrollCourse(course.value.id)
    isEnrolled.value = true
    enrollmentStatus.value = 'enrolled'

    // Show success message
    alert('課程註冊成功！')
  } catch (err: any) {
    const errorMessage = err.response?.data?.error?.message || '課程註冊失敗，請稍後再試'
    alert(errorMessage)
    console.error('Error enrolling course:', err)
  } finally {
    enrolling.value = false
  }
}

const goToProgress = () => {
  if (course.value) {
    // 記住最近查看的課程，提供學習進度頁面載入依據
    try {
      localStorage.setItem('last_course_id', String(course.value.id))
    } catch {}
    router.push('/learning-progress')
  }
}

const goToLogin = () => {
  router.push(`/login?redirect=/courses/${route.params.id}`)
}

const goToInstructorDashboard = () => {
  // 导航到讲师的课程管理页面
  router.push('/instructor/my-courses')
}

const goToMessages = () => {
  if (course.value) {
    router.push(`/courses/${course.value.id}/messages`)
  }
}

// Lifecycle
onMounted(() => {
  loadCourse()
})
</script>

<style scoped>
.course-detail-view {
  min-height: calc(100vh - 200px);
}

.fa-ul {
  margin-left: 2em;
}

.fa-li {
  left: -2em;
}
</style>
