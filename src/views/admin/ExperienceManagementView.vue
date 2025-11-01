<template>
  <div class="experience-management-view">
    <section class="section">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-full">
            <!-- Page title -->
            <div class="has-text-centered mb-5">
              <h1 class="title is-2">經驗分享管理</h1>
              <p class="subtitle">管理所有用戶的經驗分享，設定精選內容</p>
            </div>

            <!-- Loading state -->
            <div v-if="isLoading" class="has-text-centered">
              <div class="loader"></div>
              <p>載入中...</p>
            </div>

            <!-- Error message -->
            <div v-else-if="errorMessage" class="notification is-danger">
              {{ errorMessage }}
            </div>

            <!-- Experience management -->
            <div v-else class="card">
              <header class="card-header">
                <p class="card-header-title">
                  經驗分享列表 (共 {{ meta.total }} 篇)
                </p>
                <button class="card-header-icon" @click="() => loadExperiences()">
                  <span class="icon">
                    <i class="fas fa-sync-alt"></i>
                  </span>
                </button>
              </header>
              <div class="card-content">
                <div v-if="experiences.length === 0" class="has-text-centered">
                  <p>尚無經驗分享</p>
                </div>
                <div v-else>
                  <div v-for="experience in experiences" :key="experience.id" class="box">
                    <div class="level">
                      <div class="level-left">
                        <div>
                          <p class="title is-6">{{ experience.title }}</p>
                          <p class="subtitle is-7">
                            作者：{{ experience.authorName }} | 
                            {{ formatDate(experience.created_at) }}
                          </p>
                          <div class="tags">
                            <span class="tag is-light">
                              <i class="fas fa-heart mr-1"></i>
                              {{ experience.likes_count || 0 }}
                            </span>
                            <span class="tag is-light">
                              <i class="fas fa-comment mr-1"></i>
                              {{ experience.comments_count || 0 }}
                            </span>
                            <span 
                              v-if="experience.is_featured" 
                              class="tag is-warning"
                            >
                              <i class="fas fa-star mr-1"></i>
                              精選
                            </span>
                            <span class="tag is-info">
                              {{ getCategoryName(experience.share_type) }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="level-right">
                        <div class="buttons">
                          <button
                            class="button is-small"
                            :class="experience.is_featured ? 'is-warning' : 'is-light'"
                            @click="toggleFeatured(experience)"
                            :disabled="updatingExperience === experience.id"
                          >
                            <span class="icon">
                              <i class="fas fa-star"></i>
                            </span>
                            <span>{{ experience.is_featured ? '取消精選' : '設為精選' }}</span>
                          </button>
                          <router-link 
                            :to="`/community/experiences/${experience.id}`"
                            class="button is-small is-info"
                          >
                            <span class="icon">
                              <i class="fas fa-eye"></i>
                            </span>
                            <span>查看</span>
                          </router-link>
                          <button
                            class="button is-small is-danger"
                            @click="deleteExperience(experience)"
                            :disabled="updatingExperience === experience.id"
                          >
                            <span class="icon">
                              <i class="fas fa-trash"></i>
                            </span>
                            <span>刪除</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <p class="content is-size-7" v-if="experience.content">
                      {{ experience.content.substring(0, 150) }}{{ experience.content.length > 150 ? '...' : '' }}
                    </p>
                  </div>

                  <!-- Pagination -->
                  <nav class="pagination is-centered mt-4" v-if="meta.totalPages > 1">
                    <button 
                      class="pagination-previous" 
                      @click="loadExperiences(meta.page - 1)"
                      :disabled="meta.page <= 1"
                    >
                      上一頁
                    </button>
                    <button 
                      class="pagination-next"
                      @click="loadExperiences(meta.page + 1)"
                      :disabled="meta.page >= meta.totalPages"
                    >
                      下一頁
                    </button>
                    <ul class="pagination-list">
                      <li v-for="page in Math.min(5, meta.totalPages)" :key="page">
                        <button 
                          class="pagination-link"
                          :class="{ 'is-current': page === meta.page }"
                          @click="loadExperiences(page)"
                        >
                          {{ page }}
                        </button>
                      </li>
                    </ul>
                  </nav>
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
import { api } from '@/services/api'

// Component state
const experiences = ref<any[]>([])
const meta = ref<any>({ page: 1, totalPages: 1, total: 0 })
const isLoading = ref(true)
const updatingExperience = ref<number | null>(null)
const errorMessage = ref('')

// Category mapping
const categoryMap: Record<string, string> = {
  success_story: '成功案例',
  learning_experience: '學習心得',
  career_advice: '職涯建議',
  industry_insight: '產業洞察'
}

// Get category name
const getCategoryName = (type: string): string => {
  return categoryMap[type] || type
}

// Format date helper
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Load experiences for management
const loadExperiences = async (page: number = 1) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const response = await api.get(`/admin/experiences?page=${page}&limit=10`)
    
    if (response.data?.success) {
      experiences.value = response.data.data || []
      meta.value = response.data.meta || { page: 1, totalPages: 1, total: 0 }
    } else {
      errorMessage.value = response.data?.error?.message || '載入經驗分享失敗'
    }
  } catch (error: any) {
    console.error('[loadExperiences] 載入經驗分享失敗:', error)
    errorMessage.value = error.response?.data?.error?.message || '載入經驗分享失敗'
    experiences.value = []
  } finally {
    isLoading.value = false
  }
}

// Toggle featured status
const toggleFeatured = async (experience: any) => {
  try {
    updatingExperience.value = experience.id
    const newFeaturedStatus = !experience.is_featured
    
    const response = await api.put('/admin/experiences', {
      id: experience.id,
      is_featured: newFeaturedStatus
    })
    
    if (response.data?.success) {
      // Update local state
      experience.is_featured = newFeaturedStatus
      alert(response.data.message || (newFeaturedStatus ? '已設為精選' : '已取消精選'))
    } else {
      alert(response.data?.error?.message || '更新精選狀態失敗')
    }
  } catch (error: any) {
    console.error('[toggleFeatured] 更新精選狀態失敗:', error)
    alert(error.response?.data?.error?.message || '更新精選狀態失敗')
  } finally {
    updatingExperience.value = null
  }
}

// Delete experience
const deleteExperience = async (experience: any) => {
  const confirmMessage = `確定要刪除經驗分享「${experience.title}」嗎？此操作無法復原。`
  
  if (!confirm(confirmMessage)) {
    return
  }

  try {
    updatingExperience.value = experience.id
    
    const response = await api.delete(`/admin/experiences?id=${experience.id}`)
    
    if (response.data?.success) {
      // Remove from local state
      const index = experiences.value.findIndex(e => e.id === experience.id)
      if (index > -1) {
        experiences.value.splice(index, 1)
      }
      // Update meta count
      if (meta.value.total > 0) {
        meta.value.total -= 1
      }
      alert('經驗分享已刪除')
    } else {
      alert(response.data?.error?.message || '刪除經驗分享失敗')
    }
  } catch (error: any) {
    console.error('[deleteExperience] 刪除經驗分享失敗:', error)
    alert(error.response?.data?.error?.message || '刪除經驗分享失敗')
  } finally {
    updatingExperience.value = null
  }
}

// Load experiences on component mount
onMounted(() => {
  loadExperiences()
})
</script>

<style scoped>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>