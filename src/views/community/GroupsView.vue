<template>
  <div class="container">
    <section class="section">
      <h1 class="title">學員群組</h1>
      <p class="subtitle">加入群組，與其他學員交流學習經驗</p>

      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': activeTab === 'all' }">
            <a @click="activeTab = 'all'">所有群組</a>
          </li>
          <li :class="{ 'is-active': activeTab === 'my' }">
            <a @click="activeTab = 'my'">我的群組</a>
          </li>
        </ul>
      </div>

      <div class="box mb-4">
        <button class="button is-primary" @click="showCreateModal = true">
          <span class="icon">
            <span>➕</span>
          </span>
          <span>創建新群組</span>
        </button>
      </div>

      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <div v-else-if="groups.length === 0" class="notification is-info">
        <p>{{ activeTab === 'my' ? '您還沒有加入任何群組' : '目前沒有群組' }}</p>
      </div>

      <div v-else class="columns is-multiline">
        <div v-for="group in groups" :key="group.id" class="column is-one-third">
          <div class="card">
            <div class="card-content">
              <p class="title is-5">{{ group.name }}</p>
              <p class="subtitle is-6">
                <span class="tag" :class="getGroupTypeClass(group.group_type)">
                  {{ getGroupTypeLabel(group.group_type) }}
                </span>
              </p>
              <p class="content">{{ group.description }}</p>
              <p class="has-text-grey-light">
                <span class="icon-text">
                  <span class="icon">
                    <span>👥</span>
                  </span>
                  <span>{{ group.memberCount || 0 }} 位成員</span>
                </span>
              </p>
            </div>
            <footer class="card-footer">
              <a class="card-footer-item" @click="viewGroup(group.id)">查看</a>
              <a v-if="activeTab === 'all'" class="card-footer-item" @click="joinGroup(group.id)">
                加入
              </a>
              <a
                v-if="isAdmin"
                class="card-footer-item has-text-danger"
                @click="deleteGroup(group.id)"
              >
                刪除
              </a>
            </footer>
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
          <li v-for="page in totalPages" :key="page">
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

    <!-- Create Group Modal -->
    <div class="modal" :class="{ 'is-active': showCreateModal }">
      <div class="modal-background" @click="showCreateModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">創建新群組</p>
          <button class="delete" @click="showCreateModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">群組名稱</label>
            <div class="control">
              <input v-model="newGroup.name" class="input" type="text" placeholder="輸入群組名稱" />
            </div>
          </div>

          <div class="field">
            <label class="label">群組類型</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newGroup.groupType">
                  <option value="course">課程學習</option>
                  <option value="interest">興趣交流</option>
                  <option value="alumni">校友會</option>
                  <option value="study">讀書會</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">群組描述</label>
            <div class="control">
              <textarea
                v-model="newGroup.description"
                class="textarea"
                placeholder="描述群組的目的和內容"
              ></textarea>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="createGroup" :disabled="isSubmitting">
            {{ isSubmitting ? '創建中...' : '創建' }}
          </button>
          <button class="button" @click="showCreateModal = false">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 檢查是否為管理員
const isAdmin = computed(() => authStore.user?.userType === 'admin')

const activeTab = ref('all')
const groups = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const showCreateModal = ref(false)
const isSubmitting = ref(false)

const newGroup = ref({
  name: '',
  groupType: 'course',
  description: ''
})

const loadGroups = async () => {
  loading.value = true
  try {
    // TODO: 實現 /groups/my-groups 端點後再區分
    const endpoint = '/groups' // activeTab.value === 'my' ? '/groups/my-groups' : '/groups'
    const response = await apiService.get(endpoint, {
      params: { page: currentPage.value, limit: 12 }
    })
    
    console.log('載入群組響應:', response)
    
    if (response.success) {
      groups.value = (response.data as any[]) || []
      if (response.meta && 'totalPages' in response.meta) {
        totalPages.value = (response.meta as any).totalPages || 1
      }
    } else {
      groups.value = []
      console.warn('API 返回失敗狀態:', response)
    }
  } catch (error: any) {
    console.error('載入群組失敗:', error)
    console.error('錯誤詳情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    groups.value = []
  } finally {
    loading.value = false
  }
}

const createGroup = async () => {
  if (!newGroup.value.name.trim()) {
    alert('請輸入群組名稱')
    return
  }
  if (!newGroup.value.description.trim()) {
    alert('請輸入群組描述')
    return
  }

  isSubmitting.value = true
  try {
    await apiService.post('/groups', {
      name: newGroup.value.name,
      description: newGroup.value.description,
      groupType: newGroup.value.groupType
    })

    showCreateModal.value = false
    newGroup.value = { name: '', groupType: 'course', description: '' }
    alert('群組創建成功！')
    loadGroups()
  } catch (error) {
    console.error('創建群組失敗:', error)
    alert('創建群組失敗，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

const joinGroup = async (groupId: number) => {
  try {
    const response = await apiService.post(`/groups/${groupId}/join`)
    if (response.success) {
      alert('成功加入群組！')
      loadGroups()
    } else {
      alert(response.error?.message || '加入群組失敗')
    }
  } catch (error: any) {
    alert(error.response?.data?.error?.message || '加入群組失敗')
  }
}

const viewGroup = (groupId: number) => {
  router.push(`/community/groups/${groupId}`)
}

const deleteGroup = async (groupId: number) => {
  if (!confirm('確定要刪除這個群組嗎？此操作無法復原。')) {
    return
  }

  try {
    const response = await apiService.delete(`/groups/${groupId}`)
    if (response.success) {
      alert('群組已刪除')
      loadGroups()
    } else {
      alert(response.error?.message || '刪除群組失敗')
    }
  } catch (error: any) {
    console.error('刪除群組失敗:', error)
    alert(error.response?.data?.error?.message || '刪除群組失敗')
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadGroups()
  }
}

const getGroupTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    course: '課程學習',
    interest: '興趣交流',
    alumni: '校友會',
    study: '讀書會'
  }
  return labels[type] || type
}

const getGroupTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    course: 'is-info',
    interest: 'is-success',
    alumni: 'is-warning',
    study: 'is-primary'
  }
  return classes[type] ?? ''
}

watch(activeTab, () => {
  currentPage.value = 1
  loadGroups()
})

onMounted(() => {
  // 頁面載入時檢查認證狀態
  const authStore = useAuthStore()
  console.log('頁面載入時的認證狀態:', {
    isAuthenticated: authStore.isAuthenticated,
    hasToken: !!authStore.token,
    hasUser: !!authStore.user,
    token: authStore.token?.substring(0, 20) + '...',
    user: authStore.user
  })
  
  loadGroups()
})
</script>

<style scoped>
.card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1;
}
</style>
