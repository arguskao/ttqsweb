<template>
  <div class="documents-view">
    <section class="section">
      <div class="container">
        <!-- Header -->
        <div class="has-text-centered mb-6">
          <h1 class="title is-2">文件下載</h1>
          <p class="subtitle">下載相關表單與資料</p>
        </div>

        <!-- Search and Filter Bar -->
        <div class="box mb-5">
          <div class="columns is-vcentered">
            <div class="column is-6">
              <div class="field">
                <p class="control has-icons-left">
                  <input
                    v-model="searchTerm"
                    class="input"
                    type="text"
                    placeholder="搜尋文件標題或描述..."
                    @input="handleSearch"
                  />
                  <span class="icon is-left">
                    <i class="fas fa-search"></i>
                  </span>
                </p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="selectedCategory" @change="handleCategoryChange">
                      <option value="">所有分類</option>
                      <option v-for="category in categories" :key="category" :value="category">
                        {{ category }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="column is-2">
              <button class="button is-light is-fullwidth" @click="resetFilters">
                <span class="icon">
                  <i class="fas fa-redo"></i>
                </span>
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Download Statistics -->
        <div v-if="downloadStats.length > 0" class="box mb-5">
          <h3 class="title is-5 mb-4">
            <span class="icon-text">
              <span class="icon has-text-info">
                <i class="fas fa-chart-bar"></i>
              </span>
              <span>下載統計</span>
            </span>
          </h3>
          <div class="columns is-multiline">
            <div v-for="stat in downloadStats" :key="stat.category" class="column is-3">
              <div class="has-text-centered">
                <p class="heading">{{ stat.category || '其他' }}</p>
                <p class="title is-4">{{ stat.total_downloads ?? 0 }}</p>
                <p class="subtitle is-6">{{ stat.document_count }} 個文件</p>
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
        <div v-else-if="documents.length === 0" class="notification is-info">
          <p class="has-text-centered">
            <span class="icon">
              <i class="fas fa-info-circle"></i>
            </span>
            {{ searchTerm || selectedCategory ? '沒有找到符合條件的文件' : '目前沒有可用的文件' }}
          </p>
        </div>

        <!-- Documents Grid -->
        <div v-else class="columns is-multiline">
          <div v-for="document in documents" :key="document.id" class="column is-4">
            <DocumentCard
              :document="document"
              @download="handleDownload"
              @preview="handlePreview"
            />
          </div>
        </div>

        <!-- Pagination -->
        <nav
          v-if="totalPages > 1"
          class="pagination is-centered mt-6"
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
    </section>

    <!-- Preview Modal -->
    <div class="modal" :class="{ 'is-active': showPreviewModal }">
      <div class="modal-background" @click="closePreviewModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-eye"></i>
              </span>
              <span>文件預覽</span>
            </span>
          </p>
          <button class="delete" aria-label="close" @click="closePreviewModal"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="previewDocument">
            <h4 class="title is-4">{{ previewDocument.title }}</h4>
            <p v-if="previewDocument.description" class="mb-4">
              {{ previewDocument.description }}
            </p>

            <div class="content">
              <ul>
                <li><strong>分類：</strong>{{ previewDocument.category || '未分類' }}</li>
                <li><strong>檔案類型：</strong>{{ previewDocument.fileType || '未知' }}</li>
                <li v-if="previewDocument.fileSize">
                  <strong>檔案大小：</strong>{{ formatFileSize(previewDocument.fileSize) }}
                </li>
                <li><strong>下載次數：</strong>{{ previewDocument.downloadCount ?? 0 }}</li>
              </ul>
            </div>

            <!-- PDF Preview -->
            <div v-if="isPdfFile(previewDocument)" class="mt-4">
              <iframe
                :src="previewDocument.fileUrl"
                width="100%"
                height="500px"
                style="border: 1px solid #ddd"
              ></iframe>
            </div>

            <!-- Image Preview -->
            <div v-else-if="isImageFile(previewDocument)" class="mt-4">
              <figure class="image">
                <img :src="previewDocument.fileUrl" :alt="previewDocument.title" />
              </figure>
            </div>

            <!-- Other Files -->
            <div v-else class="notification is-info mt-4">
              <p>此檔案類型不支援預覽，請直接下載查看。</p>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="handleDownloadFromPreview">
            <span class="icon">
              <i class="fas fa-download"></i>
            </span>
            <span>下載文件</span>
          </button>
          <button class="button" @click="closePreviewModal">關閉</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import DocumentCard from '@/components/common/DocumentCard.vue'
import api from '@/services/api'

interface Document {
  id: number
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  category: string | null
  downloadCount: number
  createdAt: string
}

interface DownloadStat {
  category: string
  document_count: number
  total_downloads: number
}

const router = useRouter()

// State
const documents = ref<Document[]>([])
const categories = ref<string[]>([])
const downloadStats = ref<DownloadStat[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Filters
const searchTerm = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = 12

// Preview Modal
const showPreviewModal = ref(false)
const previewDocument = ref<Document | null>(null)

// Search debounce timer
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
      for (let i = 1; i <= 4; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages.value)
    } else if (currentPage.value >= totalPages.value - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) {
        pages.push(i)
      }
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
const fetchDocuments = async () => {
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
      // API直接返回文檔數組在data中
      const docs = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data.documents ?? []
      documents.value = docs.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        fileUrl: doc.file_url,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        category: doc.category,
        downloadCount: doc.download_count ?? 0,
        createdAt: doc.created_at
      }))

      if (response.data.meta) {
        totalPages.value = response.data.meta.totalPages || 1
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '載入文件失敗'
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await api.get('/files/categories/list')
    if (response.data.success) {
      categories.value = response.data.data
    }
  } catch (err) {
    console.error('載入分類失敗:', err)
  }
}

const fetchDownloadStats = async () => {
  try {
    const response = await api.get('/files/stats/downloads')
    if (response.data.success) {
      downloadStats.value = response.data.data
    }
  } catch (err) {
    console.error('載入統計資料失敗:', err)
  }
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchDocuments()
  }, 500)
}

const handleCategoryChange = () => {
  currentPage.value = 1
  fetchDocuments()
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
  fetchDocuments()
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchDocuments()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDownload = async (documentId: number) => {
  try {
    const response = await api.get(`/documents/${documentId}/download`)

    if (response.data.success) {
      const { file_url, file_name } = response.data.data

      // Open download in new tab
      window.open(file_url, '_blank')

      // Refresh documents to update download count
      await fetchDocuments()
      // TODO: 實現API端點後再啟用
      // await fetchDownloadStats()
    }
  } catch (err: any) {
    error.value = err?.response?.data?.error?.message || '下載文件失敗'
  }
}

const handlePreview = (document: Document) => {
  previewDocument.value = document
  showPreviewModal.value = true
}

const closePreviewModal = () => {
  showPreviewModal.value = false
  previewDocument.value = null
}

const handleDownloadFromPreview = () => {
  if (previewDocument.value) {
    handleDownload(previewDocument.value.id)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

const isPdfFile = (document: Document): boolean => {
  return document.fileType?.toLowerCase().includes('pdf') || false
}

const isImageFile = (document: Document): boolean => {
  const type = document.fileType?.toLowerCase() ?? ''
  return (
    type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')
  )
}

// Lifecycle
onMounted(async () => {
  await fetchDocuments()
  // TODO: 實現這些API端點後再啟用
  // await Promise.all([fetchDocuments(), fetchCategories(), fetchDownloadStats()])
})
</script>

<style scoped>
.documents-view {
  min-height: 80vh;
}

.pagination-link.is-current {
  background-color: #3273dc;
  border-color: #3273dc;
  color: #fff;
}
</style>
