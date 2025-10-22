<template>
  <div class="container">
    <section class="section">
      <!-- Back Button -->
      <div class="mb-4">
        <router-link to="/community/forum" class="button is-light">
          <span class="icon">
            <i class="fas fa-arrow-left"></i>
          </span>
          <span>返回討論區</span>
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <!-- Topic Content -->
      <div v-else-if="topic">
        <!-- Topic Header -->
        <div class="box mb-4">
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <div>
                  <h1 class="title">{{ topic.title }}</h1>
                  <p class="subtitle is-6">
                    <span class="tag" :class="getCategoryClass(topic.category)">
                      {{ getCategoryLabel(topic.category) }}
                    </span>
                    <span v-if="topic.isPinned" class="tag is-warning ml-2">
                      <i class="fas fa-thumbtack"></i>
                      置頂
                    </span>
                    <span v-if="topic.isLocked" class="tag is-danger ml-2">
                      <i class="fas fa-lock"></i>
                      已鎖定
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <div class="has-text-right">
                  <p class="heading">瀏覽</p>
                  <p class="title is-5">{{ topic.viewCount }}</p>
                </div>
              </div>
              <div class="level-item">
                <div class="has-text-right">
                  <p class="heading">回覆</p>
                  <p class="title is-5">{{ topic.replyCount }}</p>
                </div>
              </div>
            </div>
          </div>

          <hr />

          <!-- Topic Author Info -->
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <figure class="image is-48x48">
                  <img :src="`https://ui-avatars.com/api/?name=${topic.authorName}`" alt="avatar" />
                </figure>
                <div class="ml-3">
                  <p class="heading">{{ topic.authorName }}</p>
                  <p class="title is-6">{{ formatDate(topic.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Topic Content -->
          <div class="content mt-4">
            <p>{{ topic.content }}</p>
          </div>
        </div>

        <!-- Replies Section -->
        <div class="mb-4">
          <h2 class="title is-4">回覆 ({{ topic.replyCount }})</h2>

          <div v-if="replies.length === 0" class="notification is-info">
            <p>目前沒有回覆</p>
          </div>

          <div v-else>
            <div v-for="reply in replies" :key="reply.id" class="box mb-3">
              <div class="level">
                <div class="level-left">
                  <div class="level-item">
                    <figure class="image is-40x40">
                      <img
                        :src="`https://ui-avatars.com/api/?name=${reply.authorName}`"
                        alt="avatar"
                      />
                    </figure>
                    <div class="ml-3">
                      <p class="heading">{{ reply.authorName }}</p>
                      <p class="title is-6">{{ formatDate(reply.createdAt) }}</p>
                    </div>
                  </div>
                </div>
                <div class="level-right">
                  <div class="level-item">
                    <button
                      class="button is-small"
                      :class="{ 'is-loading': likeStates[reply.id] }"
                      @click="likeReply(reply.id)"
                    >
                      <span class="icon is-small">
                        <i class="fas fa-thumbs-up"></i>
                      </span>
                      <span>{{ reply.likeCount }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="content mt-3">
                <p>{{ reply.content }}</p>
              </div>

              <div v-if="reply.isSolution" class="notification is-success is-light">
                <p>
                  <span class="icon">
                    <i class="fas fa-check-circle"></i>
                  </span>
                  <span>最佳解答</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reply Form -->
        <div v-if="!topic.isLocked" class="box">
          <h3 class="title is-5">發表回覆</h3>

          <div class="field">
            <label class="label">您的回覆</label>
            <div class="control">
              <textarea
                v-model="newReply.content"
                class="textarea"
                placeholder="輸入您的回覆內容"
                rows="6"
              ></textarea>
            </div>
          </div>

          <div class="field is-grouped">
            <div class="control">
              <button
                class="button is-primary"
                @click="submitReply"
                :disabled="isSubmitting || !newReply.content"
              >
                {{ isSubmitting ? '提交中...' : '提交回覆' }}
              </button>
            </div>
            <div class="control">
              <button class="button is-light" @click="newReply.content = ''">清除</button>
            </div>
          </div>
        </div>

        <div v-else class="notification is-warning">
          <p>該主題已被鎖定，無法發表新回覆</p>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else class="notification is-danger">
        <p>討論主題不存在</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { apiService } from '@/services/api-enhanced'

interface Topic {
  id: number
  title: string
  content: string
  category: string
  groupId?: number
  authorId: number
  authorName: string
  createdAt: string
  updatedAt?: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  replyCount: number
}

interface Reply {
  id: number
  content: string
  authorName: string
  createdAt: string
  isSolution: boolean
  likeCount: number
}

const route = useRoute()
const topicId = Number(route.params.id)

const topic = ref<Topic | null>(null)
const replies = ref<Reply[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const likeStates = ref<Record<number, boolean>>({})

const newReply = ref({
  content: ''
})

const loadTopic = async () => {
  loading.value = true
  try {
    const response = await apiService.get<any>(`/forum/topics/${topicId}`)

    if (response.success && response.data) {
      // 後端返回的數據結構是直接包含主題和回覆
      topic.value = {
        id: response.data.id,
        title: response.data.title,
        content: response.data.content,
        category: response.data.category,
        groupId: response.data.group_id,
        authorId: response.data.author_id,
        authorName: response.data.author_name || '匿名用戶',
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        viewCount: response.data.view_count ?? 0,
        replyCount: response.data.replies?.length ?? 0,
        isPinned: response.data.is_pinned || false,
        isLocked: response.data.is_locked || false
      }
      replies.value = response.data.replies ?? []
    }
  } catch (error) {
    console.error('載入討論主題失敗:', error)
  } finally {
    loading.value = false
  }
}

const submitReply = async () => {
  if (!newReply.value.content.trim()) {
    alert('請輸入回覆內容')
    return
  }

  isSubmitting.value = true
  try {
    const response = await apiService.post<Reply>(`/topics/${topicId}/replies`, {
      content: newReply.value.content
    })

    if (response.success && response.data) {
      replies.value.push(response.data)
      newReply.value.content = ''
      if (topic.value) {
        topic.value.replyCount += 1
      }
      alert('回覆成功！')
    }
  } catch (error) {
    console.error('提交回覆失敗:', error)
    alert('提交回覆失敗，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

const likeReply = async (replyId: number) => {
  likeStates.value[replyId] = true
  try {
    // 這裡可以添加按讚的 API 調用
    const reply = replies.value.find(r => r.id === replyId)
    if (reply) {
      reply.likeCount += 1
    }
  } catch (error) {
    console.error('按讚失敗:', error)
  } finally {
    likeStates.value[replyId] = false
  }
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    question: '提問',
    discussion: '討論',
    announcement: '公告',
    resource: '資源分享'
  }
  return labels[category] || category
}

const getCategoryClass = (category: string) => {
  const classes: Record<string, string> = {
    question: 'is-info',
    discussion: 'is-primary',
    announcement: 'is-warning',
    resource: 'is-success'
  }
  return classes[category] ?? ''
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

onMounted(() => {
  loadTopic()
})
</script>

<style scoped>
.box {
  transition: box-shadow 0.3s ease;
}

.box:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content {
  line-height: 1.6;
}
</style>
