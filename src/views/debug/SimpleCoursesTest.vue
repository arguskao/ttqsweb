<template>
  <div class="simple-test">
    <h1>簡單課程測試</h1>
    
    <div class="test-info">
      <p><strong>頁面載入狀態:</strong> {{ mounted ? '已載入' : '載入中' }}</p>
      <p><strong>API 測試狀態:</strong> {{ apiStatus }}</p>
      <p><strong>課程數量:</strong> {{ courses.length }}</p>
    </div>
    
    <button @click="testApi" class="test-button">測試 API</button>
    
    <div v-if="error" class="error">
      <h3>錯誤:</h3>
      <pre>{{ error }}</pre>
    </div>
    
    <div v-if="courses.length > 0" class="courses">
      <h3>課程列表:</h3>
      <ul>
        <li v-for="course in courses" :key="course.id">
          {{ course.title }} ({{ course.course_type }})
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const mounted = ref(false)
const apiStatus = ref('未測試')
const courses = ref<any[]>([])
const error = ref<string | null>(null)

const testApi = async () => {
  apiStatus.value = '測試中...'
  error.value = null
  
  try {
    console.log('開始測試 API...')
    const response = await fetch('/api/v1/courses')
    console.log('API 響應狀態:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('API 數據:', data)
      
      if (data.success && data.data) {
        courses.value = data.data
        apiStatus.value = `成功 - 獲取到 ${data.data.length} 個課程`
      } else {
        apiStatus.value = '失敗 - 數據格式錯誤'
        error.value = JSON.stringify(data, null, 2)
      }
    } else {
      apiStatus.value = `失敗 - HTTP ${response.status}`
      error.value = await response.text()
    }
  } catch (err: any) {
    console.error('API 測試錯誤:', err)
    apiStatus.value = '失敗 - 網絡錯誤'
    error.value = err.message
  }
}

onMounted(() => {
  mounted.value = true
  console.log('SimpleCoursesTest 組件已載入')
  // 自動測試 API
  testApi()
})
</script>

<style scoped>
.simple-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-info {
  background: #f5f5f5;
  padding: 15px;
  margin: 15px 0;
  border-radius: 5px;
}

.test-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px 0;
}

.test-button:hover {
  background: #0056b3;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  margin: 15px 0;
  border-radius: 5px;
  border: 1px solid #f5c6cb;
}

.courses {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  margin: 15px 0;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
}

.courses ul {
  margin: 10px 0;
  padding-left: 20px;
}

.courses li {
  margin: 5px 0;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>