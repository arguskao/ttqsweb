<template>
  <div class="container">
    <section class="section">
      <h1 class="title">經驗分享</h1>
      <p class="subtitle">分享您的學習和工作經驗，幫助其他學員成長</p>

      <div class="box mb-4">
        <button class="button is-primary" @click="showCreateModal = true">
          <span class="icon">
            <i class="fas fa-pen"></i>
          </span>
          <span>分享經驗</span>
        </button>
      </div>

      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': filter === 'all' }">
            <a @click="filter = 'all'">全部</a>
          </li>
          <li :class="{ 'is-active': filter === 'featured' }">
            <a @click="filter = 'featured'">精選</a>
          </li>
        </ul>
      </div>

      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <div v-else-if="experiences.length === 0" class="notification is-info">
        <p>目前沒有經驗分享</p>
      </div>

      <div v-else>
        <article v-for="exp in experiences" :key="exp.id" class="box">
          <div class="media">
            <div class="media-content">
              <div class="content">
                <p>
                  <strong>{{ exp.title }}</strong>
                  <span class="tag ml-2" :class="getShareTypeClass(exp.share_type)">
                    {{ getShareTypeLabel(exp.share_type) }}
                  </span>
                  <span v-if="exp.is_featured" class="tag is-warning ml-2">
                    <span class="icon">
                      <i class="fas fa-star"></i>
                    </span>
                    <span>精選</span>
                  </span>
                  <br />
                  <span class="has-text-grey-light">{{ formatDate(exp.created_at) }}</span>
                </p>
                <div class="content-preview" v-html="formatContentPreview(exp.content)"></div>
                <div class="tags">
                  <span v-for="tag in exp.tags" :key="tag" class="tag is-light">{{ tag }}</span>
                </div>
              </div>
              <nav class="level is-mobile">
                <div class="level-left">
                  <a class="level-item" @click="viewExperience(exp.id)">
                    <span class="icon is-small">
                      <i class="fas fa-eye"></i>
                    </span>
                    <span>{{ exp.view_count }}</span>
                  </a>
                  <a class="level-item" @click="likeExperience(exp.id)">
                    <span class="icon is-small">
                      <i class="fas fa-heart"></i>
                    </span>
                    <span>{{ exp.like_count }}</span>
                  </a>
                  <a class="level-item">
                    <span class="icon is-small">
                      <i class="fas fa-comment"></i>
                    </span>
                    <span>{{ exp.comment_count }}</span>
                  </a>
                </div>
              </nav>
            </div>
          </div>
        </article>
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
      </nav>
    </section>

    <!-- Create Experience Modal -->
    <div class="modal" :class="{ 'is-active': showCreateModal }">
      <div class="modal-background" @click="showCreateModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">分享經驗</p>
          <button class="delete" @click="showCreateModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">標題</label>
            <div class="control">
              <input v-model="newExperience.title" class="input" type="text" placeholder="輸入標題" />
            </div>
          </div>

          <div class="field">
            <label class="label">分享類型</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newExperience.share_type">
                  <option value="job_experience">工作經驗</option>
                  <option value="learning_tips">學習技巧</option>
                  <option value="interview">面試經驗</option>
                  <option value="career_advice">職涯建議</option>
                  <option value="success_story">成功故事</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">內容</label>
            <div class="control">
              <textarea
                v-model="newExperience.content"
                class="textarea"
                rows="8"
                placeholder="分享您的經驗..."
              ></textarea>
            </div>
          </div>

          <div class="field">
            <label class="label">標籤（用逗號分隔）</label>
            <div class="control">
              <input
                v-model="tagsInput"
                class="input"
                type="text"
                placeholder="例如：藥局, 面試, 學習"
              />
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="createExperience">發布</button>
          <button class="button" @click="showCreateModal = false">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const filter = ref('all')
const experiences = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const showCreateModal = ref(false)
const tagsInput = ref('')

const newExperience = ref({
  title: '',
  share_type: 'job_experience',
  content: '',
  tags: [] as string[]
})

const loadExperiences = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, limit: 10 }
    if (filter.value === 'featured') {
      params.featured = 'true'
    }
    const response = await api.get('/experiences', { params })
    const apiData = response.data

    // 處理 API 響應結構
    if (apiData.success && apiData.data) {
      experiences.value = Array.isArray(apiData.data) ? apiData.data : []
      if (apiData.meta) {
        totalPages.value = apiData.meta.totalPages || 1
      }
    } else {
      console.warn('API 返回意外的結構:', apiData)
      experiences.value = []
    }
  } catch (error) {
    console.error('載入經驗分享失敗:', error)
    experiences.value = []
  } finally {
    loading.value = false
  }
}

const createExperience = async () => {
  try {
    // 檢查是否已登入
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      alert('請先登入才能分享經驗')
      router.push('/login')
      return
    }

    // 驗證表單
    if (!newExperience.value.title.trim()) {
      alert('請輸入標題')
      return
    }
    if (!newExperience.value.content.trim()) {
      alert('請輸入內容')
      return
    }

    const tags = tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)

    await api.post('/experiences', {
      ...newExperience.value,
      tags
    })

    showCreateModal.value = false
    newExperience.value = { title: '', share_type: 'job_experience', content: '', tags: [] }
    tagsInput.value = ''
    alert('經驗分享成功！')
    loadExperiences()
  } catch (error: any) {
    console.error('發布經驗失敗:', error)
    const errorMessage = error.response?.data?.error?.message || error.message || '發布失敗，請稍後再試'
    alert(errorMessage)
  }
}

const viewExperience = (id: number) => {
  router.push(`/community/experiences/${id}`)
}

const likeExperience = async (id: number) => {
  try {
    await api.post(`/experiences/${id}/like`)
    loadExperiences()
  } catch (error) {
    console.error('按讚失敗:', error)
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadExperiences()
  }
}

const truncateContent = (content: string, maxLength = 200) => {
  if (content.length <= maxLength) return content
  return `${content.substring(0, maxLength)}...`
}

const formatContentPreview = (content: string, maxLength = 200) => {
  // 保留換行符，轉換為 <br> 標籤
  let preview = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .slice(0, 3) // 只顯示前 3 行
    .join('<br>')

  // 截斷長度
  if (preview.length > maxLength) {
    preview = preview.substring(0, maxLength) + '...'
  }

  return preview
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

const getShareTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    job_experience: '工作經驗',
    learning_tips: '學習技巧',
    interview: '面試經驗',
    career_advice: '職涯建議',
    success_story: '成功故事'
  }
  return labels[type] || type
}

const getShareTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    job_experience: 'is-info',
    learning_tips: 'is-success',
    interview: 'is-warning',
    career_advice: 'is-primary',
    success_story: 'is-danger'
  }
  return classes[type] ?? ''
}

watch(filter, () => {
  currentPage.value = 1
  loadExperiences()
})

onMounted(() => {
  loadExperiences()
})
</script>

<style scoped>
.content-preview {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  color: #333;
  margin: 0.5rem 0;
}

.box {
  transition: box-shadow 0.3s ease;
}

.box:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tags {
  margin-top: 0.5rem;
}

.tag {
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
