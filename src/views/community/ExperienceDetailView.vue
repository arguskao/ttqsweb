<template>
  <div class="container">
    <section class="section">
      <!-- Back Button -->
      <div class="mb-4">
        <router-link to="/community/experiences" class="button is-light">
          <span class="icon">
            <span>⬅️</span>
          </span>
          <span>返回經驗分享列表</span>
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <!-- Experience Content -->
      <div v-else-if="experience">
        <!-- Experience Header -->
        <div class="box mb-4">
          <h1 class="title">{{ experience.title }}</h1>
          <p class="subtitle is-6">
            <span class="tag" :class="getTypeClass(experience.share_type)">
              {{ getTypeLabel(experience.share_type) }}
            </span>
          </p>
          <div class="tags mt-2">
            <span v-for="tag in experience.tags" :key="tag" class="tag is-light">{{ tag }}</span>
          </div>
          <p class="has-text-grey-light mt-2">
            由 <strong>{{ experience.authorName || '匿名用戶' }}</strong> 分享於
            {{ formatDate(experience.created_at) }}
          </p>
          <div class="level is-mobile mt-3">
            <div class="level-left">
              <span class="level-item">
                <span class="icon is-small">
                  <span>👁️</span>
                </span>
                <span>{{ experience.view_count }}</span>
              </span>
              <a class="level-item" @click="likeExperience">
                <span class="icon is-small">
                  <span>❤️</span>
                </span>
                <span>{{ experience.like_count }}</span>
              </a>
              <span class="level-item">
                <span class="icon is-small">
                  <span>💬</span>
                </span>
                <span>{{ experience.comment_count }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Experience Content -->
        <div class="box mb-4">
          <div class="content" v-html="formatContent(experience.content)"></div>
        </div>

        <!-- Comments Section -->
        <div class="box">
          <h2 class="title is-4">評論 ({{ experience.comments?.length || 0 }})</h2>

          <!-- Add Comment Form -->
          <article class="media mb-5">
            <div class="media-content">
              <div class="field">
                <p class="control">
                  <textarea
                    v-model="newComment"
                    class="textarea"
                    placeholder="發表您的評論..."
                    rows="3"
                  ></textarea>
                </p>
              </div>
              <div class="field">
                <p class="control">
                  <button
                    class="button is-primary"
                    @click="submitComment"
                    :disabled="!newComment.trim() || isSubmitting"
                  >
                    {{ isSubmitting ? '發送中...' : '發表評論' }}
                  </button>
                </p>
              </div>
            </div>
          </article>

          <!-- Comments List -->
          <div v-if="experience.comments && experience.comments.length > 0">
            <article
              v-for="comment in experience.comments"
              :key="comment.id"
              class="media mb-4"
            >
              <div class="media-content">
                <div class="content">
                  <p>
                    <strong>{{ comment.authorName || '匿名用戶' }}</strong>
                    <small class="has-text-grey-light">{{
                      formatDate(comment.created_at)
                    }}</small>
                    <br />
                    {{ comment.content }}
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="notification is-info is-light">
            <p>目前還沒有評論，成為第一個發表評論的人吧！</p>
          </div>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else class="notification is-danger">
        <p>經驗分享不存在</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { apiService } from '@/services/api'

const route = useRoute()
const experienceId = Number(route.params.id)

const experience = ref<any>(null)
const loading = ref(false)
const newComment = ref('')
const isSubmitting = ref(false)

const loadExperience = async () => {
  loading.value = true
  try {
    const response = await apiService.get(`/experiences/${experienceId}`)
    if (response.success && response.data) {
      experience.value = response.data
    }
  } catch (error) {
    console.error('載入經驗分享失敗:', error)
  } finally {
    loading.value = false
  }
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    job_experience: '工作經驗',
    interview: '面試經驗',
    learning_tips: '學習技巧',
    career_advice: '職涯建議',
    success_story: '成功故事'
  }
  return labels[type] || type
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    job_experience: 'is-info',
    interview: 'is-success',
    learning_tips: 'is-warning',
    career_advice: 'is-primary',
    success_story: 'is-danger'
  }
  return classes[type] ?? ''
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatContent = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

const likeExperience = async () => {
  try {
    await apiService.post(`/experiences/${experienceId}/like`)
    if (experience.value) {
      experience.value.like_count += 1
    }
  } catch (error) {
    console.error('按讚失敗:', error)
    alert('按讚失敗，請稍後再試')
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  isSubmitting.value = true
  try {
    await apiService.post(`/experiences/${experienceId}/comments`, {
      content: newComment.value
    })
    newComment.value = ''
    alert('評論發表成功！')
    loadExperience()
  } catch (error) {
    console.error('發表評論失敗:', error)
    alert('發表評論失敗，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadExperience()
})
</script>

<style scoped>
.content {
  white-space: pre-wrap;
}
</style>
