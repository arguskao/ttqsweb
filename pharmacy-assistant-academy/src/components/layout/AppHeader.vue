<template>
  <nav class="navbar is-primary" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <router-link to="/" class="navbar-item">
        <strong>藥助Next學院</strong>
      </router-link>

      <a
        role="button"
        class="navbar-burger"
        :class="{ 'is-active': isMenuOpen }"
        aria-label="menu"
        aria-expanded="false"
        @click="toggleMenu"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
      <div class="navbar-start">
        <router-link to="/courses" class="navbar-item">課程</router-link>
        <router-link to="/jobs" class="navbar-item">就業媒合</router-link>
        <router-link to="/documents" class="navbar-item">文件下載</router-link>
      </div>

      <div class="navbar-end">
        <!-- Guest menu -->
        <div v-if="!isAuthenticated" class="navbar-item">
          <div class="buttons">
            <router-link to="/register" class="button is-primary">
              <strong>註冊</strong>
            </router-link>
            <router-link to="/login" class="button is-light">登入</router-link>
          </div>
        </div>

        <!-- Authenticated user menu -->
        <div v-else class="navbar-item has-dropdown" :class="{ 'is-active': isUserMenuOpen }">
          <a class="navbar-link" @click="toggleUserMenu">
            <span class="icon">
              <i class="fas fa-user"></i>
            </span>
            <span>{{ currentUser?.firstName }} {{ currentUser?.lastName }}</span>
          </a>

          <div class="navbar-dropdown is-right">
            <router-link to="/profile" class="navbar-item" @click="closeMenus">
              <span class="icon">
                <i class="fas fa-user-circle"></i>
              </span>
              <span>個人資料</span>
            </router-link>
            
            <router-link
              v-if="currentUser?.userType === 'job_seeker'"
              to="/learning-progress"
              class="navbar-item"
              @click="closeMenus"
            >
              <span class="icon">
                <i class="fas fa-chart-line"></i>
              </span>
              <span>學習進度</span>
            </router-link>
            
            <router-link
              v-if="currentUser?.userType === 'employer'"
              to="/employer/jobs"
              class="navbar-item"
              @click="closeMenus"
            >
              <span class="icon">
                <i class="fas fa-briefcase"></i>
              </span>
              <span>職缺管理</span>
            </router-link>
            
            <hr class="navbar-divider" />
            
            <a class="navbar-item" @click="handleLogout">
              <span class="icon">
                <i class="fas fa-sign-out-alt"></i>
              </span>
              <span>登出</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth-service'

const router = useRouter()

// Menu state
const isMenuOpen = ref(false)
const isUserMenuOpen = ref(false)

// Authentication state
const isAuthenticated = computed(() => authService.isAuthenticated())
const currentUser = computed(() => authService.getCurrentUser())

// Menu functions
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  isUserMenuOpen.value = false
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
  isMenuOpen.value = false
}

const closeMenus = () => {
  isMenuOpen.value = false
  isUserMenuOpen.value = false
}

// Logout function
const handleLogout = async () => {
  try {
    await authService.logout()
    closeMenus()
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
    // Force logout even if API call fails
    router.push('/')
  }
}

// Close menus when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.navbar-item.has-dropdown')) {
    isUserMenuOpen.value = false
  }
  if (!target.closest('.navbar-burger') && !target.closest('.navbar-menu')) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navbar-item.has-dropdown .navbar-link {
  cursor: pointer;
}

.navbar-dropdown {
  min-width: 200px;
}

.navbar-item .icon {
  margin-right: 0.5rem;
}
</style>
