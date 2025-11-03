<template>
  <div class="api-test-view">
    <section class="section">
      <div class="container">
        <h1 class="title">API 連接測試</h1>
        
        <div class="box">
          <h2 class="subtitle">環境資訊</h2>
          <p><strong>模式:</strong> {{ mode }}</p>
          <p><strong>API Base URL:</strong> {{ apiBaseUrl }}</p>
          <p><strong>當前 URL:</strong> {{ currentUrl }}</p>
        </div>

        <div class="box">
          <h2 class="subtitle">課程 API 測試</h2>
          <button 
            class="button is-primary" 
            :class="{ 'is-loading': loading }" 
            @click="testCoursesApi"
          >
            測試課程 API
          </button>
          
          <div v-if="result" class="mt-4">
            <h3 class="subtitle is-5">測試結果:</h3>
            <pre class="has-background-light p-4">{{ JSON.stringify(result, null, 2) }}</pre>
          </div>
          
          <div v-if="error" class="notification is-danger mt-4">
            <h3 class="subtitle is-5">錯誤:</h3>
            <pre>{{ error }}</pre>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiService } from '@/services/api-enhanced'

const loading = ref(false)
const result = ref<any>(null)
const error = ref<string | null>(null)

const mode = computed(() => import.meta.env.MODE)
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL || '/api/v1')
const currentUrl = computed(() => window.location.href)

const testCoursesApi = async () => {
  loading.value = true
  result.value = null
  error.value = null
  
  try {
    console.log('開始測試課程 API...')
    const response = await apiService.get('/courses')
    console.log('API 響應:', response)
    result.value = response
  } catch (err: any) {
    console.error('API 測試失敗:', err)
    error.value = err.message || '未知錯誤'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}
</style>