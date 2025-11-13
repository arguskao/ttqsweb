<template>
  <div class="message-center">
    <!-- 訊息圖示按鈕 -->
    <div class="message-icon" @click="toggleMessagePanel">
      <span class="icon is-large">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </span>
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </div>

    <!-- 訊息面板 -->
    <transition name="slide-fade">
      <div v-if="isOpen" class="message-panel">
        <div class="panel-header">
          <h3 class="title is-5">訊息中心</h3>
          <button class="delete" @click="closePanel"></button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="panel-body has-text-centered py-5">
          <div class="loader"></div>
          <p class="mt-3">載入中...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="panel-body">
          <div class="notification is-danger is-light">
            {{ error }}
          </div>
        </div>

        <!-- Messages List -->
        <div v-else class="panel-body">
          <div v-if="messages.length === 0" class="has-text-centered py-5">
            <p class="has-text-grey">目前沒有訊息</p>
          </div>

          <div v-else class="messages-list">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-item"
              :class="{ 'is-unread': !message.isRead }"
              @click="openMessage(message)"
            >
              <div class="message-header">
                <strong>{{ message.senderName }}</strong>
                <span class="message-time">{{ formatTime(message.createdAt) }}</span>
              </div>
              <div class="message-subject">{{ message.subject }}</div>
              <div class="message-preview">{{ truncate(message.message, 50) }}</div>
              <div class="message-course">
                <span class="tag is-light is-small">{{ message.courseTitle }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 訊息詳情 Modal -->
    <div class="modal" :class="{ 'is-active': selectedMessage }">
      <div class="modal-background" @click="closeMessage"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">{{ selectedMessage?.subject }}</p>
          <button class="delete" aria-label="close" @click="closeMessage"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedMessage">
            <div class="message-meta mb-4">
              <p><strong>發送者：</strong> {{ selectedMessage.senderName }}</p>
              <p><strong>課程：</strong> {{ selectedMessage.courseTitle }}</p>
              <p><strong>時間：</strong> {{ formatDateTime(selectedMessage.createdAt) }}</p>
            </div>
            <div class="message-content">
              <p style="white-space: pre-wrap;">{{ selectedMessage.message }}</p>
            </div>

            <!-- 回覆區域 -->
            <div class="reply-section mt-5">
              <h4 class="title is-6">回覆訊息</h4>
              <div class="field">
                <div class="control">
                  <textarea
                    v-model="replyText"
                    class="textarea"
                    placeholder="輸入您的回覆..."
                    rows="4"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-primary"
            :class="{ 'is-loading': sending }"
            :disabled="!replyText.trim() || sending"
            @click="sendReply"
          >
            發送回覆
          </button>
          <button class="button" @click="closeMessage">關閉</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// State
const isOpen = ref(false)
const loading = ref(false)
const error = ref('')
const messages = ref<any[]>([])
const selectedMessage = ref<any>(null)
const replyText = ref('')
const sending = ref(false)

// Computed
const unreadCount = computed(() => {
  return messages.value.filter(m => !m.isRead).length
})

// Methods
const toggleMessagePanel = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && messages.value.length === 0) {
    loadMessages()
  }
}

const closePanel = () => {
  isOpen.value = false
}

const loadMessages = async () => {
  if (!authStore.isAuthenticated) return

  loading.value = true
  error.value = ''

  try {
    // 獲取用戶所有課程的訊息
    const enrollmentsResponse = await api.get('/users/enrollments')
    const enrollments = enrollmentsResponse.data?.data || []

    const allMessages: any[] = []

    // 為每個已報名的課程獲取訊息
    for (const enrollment of enrollments) {
      try {
        const messagesResponse = await api.get(`/courses/${enrollment.courseId}/messages`)
        if (messagesResponse.data?.success) {
          const courseMessages = messagesResponse.data.data.map((msg: any) => ({
            ...msg,
            courseTitle: enrollment.courseTitle || '課程'
          }))
          allMessages.push(...courseMessages)
        }
      } catch (err) {
        console.error(`載入課程 ${enrollment.courseId} 的訊息失敗:`, err)
      }
    }

    // 按時間排序
    messages.value = allMessages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (err: any) {
    console.error('載入訊息失敗:', err)
    error.value = '載入訊息失敗'
  } finally {
    loading.value = false
  }
}

const openMessage = (message: any) => {
  selectedMessage.value = message
  // 標記為已讀
  if (!message.isRead) {
    markAsRead(message.id)
  }
}

const closeMessage = () => {
  selectedMessage.value = null
  replyText.value = ''
}

const markAsRead = async (messageId: number) => {
  try {
    // TODO: 實現標記已讀的 API
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.isRead = true
    }
  } catch (err) {
    console.error('標記已讀失敗:', err)
  }
}

const sendReply = async () => {
  if (!selectedMessage.value || !replyText.value.trim()) return

  sending.value = true

  try {
    // 發送回覆（作為新訊息發送給講師）
    await api.post(`/courses/${selectedMessage.value.courseId}/messages`, {
      subject: `Re: ${selectedMessage.value.subject}`,
      message: replyText.value,
      recipientId: selectedMessage.value.senderId,
      isBroadcast: false
    })

    alert('回覆已發送')
    replyText.value = ''
    closeMessage()
    loadMessages() // 重新載入訊息
  } catch (err: any) {
    console.error('發送回覆失敗:', err)
    alert(err.response?.data?.message || '發送回覆失敗')
  } finally {
    sending.value = false
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小時前`
  return '剛剛'
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW')
}

const truncate = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// 定期檢查新訊息
onMounted(() => {
  if (authStore.isAuthenticated) {
    loadMessages()
    // 每 30 秒檢查一次新訊息
    setInterval(loadMessages, 30000)
  }
})
</script>

<style scoped>
.message-center {
  position: relative;
}

.message-icon {
  position: relative;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.message-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #f14668;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
}

.message-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dbdbdb;
}

.panel-header .title {
  margin: 0;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.messages-list {
  padding: 0.5rem;
}

.message-item {
  padding: 1rem;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.message-item:hover {
  background-color: #f5f5f5;
}

.message-item.is-unread {
  background-color: #eff5fb;
  border-left: 3px solid #3273dc;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.message-time {
  font-size: 0.75rem;
  color: #7a7a7a;
}

.message-subject {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.message-preview {
  font-size: 0.875rem;
  color: #4a4a4a;
  margin-bottom: 0.5rem;
}

.message-course {
  margin-top: 0.5rem;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3273dc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.message-meta p {
  margin-bottom: 0.5rem;
}

.message-content {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.reply-section {
  border-top: 1px solid #dbdbdb;
  padding-top: 1rem;
}

@media screen and (max-width: 768px) {
  .message-panel {
    right: 10px;
    left: 10px;
    width: auto;
  }
}
</style>
