<template>
  <div class="file-management-view">
    <section class="section">
      <div class="container">
        <!-- Header -->
        <div class="level mb-5">
          <div class="level-left">
            <div class="level-item">
              <div>
                <h1 class="title is-2">文件管理</h1>
                <p class="subtitle">上傳和管理系統文件</p>
              </div>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <button
                class="button is-info"
                @click="syncR2Files"
                :class="{ 'is-loading': isSyncing }"
                :disabled="isSyncing"
              >
                <span class="icon">
                  <span>🔄</span>
                </span>
                <span>同步 R2 文件</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs is-boxed">
          <ul>
            <li :class="{ 'is-active': activeTab === 'upload' }">
              <a @click="activeTab = 'upload'">
                <span class="icon is-small">
                  <span>⬆️</span>
                </span>
                <span>上傳文件</span>
              </a>
            </li>
            <li :class="{ 'is-active': activeTab === 'list' }">
              <a @click="activeTab = 'list'">
                <span class="icon is-small">
                  <span>📋</span>
                </span>
                <span>文件列表</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Upload Tab -->
        <div v-show="activeTab === 'upload'" class="tab-content">
          <FileUpload @upload-success="handleUploadSuccess" @upload-error="handleUploadError" />
        </div>

        <!-- List Tab -->
        <div v-show="activeTab === 'list'" class="tab-content">
          <!-- Filters -->
          <div class="box mb-4">
            <div class="columns">
              <div class="column is-4">
                <div class="field">
                  <label class="label">搜索</label>
                  <div class="control has-icons-left">
                    <input
                      v-model="searchTerm"
                      class="input"
                      type="text"
                      placeholder="搜索文件名稱..."
                      @input="handleSearch"
                    />
                    <span class="icon is-left">
                      <span>🔍</span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="column is-3">
                <div class="field">
                  <label class="label">分類</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="selectedCategory" @change="fetchFiles">
                        <option value="">所有分類</option>
                        <option value="general">一般文件</option>
                        <option value="course">課程資料</option>
                        <option value="documents">文檔</option>
                        <option value="images">圖片</option>
                        <option value="reference">參考資料</option>
                        <option value="ttqs">TTQS文件</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="column is-2">
                <div class="field">
                  <label class="label">&nbsp;</label>
                  <button class="button is-light is-fullwidth" @click="resetFilters">
                    <span class="icon">
                      <span>🔄</span>
                    </span>
                    <span>重置</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="has-text-centered py-6">
            <button class="button is-loading is-large is-white"></button>
            <p class="mt-3">載入中...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="notification is-danger">
            <button class="delete" @click="error = null"></button>
            {{ error }}
          </div>

          <!-- Empty State -->
          <div v-else-if="files.length === 0" class="notification is-info">
            <p class="has-text-centered">
              <span class="icon">
                <span>ℹ️</span>
              </span>
              沒有找到文件
            </p>
          </div>

          <!-- Files Table -->
          <div v-else class="box">
            <div class="table-container">
              <table class="table is-fullwidth is-hoverable">
                <thead>
                  <tr>
                    <th>文件名稱</th>
                    <th>分類</th>
                    <th>大小</th>
                    <th>上傳時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="file in files" :key="file.id">
                    <td>
                      <div class="is-flex is-align-items-center">
                        <span class="icon mr-2">
                          <span>{{ getFileIcon(file.file_type) }}</span>
                        </span>
                        <div>
                          <p class="has-text-weight-semibold">{{ file.title }}</p>
                          <p v-if="file.description" class="is-size-7 has-text-grey">
                            {{ file.description }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="tag" :class="getCategoryColor(file.category)">
                        {{ getCategoryLabel(file.category) }}
                      </span>
                    </td>
                    <td>{{ formatFileSize(file.file_size) }}</td>
                    <td>{{ formatDate(file.created_at) }}</td>
                    <td>
                      <div class="buttons are-small">
                        <button
                          class="button is-info is-light"
                          @click="copyFileUrl(file.file_url)"
                          title="複製 URL"
                        >
                          <span class="icon">
                            <span>📋</span>
                          </span>
                        </button>
                        <a
                          :href="file.file_url"
                          target="_blank"
                          class="button is-primary is-light"
                          title="查看文件"
                        >
                          <span class="icon">
                            <span>🔗</span>
                          </span>
                        </a>
                        <button
                          class="button is-danger is-light"
                          @click="confirmDelete(file)"
                          title="刪除文件"
                        >
                          <span class="icon">
                            <span>🗑️</span>
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <nav
              v-if="totalPages > 1"
              class="pagination is-centered mt-4"
              role="navigation"
              aria-label="pagination"
            >
              <button
                class="pagination-previous"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                上一頁
              </button>
              <button
                class="pagination-next"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                下一頁
              </button>
              <ul class="pagination-list">
                <li v-for="page in visiblePages" :key="page">
                  <button
                    v-if="page !== '...'"
                    class="pagination-link"
                    :class="{ 'is-current': page === currentPage }"
                    @click="goToPage(page as number)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="pagination-ellipsis">&hellip;</span>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <!-- Success Notification -->
        <div v-if="successMessage" class="notification is-success mt-4">
          <button class="delete" @click="successMessage = null"></button>
          {{ successMessage }}
        </div>
      </div>
    </section>

    <!-- Delete Confirmation Modal -->
    <div class="modal" :class="{ 'is-active': showDeleteModal }">
      <div class="modal-background" @click="showDeleteModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">確認刪除</p>
          <button class="delete" aria-label="close" @click="showDeleteModal = false"></button>
        </header>
        <section class="modal-card-body">
          <p>確定要刪除文件「{{ fileToDelete?.title }}」嗎？</p>
          <p class="has-text-danger mt-2">此操作無法撤銷！</p>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-danger"
            @click="deleteFile"
            :class="{ 'is-loading': isDeleting }"
          >
            確認刪除
          </button>
          <button class="button" @click="showDeleteModal = false">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FileUpload from '@/components/common/FileUpload.vue'
import api from '@/services/api'

interface FileItem {
  id: number
  title: string
  description: string | null
  file_url: string
  file_type: string | null
  file_size: number | null
  category: string | null
  created_at: string
}

// State
const activeTab = ref<'upload' | 'list'>('upload')
const files = ref<FileItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const isSyncing = ref(false)
const isDeleting = ref(false)

// Filters
const searchTerm = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = 20

// Delete modal
const showDeleteModal = ref(false)
const fileToDelete = ref<FileItem | null>(null)

// Search debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Computed
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 5

  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages.value)
    } else if (currentPage.value >= totalPages.value - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      pages.push(currentPage.value - 1)
      pages.push(currentPage.value)
      pages.push(currentPage.value + 1)
      pages.push('...')
      pages.push(totalPages.value)
    }
  }

  return pages
})

// Methods
const fetchFiles = async () => {
  loading.value = true
  error.value = null

  try {
    const params: any = {
      page: currentPage.value,
      limit: itemsPerPage
    }

    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }

    if (searchTerm.value) {
      params.search = searchTerm.value
    }

    const response = await api.get('/documents', { params })

    if (response.data.success) {
      files.value = response.data.data.files || []
      totalPages.value = response.data.data.pagination?.totalPages || 1
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '載入文件失敗'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchFiles()
  }, 500)
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
  fetchFiles()
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchFiles()
}

const handleUploadSuccess = () => {
  successMessage.value = '文件上傳成功！'
  activeTab.value = 'list'
  fetchFiles()
  setTimeout(() => {
    successMessage.value = null
  }, 5000)
}

const handleUploadError = (err: any) => {
  error.value = err.response?.data?.message || '文件上傳失敗'
}

const syncR2Files = async () => {
  isSyncing.value = true
  error.value = null

  try {
    const response = await api.post('/sync-files')

    if (response.data.success) {
      successMessage.value = `成功同步 ${response.data.data.synced} 個文件！`
      fetchFiles()
      setTimeout(() => {
        successMessage.value = null
      }, 5000)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '同步文件失敗'
  } finally {
    isSyncing.value = false
  }
}

const copyFileUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    successMessage.value = 'URL 已複製到剪貼板！'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = '複製失敗'
  }
}

const confirmDelete = (file: FileItem) => {
  fileToDelete.value = file
  showDeleteModal.value = true
}

const deleteFile = async () => {
  if (!fileToDelete.value) return

  isDeleting.value = true

  try {
    const response = await api.delete(`/upload/${fileToDelete.value.id}`)

    if (response.data.success) {
      successMessage.value = '文件已刪除'
      showDeleteModal.value = false
      fileToDelete.value = null
      fetchFiles()
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '刪除文件失敗'
    showDeleteModal.value = false
  } finally {
    isDeleting.value = false
  }
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'N/A'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getFileIcon = (fileType: string | null): string => {
  if (!fileType) return '📄'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word')) return '📝'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊'
  if (fileType.includes('video')) return '🎥'
  return '📄'
}

const getCategoryLabel = (category: string | null): string => {
  const labels: Record<string, string> = {
    general: '一般',
    course_materials: '課程',
    user_avatars: '頭像',
    documents: '文檔',
    images: '圖片',
    videos: '視頻',
    ttqs: 'TTQS'
  }
  return labels[category || 'general'] || '其他'
}

const getCategoryColor = (category: string | null): string => {
  const colors: Record<string, string> = {
    general: 'is-light',
    course_materials: 'is-info',
    user_avatars: 'is-primary',
    documents: 'is-link',
    images: 'is-success',
    videos: 'is-warning',
    ttqs: 'is-danger'
  }
  return colors[category || 'general'] || 'is-light'
}

// Lifecycle
onMounted(() => {
  fetchFiles()
})
</script>

<style scoped>
.file-management-view {
  min-height: 80vh;
}

.tab-content {
  padding: 1.5rem 0;
}

.table-container {
  overflow-x: auto;
}
</style>
