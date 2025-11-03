<template>
  <div class="simple-course-detail">
    <h1>簡單課程詳情測試頁面</h1>
    <p>如果你能看到這個頁面，說明路由是正常的</p>
    <p>課程 ID: {{ $route.params.id }}</p>
    <p>組件載入時間: {{ loadTime }}</p>
    <router-link to="/courses">返回課程列表</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const loadTime = ref('')

onMounted(() => {
  loadTime.value = new Date().toLocaleTimeString()
  console.log('🟢 SimpleCourseDetailView mounted at:', loadTime.value)
  
  // 設置一個定時器來檢查組件是否還在
  const timer = setInterval(() => {
    console.log('🟢 SimpleCourseDetailView still alive at:', new Date().toLocaleTimeString())
  }, 1000)
  
  // 5秒後清除定時器
  setTimeout(() => {
    clearInterval(timer)
  }, 5000)
})

onUnmounted(() => {
  console.log('🔴 SimpleCourseDetailView unmounted at:', new Date().toLocaleTimeString())
})
</script>

<style scoped>
.simple-course-detail {
  padding: 20px;
  text-align: center;
}
</style>