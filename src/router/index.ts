import { defineAsyncComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'

import { authServiceEnhanced, authService } from '@/services/auth-service-enhanced'
import { useAuthStore } from '@/stores/auth'

// 加載組件
const LoadingSpinner = defineAsyncComponent(() => import('@/components/common/LoadingSpinner.vue'))
const ErrorComponent = defineAsyncComponent(() => import('@/components/common/ErrorComponent.vue'))

// 異步組件工廠函數（不在這裡設置 meta，避免 TS 類型錯誤）
const createAsyncComponent = (loader: () => Promise<any>) =>
  defineAsyncComponent({
    loader,
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorComponent,
    delay: 200,
    timeout: 3000
  })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top for better UX
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '藥助Next學院 - 專業藥局助理轉職教育與就業媒合平台',
        description:
          '藥助Next學院提供專業的藥局助理轉職訓練課程，結合職能導向教學、實務操作與就業媒合服務，幫助您成功進入醫藥產業。',
        keywords: '藥局助理,轉職訓練,醫藥教育,就業媒合,藥學課程',
        keepAlive: true
      }
    },
    {
      path: '/login',
      name: 'login',
      component: createAsyncComponent(() => import('../views/auth/LoginView.vue')),
      meta: {
        requiresGuest: true,
        title: '登入 - 藥助Next學院',
        description: '登入藥助Next學院，開始您的藥局助理轉職之旅。'
      }
    },
    {
      path: '/register',
      name: 'register',
      component: createAsyncComponent(() => import('../views/auth/RegisterView.vue')),
      meta: {
        requiresGuest: true,
        title: '註冊 - 藥助Next學院',
        description: '註冊藥助Next學院帳號，選擇求職者或雇主身份，開始使用我們的服務。'
      }
    },
    {
      path: '/courses',
      name: 'courses',
      component: createAsyncComponent(() => import('../views/courses/CoursesView.vue')),
      meta: {
        title: '課程列表 - 藥助Next學院',
        description: '瀏覽藥助Next學院的專業課程，包含基礎職能、進階實務和實習機會。',
        keywords: '藥學課程,職能訓練,實務課程,藥局助理培訓',
        keepAlive: true
      }
    },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: createAsyncComponent(() => import('../views/courses/CourseDetailView.vue')),
      meta: {
        title: '課程詳情 - 藥助Next學院',
        description: '查看課程詳細資訊，包含課程大綱、講師介紹和學習目標。',
        keepAlive: true
      }
    },
    {
      path: '/learning-progress',
      name: 'learning-progress',
      component: createAsyncComponent(() => import('../views/courses/LearningProgressView.vue')),
      meta: {
        requiresAuth: true,
        keepAlive: true
      }
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: createAsyncComponent(() => import('../views/jobs/JobsView.vue')),
      meta: {
        keepAlive: true
      }
    },
    {
      path: '/jobs/:id',
      name: 'job-detail',
      component: createAsyncComponent(() => import('../views/jobs/JobDetailView.vue')),
      meta: {
        keepAlive: true
      }
    },
    {
      path: '/employer/jobs',
      name: 'employer-jobs',
      component: createAsyncComponent(() => import('../views/jobs/EmployerJobsView.vue')),
      meta: {
        requiresAuth: true,
        requiresEmployer: true,
        keepAlive: true
      }
    },
    {
      path: '/documents',
      name: 'documents',
      component: createAsyncComponent(() => import('../views/DocumentsView.vue')),
      meta: {
        keepAlive: true
      }
    },
    {
      path: '/community/groups',
      name: 'community-groups',
      component: createAsyncComponent(() => import('../views/community/GroupsView.vue')),
      meta: {
        title: '學員群組 - 藥助Next學院',
        description: '加入學員群組，與其他學員交流學習經驗和心得。',
        keepAlive: true
      }
    },
    {
      path: '/community/groups/:id',
      name: 'community-group-detail',
      component: createAsyncComponent(() => import('../views/community/GroupDetailView.vue')),
      meta: {
        title: '群組詳情 - 藥助Next學院',
        keepAlive: true
      }
    },
    {
      path: '/community/forum',
      name: 'community-forum',
      component: createAsyncComponent(() => import('../views/community/ForumView.vue')),
      meta: {
        title: '討論區 - 藥助Next學院',
        description: '與其他學員分享想法、提問和交流經驗。',
        keepAlive: true
      }
    },
    {
      path: '/community/forum/topics/:id',
      name: 'community-forum-topic',
      component: createAsyncComponent(() => import('../views/community/ForumTopicView.vue')),
      meta: {
        title: '討論主題 - 藥助Next學院',
        keepAlive: true
      }
    },
    {
      path: '/community/experiences',
      name: 'community-experiences',
      component: createAsyncComponent(() => import('../views/community/ExperiencesView.vue')),
      meta: {
        title: '經驗分享 - 藥助Next學院',
        description: '閱讀其他學員的經驗分享，包括就業心得、學習技巧和面試經驗。',
        keepAlive: true
      }
    },
    {
      path: '/instructors',
      name: 'instructors',
      component: createAsyncComponent(() => import('../views/instructor/InstructorsView.vue')),
      meta: {
        keepAlive: true
      }
    },
    {
      path: '/instructors/:id',
      name: 'instructor-detail',
      component: createAsyncComponent(() => import('../views/instructor/InstructorDetailView.vue')),
      meta: {
        keepAlive: true
      }
    },
    {
      path: '/instructor/apply',
      name: 'instructor-apply',
      component: createAsyncComponent(
        () => import('../views/instructor/InstructorApplicationView.vue')
      ),
      meta: {
        requiresAuth: true,
        title: '講師申請 - 藥助Next學院',
        description: '申請成為藥助Next學院的講師，分享您的專業知識與經驗。',
        keywords: '講師申請,講師招募,教學工作,藥學講師'
      }
    },
    {
      path: '/instructor/course-application',
      name: 'instructor-course-application',
      component: createAsyncComponent(
        () => import('../views/instructor/CourseApplicationView.vue')
      ),
      meta: {
        requiresAuth: true,
        requiresInstructor: true,
        title: '申請開課 - 藥助Next學院',
        description: '申請開設專業課程，分享您的知識與經驗'
      }
    },
    {
      path: '/instructor/profile',
      name: 'instructor-profile',
      component: createAsyncComponent(
        () => import('../views/instructor/InstructorProfileView.vue')
      ),
      meta: {
        requiresAuth: true,
        keepAlive: true
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: createAsyncComponent(() => import('../views/profile/ProfileView.vue')),
      meta: {
        requiresAuth: true,
        keepAlive: true
      }
    },
    {
      path: '/learning-history',
      name: 'learning-history',
      component: createAsyncComponent(() => import('../views/profile/LearningHistoryView.vue')),
      meta: {
        requiresAuth: true,
        keepAlive: true
      }
    },
    {
      path: '/application-history',
      name: 'application-history',
      component: createAsyncComponent(() => import('../views/profile/ApplicationHistoryView.vue')),
      meta: {
        requiresAuth: true,
        requiresJobSeeker: true,
        keepAlive: true
      }
    },
    {
      path: '/admin/instructor-applications',
      name: 'admin-instructor-applications',
      component: createAsyncComponent(
        () => import('../views/admin/InstructorApplicationsView.vue')
      ),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        keepAlive: true
      }
    },
    {
      path: '/admin/analytics',
      name: 'admin-analytics',
      component: createAsyncComponent(() => import('../views/admin/AnalyticsDashboardView.vue')),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        keepAlive: true
      }
    },
    {
      path: '/admin/ttqs',
      name: 'admin-ttqs',
      component: createAsyncComponent(() => import('../views/admin/TTQSDashboardView.vue')),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        keepAlive: true
      }
    },
    {
      path: '/admin/training-plans',
      name: 'admin-training-plans',
      component: createAsyncComponent(() => import('../views/admin/TrainingPlansView.vue')),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        keepAlive: true
      }
    },
    {
      path: '/training/policy',
      name: 'training-policy',
      component: createAsyncComponent(() => import('../views/training/TrainingPolicyView.vue')),
      meta: {
        title: '訓練政策 - 藥助Next學院',
        description: '了解藥助Next學院的訓練政策、核心原則與品質保證機制。',
        keywords: '訓練政策,TTQS,品質管理,藥局助理培訓',
        keepAlive: true
      }
    },
    {
      path: '/training/quality',
      name: 'training-quality',
      component: createAsyncComponent(() => import('../views/training/TrainingQualityView.vue')),
      meta: {
        title: '訓練品質 - 藥助Next學院',
        description: '深入了解藥助Next學院的TTQS品質管理系統與四層評估機制。',
        keywords: '訓練品質,TTQS,四層評估,品質管理系統',
        keepAlive: true
      }
    },
    {
      path: '/training/performance',
      name: 'training-performance',
      component: createAsyncComponent(
        () => import('../views/training/TrainingPerformanceView.vue')
      ),
      meta: {
        title: '訓練績效 - 藥助Next學院',
        description: '查看藥助Next學院的訓練績效指標、達成狀況與改善行動。',
        keywords: '訓練績效,績效指標,轉職成功率,學員滿意度',
        keepAlive: true
      }
    },
    {
      path: '/training/development',
      name: 'training-development',
      component: createAsyncComponent(
        () => import('../views/training/TrainingDevelopmentView.vue')
      ),
      meta: {
        title: '訓練發展方向 - 藥助Next學院',
        description: '了解藥助Next學院的發展願景、階段性策略與創新發展項目。',
        keywords: '訓練發展,發展方向,創新發展,數位化轉型',
        keepAlive: true
      }
    },
    {
      path: '/training/objectives',
      name: 'training-objectives',
      component: createAsyncComponent(() => import('../views/training/TrainingObjectivesView.vue')),
      meta: {
        title: '訓練目標 - 藥助Next學院',
        description: '了解藥助Next學院的訓練目標設定、達成策略與監控機制。',
        keywords: '訓練目標,目標設定,績效指標,目標達成',
        keepAlive: true
      }
    },
    {
      path: '/training/courses',
      name: 'training-courses',
      component: createAsyncComponent(() => import('../views/training/TrainingCoursesView.vue')),
      meta: {
        title: '訓練發展重點課程 - 藥助Next學院',
        description: '深入了解藥助Next學院的重點課程架構、內容與特色。',
        keywords: '重點課程,課程架構,基礎職能,進階實務,實習課程',
        keepAlive: true
      }
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // 等待認證初始化完成
  if (!(window as any).__authInitialized) {
    try {
      await authServiceEnhanced.initializeAuth()
      ;(window as any).__authInitialized = true
    } catch (error) {
      console.error('Auth initialization failed in router guard:', error)
    }
  }

  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUser()

  // 調試日誌 - Enhanced debugging
  console.log('Router guard check:', {
    to: to.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated,
    user,
    sessionToken: sessionStorage.getItem('access_token'),
    localToken: localStorage.getItem('auth_token'),
    sessionUser: sessionStorage.getItem('user'),
    localUser: localStorage.getItem('auth_user'),
    storeUser: authService.getCurrentUser(),
    storeToken: authService.getToken()
  })

  // Sync storage if there's a mismatch
  if (!isAuthenticated) {
    const sessionToken = sessionStorage.getItem('access_token')
    const localToken = localStorage.getItem('auth_token')
    const sessionUser = sessionStorage.getItem('user')
    const localUser = localStorage.getItem('auth_user')

    // Try to recover authentication state from either storage
    if (sessionToken && sessionUser) {
      console.log('Recovering auth from sessionStorage')
      try {
        const userData = JSON.parse(sessionUser)
        // Update the auth store
        const authStore = useAuthStore()
        authStore.setAuth(userData, sessionToken)
        // Sync to localStorage
        localStorage.setItem('auth_token', sessionToken)
        localStorage.setItem('auth_user', sessionUser)
        // Re-check authentication
        if (authService.isAuthenticated()) {
          console.log('Auth recovered successfully')
          next()
          return
        }
      } catch (error) {
        console.error('Failed to recover auth from sessionStorage:', error)
      }
    } else if (localToken && localUser) {
      console.log('Recovering auth from localStorage')
      try {
        const userData = JSON.parse(localUser)
        // Update the auth store
        const authStore = useAuthStore()
        authStore.setAuth(userData, localToken)
        // Sync to sessionStorage
        sessionStorage.setItem('access_token', localToken)
        sessionStorage.setItem('user', localUser)
        const expiryTime = Date.now() + 60 * 60 * 1000 // 1 hour default
        sessionStorage.setItem('token_expiry', expiryTime.toString())
        // Re-check authentication
        if (authService.isAuthenticated()) {
          console.log('Auth recovered successfully')
          next()
          return
        }
      } catch (error) {
        console.error('Failed to recover auth from localStorage:', error)
      }
    }
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Redirecting to login because not authenticated')
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'home' })
    return
  }

  // Check if route requires admin role
  if (to.meta.requiresAdmin && user?.userType !== 'admin') {
    next({ name: 'home' })
    return
  }

  // Check if route requires instructor role or higher
  if (to.meta.requiresInstructor && !['admin', 'instructor'].includes(user?.userType || '')) {
    next({ name: 'home' })
    return
  }

  // Check if route requires approved instructor (for course application)
  if (to.meta.requiresInstructor && user?.userType === 'instructor') {
    const authStore = useAuthStore()
    // 如果講師狀態還沒檢查，先檢查
    if (!authStore.instructorStatus) {
      await authStore.checkInstructorStatus()
    }

    // 檢查是否為已批准的講師
    if (!authStore.isApprovedInstructor) {
      console.log('User is instructor but not approved, redirecting to home')
      next({ name: 'home' })
      return
    }
  }

  // Check if route requires employer role or higher
  if (
    to.meta.requiresEmployer &&
    !['admin', 'instructor', 'employer'].includes(user?.userType || '')
  ) {
    next({ name: 'home' })
    return
  }

  // Check if route requires job seeker role (基本用戶權限)
  if (to.meta.requiresJobSeeker && user?.userType !== 'job_seeker') {
    next({ name: 'home' })
    return
  }

  next()
})

// SEO meta tags management
router.afterEach(to => {
  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Update meta description
  const descriptionMeta = document.querySelector('meta[name="description"]')
  if (descriptionMeta && to.meta.description) {
    descriptionMeta.setAttribute('content', to.meta.description as string)
  }

  // Update meta keywords
  const keywordsMeta = document.querySelector('meta[name="keywords"]')
  if (keywordsMeta && to.meta.keywords) {
    keywordsMeta.setAttribute('content', to.meta.keywords as string)
  }

  // Update Open Graph meta tags
  const ogTitleMeta = document.querySelector('meta[property="og:title"]')
  if (ogTitleMeta && to.meta.title) {
    ogTitleMeta.setAttribute('content', to.meta.title as string)
  }

  const ogDescriptionMeta = document.querySelector('meta[property="og:description"]')
  if (ogDescriptionMeta && to.meta.description) {
    ogDescriptionMeta.setAttribute('content', to.meta.description as string)
  }

  // Update canonical URL
  const canonicalLink = document.querySelector('link[rel="canonical"]')
  if (canonicalLink) {
    canonicalLink.setAttribute('href', `https://pharmacy-academy.com${to.fullPath}`)
  }
})

export default router
