<template>
  <div class="course-messages-view">
    <section class="section">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-four-fifths">
            <!-- Header -->
            <div class="mb-5">
              <h1 class="title is-2">課程訊息</h1>
              <p class="subtitle">查看講師發送的訊息</p>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="has-text-centered py-6">
              <button class="button is-loading is-large is-white" disabled>載入中...</button>
            </div>

            <!-- Error State -->
            <div v-else-if="errorMessage" class="notification is-danger">
              <button class="delete" @click="errorMessage = ''"></button>
              {{ errorMessage }}
            </div>

            <!-- Messages List -->
            <div v-else>
              <div v-if="messages.length === 0" class="box has-text-centered py-6">
                <p class="title is-5">目前沒有訊息</p>
                <p class="subtitle">講師尚未發送任何訊息</p>
              </div>

              <div v-else>
                <div v-for="message in messages" :key="message.id" class="box mb-4">
                  <article class="media">
                    <div class="media-left">
                      <figure class="image is-48x48">
                        <div 
                          class="has-background-primary has-text-white is-flex is-align-items-center is-justify-content-center" 
                          style="width: 48px; height: 48px; border-radius: 50%;"
                        >
                          <span class="is-size-5">{{ message.senderName.charAt(0) }}</span>
                        </div>
                      </figure>
                    </div>
                    <div class="media-content">
                      <div class="content">
                        <div class="level is-mobile mb-2">
                          <div class="level-left">
                            <div class="level-item">
                              <strong>{{ message.senderName }}</strong>
                              <span v-if="message.isBroadcast" class="tag is-info is-light ml-2">
                                <span class="icon is-small">
                                  <i class="fas fa-bullhorn"></i>
                                </span>
                                <span>群發訊息</span>
                              </span>
                            </div>
                          </div>
                          <div class="level-right">
                            <div class="level-item">
                              <small class="has-text-grey">{{ formatDate(message.createdAt) }}</small>
                            </div>
                          </div>
                        </div>
                        <p class="title is-5 mb-2">{{ message.subject }}</p>
                        <p style="white-space: pre-wrap;">{{ message.message }}</p>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '@/services/api'

const route = useRoute()

// State
const isLoading = ref(true)
const errorMessage = ref('')
const messages = ref<any[]>([])

// Methods
const loadMessages = async () => {
  const courseId = route.params.courseId

  if (!courseId) {
    errorMessage.value = '無效的課程 ID'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await api.get(`/courses/${courseId}/messages`)

    if (response.data?.success) {
      messages.value = response.data.data || []
    } else {
      errorMessage.value = response.data?.message || '載入訊息失敗'
    }
  } catch (error: any) {
    console.error('載入訊息失敗:', error)
    errorMessage.value = error.response?.data?.message || '載入訊息失敗'
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW')
}

// Lifecycle
onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.media {
  align-items: flex-start;
}
</style>
