<template>
  <div class="container">
    <section class="section">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <h1 class="title">討論區</h1>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <button class="button is-primary" @click="showCreateModal = true">
              <span class="icon">
                ➕
              </span>
              <span>發起新討論</span>
            </button>
          </div>
          <div class="level-item">
            <button class="button is-info" @click="showCreateGroupModal = true">
              <span class="icon">
                👥
              </span>
              <span>新增群組</span>
            </button>
          </div>
        </div>
      </div>

      <p class="subtitle">與其他學員分享想法、提問和交流經驗</p>

      <!-- Tabs -->
      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': activeTab === 'discussions' }">
            <a @click="activeTab = 'discussions'">
              <span class="icon is-small">💬</span>
              <span>討論主題</span>
            </a>
          </li>
          <li :class="{ 'is-active': activeTab === 'groups' }">
            <a @click="activeTab = 'groups'">
              <span class="icon is-small">👥</span>
              <span>群組管理</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Discussions Tab -->
      <div v-show="activeTab === 'discussions'">
        <!-- Filters -->
        <div class="box mb-4">
        <div class="columns">
          <div class="column is-4">
            <div class="field">
              <label class="label">選擇群組</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="selectedGroupId" @change="loadTopics">
                    <option value="">所有群組</option>
                    <option v-for="group in myGroups" :key="group.id" :value="group.id">
                      {{ group.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-4">
            <div class="field">
              <label class="label">分類</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="selectedCategory" @change="loadTopics">
                    <option value="">所有分類</option>
                    <option value="question">提問</option>
                    <option value="discussion">討論</option>
                    <option value="announcement">公告</option>
                    <option value="resource">資源分享</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-4">
            <div class="field">
              <label class="label">排序</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="sortBy" @change="loadTopics">
                    <option value="latest">最新</option>
                    <option value="popular">最熱門</option>
                    <option value="unanswered">未回答</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="topics.length === 0" class="notification is-info">
        <p>目前沒有討論主題</p>
      </div>

      <!-- Topics List -->
      <div v-else>
        <div v-for="topic in topics" :key="topic.id" class="box mb-3">
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <div class="is-flex-grow-1">
                  <h3 class="title is-5 mb-2">
                    <router-link :to="`/community/forum/topics/${topic.id}`">
                      {{ topic.title }}
                    </router-link>
                  </h3>
                  <p class="subtitle is-6 mb-2">
                    <span class="tag" :class="getCategoryClass(topic.category)">
                      {{ getCategoryLabel(topic.category) }}
                    </span>
                    <span v-if="topic.isPinned" class="tag is-warning ml-2">
                      📌 置頂
                    </span>
                  </p>
                  <p class="has-text-grey-light is-size-7">
                    由 <strong>{{ topic.authorName }}</strong> 發起於
                    {{ formatDate(topic.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <div class="has-text-right">
                  <p class="title is-5">
                    <span class="icon-text">
                      <span class="icon">
                        💬
                      </span>
                      <span>{{ topic.replyCount }}</span>
                    </span>
                  </p>
                </div>
              </div>
              <div class="level-item">
                <div class="has-text-right">
                  <p class="title is-5">
                    <span class="icon-text">
                      <span class="icon">
                        👁️
                      </span>
                      <span>{{ topic.viewCount }}</span>
                    </span>
                  </p>
                </div>
              </div>
              <!-- Admin actions -->
              <div v-if="isAdmin" class="level-item">
                <div class="buttons">
                  <button
                    class="button is-small is-danger"
                    @click="deleteTopic(topic)"
                    :disabled="deletingTopic === topic.id"
                    title="刪除討論主題"
                  >
                    <span class="icon">
                      🗑️
                    </span>
                  </button>
                </div>
              </div>
              <!-- Debug: Show admin status -->
              <div v-if="authStore.user" class="level-item">
                <small class="has-text-grey">{{ authStore.user.userType }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="pagination is-centered mt-5" role="navigation">
        <a
          class="pagination-previous"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          上一頁
        </a>
        <a
          class="pagination-next"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一頁
        </a>
        <ul class="pagination-list">
          <li v-for="page in Math.min(totalPages, 5)" :key="page">
            <a
              class="pagination-link"
              :class="{ 'is-current': page === currentPage }"
              @click="changePage(page)"
            >
              {{ page }}
            </a>
          </li>
        </ul>
      </nav>
      </div>

      <!-- Groups Tab -->
      <div v-show="activeTab === 'groups'">
        <div class="box">
          <h2 class="title is-4">群組管理</h2>
          <p class="subtitle">建立和管理討論群組</p>
          
          <h3 class="title is-5">我的群組</h3>

          <div v-if="myGroups.length === 0" class="has-text-centered py-6">
            <p class="has-text-grey">尚未加入任何群組</p>
            <p class="has-text-grey-light">點擊右上角的「新增群組」按鈕來建立第一個群組</p>
          </div>

          <div v-else class="columns is-multiline">
            <div v-for="group in myGroups" :key="group.id" class="column is-6">
              <div class="card">
                <div class="card-content">
                  <div class="level">
                    <div class="level-left">
                      <div class="level-item">
                        <div>
                          <p class="title is-6">{{ group.name }}</p>
                          <p class="subtitle is-7">{{ group.description || '無描述' }}</p>
                          <p class="has-text-grey is-size-7">
                            成員：{{ group.member_count || 0 }} 人
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="level-right">
                      <div class="level-item">
                        <div class="buttons">
                          <router-link 
                            :to="`/community/groups/${group.id}`" 
                            class="button is-small is-info"
                          >
                            查看
                          </router-link>
                          <button 
                            v-if="isAdmin" 
                            class="button is-small is-danger"
                            @click="deleteGroup(group)"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Create Topic Modal -->
    <div class="modal" :class="{ 'is-active': showCreateModal }">
      <div class="modal-background" @click="showCreateModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">發起新討論</p>
          <button class="delete" @click="showCreateModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">選擇群組</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newTopic.groupId">
                  <option value="">請選擇群組</option>
                  <option v-for="group in myGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">標題</label>
            <div class="control">
              <input
                v-model="newTopic.title"
                class="input"
                type="text"
                placeholder="輸入討論標題"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">分類</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newTopic.category">
                  <option value="question">提問</option>
                  <option value="discussion">討論</option>
                  <option value="announcement">公告</option>
                  <option value="resource">資源分享</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">內容</label>
            <div class="control">
              <textarea
                v-model="newTopic.content"
                class="textarea"
                placeholder="輸入討論內容"
                rows="8"
              ></textarea>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="createTopic" :disabled="isSubmitting">
            {{ isSubmitting ? '發起中...' : '發起討論' }}
          </button>
          <button class="button" @click="showCreateModal = false">取消</button>
        </footer>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div class="modal" :class="{ 'is-active': showCreateGroupModal }">
      <div class="modal-background" @click="showCreateGroupModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">建立新群組</p>
          <button class="delete" @click="showCreateGroupModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">群組名稱</label>
            <div class="control">
              <input
                v-model="newGroup.name"
                class="input"
                type="text"
                placeholder="輸入群組名稱"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">群組描述</label>
            <div class="control">
              <textarea
                v-model="newGroup.description"
                class="textarea"
                placeholder="輸入群組描述"
                rows="4"
              ></textarea>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="createGroup" :disabled="isSubmitting">
            {{ isSubmitting ? '建立中...' : '建立群組' }}
          </button>
          <button class="button" @click="showCreateGroupModal = false">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface Topic {
  id: number
  title: string
  content: string
  category: string
  authorName: string
  createdAt: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  replyCount: number
}

interface Group {
  id: number
  name: string
  description?: string
  member_count?: number
}

const topics = ref<Topic[]>([])
const myGroups = ref<Group[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const deletingTopic = ref<number | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const showCreateModal = ref(false)
const showGroupsModal = ref(false)
const showCreateGroupModal = ref(false)
const activeTab = ref('discussions')

// Check if current user is admin
const authStore = useAuthStore()
const isAdmin = computed(() => {
  return authStore.user?.userType === 'admin'
})

const selectedGroupId = ref('')
const selectedCategory = ref('')
const sortBy = ref('latest')

const newTopic = ref({
  groupId: '',
  title: '',
  category: 'question',
  content: ''
})

const newGroup = ref({
  name: '',
  description: ''
})

const loadMyGroups = async () => {
  try {
    // TODO: 實現 /groups/my-groups 端點後再改回
    const response = await apiService.get<Group[]>('/groups')
    if (response.success && response.data) {
      myGroups.value = response.data
    }
  } catch (error) {
    console.error('載入群組失敗:', error)
  }
}

const loadTopics = async () => {
  loading.value = true
  try {
    const response = await apiService.get<Topic[]>('/forum/topics', {
      params: {
        group_id: selectedGroupId.value || undefined,
        category: selectedCategory.value || undefined,
        page: currentPage.value,
        limit: 20,
        sortBy: sortBy.value
      }
    })

    if (response.success && response.data) {
      // 映射數據格式，將 snake_case 轉換為 camelCase
      topics.value = response.data.map((topic: any) => ({
        ...topic,
        viewCount: topic.view_count || 0,
        replyCount: topic.reply_count || 0
      }))
      const meta = response.meta as any
      if (meta?.totalPages) {
        totalPages.value = meta.totalPages
      }
    }
  } catch (error) {
    console.error('載入討論主題失敗:', error)
  } finally {
    loading.value = false
  }
}

const createTopic = async () => {
  if (!newTopic.value.title || !newTopic.value.content || !newTopic.value.category) {
    alert('請填寫標題、內容和分類')
    return
  }

  isSubmitting.value = true
  try {
    await apiService.post('/forum/topics', {
      title: newTopic.value.title,
      content: newTopic.value.content,
      category: newTopic.value.category,
      groupId: newTopic.value.groupId || null
    })

    showCreateModal.value = false
    newTopic.value = { groupId: '', title: '', category: 'question', content: '' }
    currentPage.value = 1
    loadTopics()
    alert('討論主題發起成功！')
  } catch (error) {
    console.error('發起討論失敗:', error)
    alert('發起討論失敗，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

const createGroup = async () => {
  if (!newGroup.value.name) {
    alert('請填寫群組名稱')
    return
  }

  isSubmitting.value = true
  try {
    const response = await apiService.post('/groups', newGroup.value)
    if (response.success) {
      showCreateGroupModal.value = false
      newGroup.value = { name: '', description: '' }
      alert('群組建立成功！')
      loadMyGroups()
    }
  } catch (error) {
    console.error('建立群組失敗:', error)
    alert('建立群組失敗，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadTopics()
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

// Delete topic (admin only)
const deleteTopic = async (topic: Topic) => {
  const confirmMessage = `確定要刪除討論主題「${topic.title}」嗎？此操作無法復原。`
  
  if (!confirm(confirmMessage)) {
    return
  }

  try {
    deletingTopic.value = topic.id
    
    const response = await apiService.delete(`/forum/topics?id=${topic.id}`)
    
    if (response.success) {
      // Remove from local state
      const index = topics.value.findIndex(t => t.id === topic.id)
      if (index > -1) {
        topics.value.splice(index, 1)
      }
      alert('討論主題已刪除')
    } else {
      alert(response.error?.message || '刪除討論主題失敗')
    }
  } catch (error: any) {
    console.error('[deleteTopic] 刪除討論主題失敗:', error)
    alert(error.response?.data?.error?.message || '刪除討論主題失敗')
  } finally {
    deletingTopic.value = null
  }
}

// Delete group (admin only)
const deleteGroup = async (group: Group) => {
  const confirmMessage = `確定要刪除群組「${group.name}」嗎？此操作無法復原。`
  
  if (!confirm(confirmMessage)) {
    return
  }

  try {
    const response = await apiService.delete(`/groups/${group.id}`)
    
    if (response.success) {
      // Remove from local state
      const index = myGroups.value.findIndex(g => g.id === group.id)
      if (index > -1) {
        myGroups.value.splice(index, 1)
      }
      alert('群組已刪除')
    } else {
      alert(response.error?.message || '刪除群組失敗')
    }
  } catch (error: any) {
    console.error('[deleteGroup] 刪除群組失敗:', error)
    alert(error.response?.data?.error?.message || '刪除群組失敗')
  }
}

onMounted(() => {
  loadMyGroups()
  loadTopics()
})
</script>

<style scoped>
.box {
  transition: box-shadow 0.3s ease;
}

.box:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
