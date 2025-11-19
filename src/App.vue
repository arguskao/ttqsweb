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
    <AppHeader />
    <main class="main-content">
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

.main-content {
  flex: 1;
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
