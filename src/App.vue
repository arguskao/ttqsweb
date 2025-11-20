<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import ToastContainer from './components/common/ToastContainer.vue'
import { toast } from './utils/toast'

const route = useRoute()
const toastContainerRef = ref()

// 計算需要緩存的視圖
const cachedViews = computed(() => {
  return route.meta?.keepAlive ? [route.name as string] : []
})

// 設置 Toast 容器
onMounted(() => {
  if (toastContainerRef.value) {
    toast.setContainer(toastContainerRef.value)
  }
})
</script>

<template>
  <div id="app">
    <!-- 跳過導航連結 (無障礙功能) -->
    <a href="#main-content" class="skip-link">跳至主要內容</a>

    <AppHeader />

    <main id="main-content" class="main-content" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="cachedViews">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <AppFooter />
    <ToastContainer ref="toastContainerRef" />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 跳過導航連結樣式 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #00d1b2;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
  font-weight: 600;
  border-radius: 0 0 4px 0;
}

.skip-link:focus {
  top: 0;
}

.main-content {
  flex: 1;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.main-content:focus {
  outline: none;
}
</style>
