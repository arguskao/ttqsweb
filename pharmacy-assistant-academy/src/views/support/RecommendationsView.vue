<template>
  <div class="container">
    <section class="section">
      <h1 class="title">再培訓課程推薦</h1>
      <p class="subtitle">根據您的學習歷程，為您推薦適合的進階課程</p>

      <div class="box mb-4">
        <button class="button is-primary" @click="generateRecommendations">
          <span class="icon">
            <i class="fas fa-magic"></i>
          </span>
          <span>生成個性化推薦</span>
        </button>
      </div>

      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <div v-else-if="recommendations.length === 0" class="notification is-info">
        <p>目前沒有課程推薦，點擊上方按鈕生成個性化推薦</p>
      </div>

      <div v-else>
        <div v-for="rec in recommendations" :key="rec.id" class="box">
          <article class="media">
            <div class="media-content">
              <div class="content">
                <p>
                  <strong>{{ rec.courseTitle || '課程' }}</strong>
                  <span
                    class="tag ml-2"
                    :class="{
                      'is-danger': rec.priority === 'high',
                      'is-warning': rec.priority === 'medium',
                      'is-info': rec.priority === 'low'
                    }"
                  >
                    {{ getPriorityLabel(rec.priority) }}
                  </span>
                  <span
                    class="tag ml-2"
                    :class="{
                      'is-light': rec.status === 'pending',
                      'is-success': rec.status === 'accepted',
                      'is-danger': rec.status === 'declined',
                      'is-info': rec.status === 'completed'
                    }"
                  >
                    {{ getStatusLabel(rec.status) }}
                  </span>
                  <br />
                  <span class="has-text-grey-light">推薦時間：{{ formatDate(rec.recommendedAt) }}</span>
                  <br />
                  {{ rec.recommendationReason }}
                </p>
                <p v-if="rec.courseDescription" class="has-text-grey">
                  {{ rec.courseDescription }}
                </p>
              </div>
              <div v-if="rec.status === 'pending'" class="buttons">
                <button class="button is-success is-small" @click="acceptRecommendation(rec.id)">
                  接受推薦
                </button>
                <button class="button is-light is-small" @click="declineRecommendation(rec.id)">
                  暫不考慮
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const recommendations = ref<any[]>([])
const loading = ref(false)

const loadRecommendations = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/v1/recommendations/my-recommendations')
    recommendations.value = response.data.data
  } catch (error) {
    console.error('載入推薦失敗:', error)
  } finally {
    loading.value = false
  }
}

const generateRecommendations = async () => {
  loading.value = true
  try {
    await api.post('/api/v1/recommendations/generate')
    alert('已生成個性化推薦！')
    loadRecommendations()
  } catch (error) {
    console.error('生成推薦失敗:', error)
    alert('生成推薦失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}

const acceptRecommendation = async (id: number) => {
  try {
    await api.patch(`/api/v1/recommendations/${id}/accept`)
    alert('已接受推薦！您可以前往課程頁面報名')
    loadRecommendations()
  } catch (error) {
    alert('操作失敗')
  }
}

const declineRecommendation = async (id: number) => {
  try {
    await api.patch(`/api/v1/recommendations/${id}/decline`)
    loadRecommendations()
  } catch (error) {
    alert('操作失敗')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: '高優先級',
    medium: '中優先級',
    low: '低優先級'
  }
  return labels[priority] || priority
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待處理',
    accepted: '已接受',
    declined: '已拒絕',
    completed: '已完成'
  }
  return labels[status] || status
}

onMounted(() => {
  loadRecommendations()
})
</script>
