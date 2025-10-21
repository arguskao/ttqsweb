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
                <i class="fas fa-plus"></i>
              </span>
              <span>發起新討論</span>
            </button>
          </div>
        </div>
      </div>

      <p class="subtitle">與其他學員分享想法、提問和交流經驗</p>

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
                      <i class="fas fa-thumbtack"></i>
                      置頂
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
                  <p class="heading">回覆</p>
                  <p class="title is-5">{{ topic.replyCount }}</p>
                </div>
              </div>
              <div class="level-item">
                <div class="has-text-right">
                  <p class="heading">瀏覽</p>
                  <p class="title is-5">{{ topic.viewCount }}</p>
                </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiService } from '@/services/api-enhanced'

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
}

const topics = ref<Topic[]>([])
const myGroups = ref<Group[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const showCreateModal = ref(false)

const selectedGroupId = ref('')
const selectedCategory = ref('')
const sortBy = ref('latest')

const newTopic = ref({
  groupId: '',
  title: '',
  category: 'question',
  content: ''
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
      topics.value = response.data
      if (response.meta?.pagination) {
        totalPages.value = response.meta.pagination.totalPages
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
  return classes[category] || ''
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
