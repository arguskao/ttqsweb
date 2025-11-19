<template>
  <nav class="navbar responsive-nav" role="navigation" aria-label="主導航">
    <div class="navbar-brand">
      <RouterLink to="/" class="navbar-item">
        <img src="/logo.svg" alt="藥助Next學院" class="logo" loading="eager" />
        <span class="brand-text">藥助Next學院</span>
      </RouterLink>

      <!-- 移動端漢堡菜單 -->
      <button
        class="navbar-burger"
        :class="{ 'is-active': isMenuOpen }"
        @click="toggleMenu"
        aria-label="切換導航菜單"
        aria-expanded="false"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <div class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
      <div class="navbar-start">
        <RouterLink to="/courses" class="navbar-item">
          <span class="icon"> 📚 </span>
          <span>課程</span>
        </RouterLink>

        <RouterLink to="/jobs" class="navbar-item">
          <span class="icon"> 💼 </span>
          <span>工作機會</span>
        </RouterLink>

        <RouterLink to="/instructors" class="navbar-item">
          <span class="icon"> 👨‍🏫 </span>
          <span>講師</span>
        </RouterLink>

        <RouterLink to="/documents" class="navbar-item">
          <span class="icon"> 📄 </span>
          <span>文件</span>
        </RouterLink>
      </div>

      <div class="navbar-end">
        <div v-if="!isAuthenticated" class="navbar-item">
          <div class="buttons">
            <RouterLink to="/login" class="button is-light"> 登入 </RouterLink>
            <RouterLink to="/register" class="button is-primary"> 註冊 </RouterLink>
          </div>
        </div>

        <div v-else class="navbar-item has-dropdown is-hoverable">
          <a class="navbar-link">
            <span class="icon"> 👤 </span>
            <span>{{ user?.firstName }} {{ user?.lastName }}</span>
          </a>

          <div class="navbar-dropdown">
            <RouterLink to="/profile" class="navbar-item">
              <span class="icon"> 👤 </span>
              <span>個人資料</span>
            </RouterLink>

            <RouterLink v-if="isJobSeeker" to="/learning-progress" class="navbar-item">
              <span class="icon"> 📈 </span>
              <span>學習進度</span>
            </RouterLink>

            <RouterLink v-if="isEmployer || isInstructor" to="/employer/jobs" class="navbar-item">
              <span class="icon"> 💼 </span>
              <span>我的職缺</span>
            </RouterLink>

            <!-- 講師專用功能 -->
            <RouterLink
              v-if="isApprovedInstructor"
              to="/instructor/course-application"
              class="navbar-item"
            >
              <span class="icon"> 👨‍🏫 </span>
              <span>申請開課</span>
            </RouterLink>

            <!-- 管理員專用功能 -->
            <RouterLink v-if="isAdmin" to="/admin/instructor-applications" class="navbar-item">
              <span class="icon"> 👨‍🏫 </span>
              <span>講師申請審核</span>
            </RouterLink>
            <RouterLink v-if="isAdmin" to="/admin/experiences" class="navbar-item">
              <span class="icon"> ⭐ </span>
              <span>經驗分享管理</span>
            </RouterLink>

            <RouterLink v-if="isAdmin" to="/admin/course-applications" class="navbar-item">
              <span class="icon"> 📚 </span>
              <span>課程申請審核</span>
            </RouterLink>

            <RouterLink v-if="isAdmin" to="/admin/training-plans" class="navbar-item">
              <span class="icon"> 📋 </span>
              <span>訓練計劃</span>
            </RouterLink>

            <RouterLink v-if="isAdmin" to="/admin/analytics" class="navbar-item">
              <span class="icon"> 📊 </span>
              <span>數據分析</span>
            </RouterLink>

            <hr class="navbar-divider" />

            <a class="navbar-item" @click="handleLogout">
              <span class="icon"> 🚪 </span>
              <span>登出</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'

import { authService } from '@/services/auth-service-enhanced'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isMenuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)
const isJobSeeker = computed(() => authStore.isJobSeeker)
const isEmployer = computed(() => authStore.isEmployer)
const isInstructor = computed(() => authStore.isInstructor)
const isAdmin = computed(() => authStore.user?.userType === 'admin')
const isApprovedInstructor = computed(() => authStore.isApprovedInstructor)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// 監聽用戶變化，重新檢查講師狀態
watch(
  () => user.value?.id,
  async newUserId => {
    if (newUserId) {
      await authStore.checkInstructorStatus()
    } else {
      authStore.clearInstructorStatus()
    }
  },
  { immediate: true }
)

const handleLogout = async () => {
  try {
    await authService.logout()
    closeMenu()
    router.push('/')
  } catch (error) {
    console.error('登出失敗:', error)
  }
}

// 點擊外部關閉菜單
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.navbar')) {
    closeMenu()
  }
}

// 監聽點擊事件
document.addEventListener('click', handleClickOutside)
</script>

<style lang="scss" scoped>
@import '@/assets/responsive.scss';

.navbar {
  @include responsive-nav;

  .logo {
    height: 32px;
    width: auto;
    margin-right: 0.5rem;
  }

  .brand-text {
    font-weight: bold;
    font-size: 1.2rem;
  }

  .navbar-item {
    @include touch-friendly-button;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .icon {
      width: 1rem;
      height: 1rem;
    }
  }

  .navbar-burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 44px;
    height: 44px;
    background: transparent;
    border: none;
    cursor: pointer;

    span {
      display: block;
      width: 20px;
      height: 2px;
      background: #333;
      margin: 2px 0;
      transition: all 0.3s ease;
    }

    &.is-active {
      span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }

      span:nth-child(2) {
        opacity: 0;
      }

      span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
    }
  }

  .navbar-dropdown {
    @include mobile {
      position: static;
      box-shadow: none;
      background: transparent;
      padding: 0;

      .navbar-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  .buttons {
    @include mobile {
      flex-direction: column;
      width: 100%;
      gap: 0.5rem;

      .button {
        width: 100%;
      }
    }
  }
}

// 深色模式支持
@include dark-mode {
  .navbar {
    background: #1a1a1a;
    color: #fff;

    .navbar-item {
      color: #fff;

      &:hover {
        background: #333;
      }
    }

    .navbar-burger span {
      background: #fff;
    }
  }
}

// 高對比度模式
@include high-contrast {
  .navbar {
    border-bottom: 2px solid #000;

    .navbar-item {
      border: 1px solid transparent;

      &:hover,
      &:focus {
        border-color: #000;
      }
    }
  }
}

// 減少動畫偏好
@include reduced-motion {
  .navbar-burger span {
    transition: none;
  }

  .navbar-menu {
    transition: none;
  }
}
</style>
