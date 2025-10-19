import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { authService } from '@/services/auth-service'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('../views/courses/CoursesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: () => import('../views/courses/CourseDetailView.vue'),
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
      meta: { requiresAuth: true }
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('../views/DocumentsView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/profile/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated()

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

  next()
})

export default router
