import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { authService } from '@/services/auth-service'

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
        description: '藥助Next學院提供專業的藥局助理轉職訓練課程，結合職能導向教學、實務操作與就業媒合服務，幫助您成功進入醫藥產業。',
        keywords: '藥局助理,轉職訓練,醫藥教育,就業媒合,藥學課程'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: {
        requiresGuest: true,
        title: '登入 - 藥助Next學院',
        description: '登入藥助Next學院，開始您的藥局助理轉職之旅。'
      }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: {
        requiresGuest: true,
        title: '註冊 - 藥助Next學院',
        description: '註冊藥助Next學院帳號，選擇求職者或雇主身份，開始使用我們的服務。'
      }
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('../views/courses/CoursesView.vue'),
      meta: {
        requiresAuth: true,
        title: '課程列表 - 藥助Next學院',
        description: '瀏覽藥助Next學院的專業課程，包含基礎職能、進階實務和實習機會。',
        keywords: '藥學課程,職能訓練,實務課程,藥局助理培訓'
      }
    },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: () => import('../views/courses/CourseDetailView.vue'),
      meta: {
        title: '課程詳情 - 藥助Next學院',
        description: '查看課程詳細資訊，包含課程大綱、講師介紹和學習目標。'
      }
    },
    {
      path: '/learning-progress',
      name: 'learning-progress',
      component: () => import('../views/courses/LearningProgressView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: () => import('../views/jobs/JobsView.vue'),
    },
    {
      path: '/jobs/:id',
      name: 'job-detail',
      component: () => import('../views/jobs/JobDetailView.vue'),
    },
    {
      path: '/employer/jobs',
      name: 'employer-jobs',
      component: () => import('../views/jobs/EmployerJobsView.vue'),
      meta: { requiresAuth: true, requiresEmployer: true }
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('../views/DocumentsView.vue'),
    },
    {
      path: '/instructors',
      name: 'instructors',
      component: () => import('../views/instructor/InstructorsView.vue'),
    },
    {
      path: '/instructors/:id',
      name: 'instructor-detail',
      component: () => import('../views/instructor/InstructorDetailView.vue'),
    },
    {
      path: '/instructor/profile',
      name: 'instructor-profile',
      component: () => import('../views/instructor/InstructorProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/profile/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/learning-history',
      name: 'learning-history',
      component: () => import('../views/profile/LearningHistoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/application-history',
      name: 'application-history',
      component: () => import('../views/profile/ApplicationHistoryView.vue'),
      meta: { requiresAuth: true, requiresJobSeeker: true }
    },
    {
      path: '/admin/instructor-applications',
      name: 'admin-instructor-applications',
      component: () => import('../views/admin/InstructorApplicationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/analytics',
      name: 'admin-analytics',
      component: () => import('../views/admin/AnalyticsDashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/ttqs',
      name: 'admin-ttqs',
      component: () => import('../views/admin/TTQSDashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/training-plans',
      name: 'admin-training-plans',
      component: () => import('../views/admin/TrainingPlansView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUser()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'home' })
    return
  }

  // Check if route requires employer role
  if (to.meta.requiresEmployer && user?.userType !== 'employer') {
    next({ name: 'home' })
    return
  }

  // Check if route requires job seeker role
  if (to.meta.requiresJobSeeker && user?.userType !== 'job_seeker') {
    next({ name: 'home' })
    return
  }

  next()
})

// SEO meta tags management
router.afterEach((to) => {
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
