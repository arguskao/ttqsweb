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
                    <span>🔍</span>
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
                        {{ categoryLabels[category] || category }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="column is-2">
              <button class="button is-light is-fullwidth" @click="resetFilters">
                <span class="icon">
                  <span>🔄</span>
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
                <span>📊</span>
              </span>
              <span>下載統計</span>
            </span>
          </h3>
          <div class="columns is-multiline">
            <div v-for="stat in downloadStats" :key="stat.category" class="column is-3">
              <div class="has-text-centered">
                <p class="heading">
                  {{ categoryLabels[stat.category] || stat.category || '其他' }}
                </p>
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
              <span>ℹ️</span>
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
              <span>⬇️</span>
            </span>
            <span>下載文件</span>
          </button>
          <button class="button" @click="closePreviewModal">關閉</button>
        </footer>
      </div>
    </div>

    <!-- Confidential Document Alert Modal -->
    <div class="modal" :class="{ 'is-active': showConfidentialModal }">
      <div class="modal-background" @click="closeConfidentialModal"></div>
      <div class="modal-card" style="max-width: 500px">
        <header class="modal-card-head has-background-warning">
          <p class="modal-card-title">
            <span class="icon-text">
              <span class="icon has-text-dark">
                <span style="font-size: 1.5rem">⚠️</span>
              </span>
              <span class="has-text-dark">機密文件</span>
            </span>
          </p>
          <button class="delete" aria-label="close" @click="closeConfidentialModal"></button>
        </header>
        <section class="modal-card-body has-text-centered">
          <div class="content">
            <p class="is-size-5 mb-4">
              <span class="icon is-large has-text-warning">
                <span style="font-size: 3rem">🔒</span>
              </span>
            </p>
            <p class="is-size-5 has-text-weight-semibold mb-3">此為機密文件</p>
            <p class="has-text-grey">
              此文件目前無法下載，如需存取權限，<br />
              請聯繫網站管理員。
            </p>
          </div>
        </section>
        <footer class="modal-card-foot" style="justify-content: center">
          <button class="button is-warning" @click="closeConfidentialModal">
            <span class="icon">
              <span>✓</span>
            </span>
            <span>我知道了</span>
          </button>
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

// 分類映射（英文值 -> 中文顯示）- 從 API 動態載入
const categoryLabels = ref<Record<string, string>>({
  general: '一般文件',
  course: '課程資料',
  documents: '文檔',
  images: '圖片',
  reference: '參考資料',
  ttqs: 'TTQS文件'
})

// Preview Modal
const showPreviewModal = ref(false)
const previewDocument = ref<Document | null>(null)

// Confidential Alert Modal
const showConfidentialModal = ref(false)

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
        : (response.data.data.documents ?? [])
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
    // 獲取分類詳細資訊（包含中文名稱）
    const response = await api.get('/files/categories/details')
    if (response.data.success) {
      const categoryDetails = response.data.data

      // 設置分類鍵值列表
      categories.value = categoryDetails.map((cat: any) => cat.key)

      // 設置分類映射（英文 -> 中文）
      const labels: Record<string, string> = {}
      categoryDetails.forEach((cat: any) => {
        labels[cat.key] = cat.name
      })
      categoryLabels.value = labels
    }
  } catch (err) {
    console.error('載入分類失敗:', err)
  }
}

const fetchDownloadStats = async () => {
  try {
    const response = await api.get('/files/stats/downloads')
    if (response.data.success) {
      downloadStats.value = response.data.data || []
    }
  } catch (err) {
    console.error('載入統計資料失敗:', err)
    // 忽略錯誤，統計資料是可選的
    downloadStats.value = []
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
    // 先驗證檔案是否可用
    const validateResponse = await api.get(`/documents/${documentId}/validate`)
    
    if (!validateResponse.data.success || !validateResponse.data.data.isValid) {
      showConfidentialAlert()
      return
    }

    // 檔案有效，獲取下載資訊
    const response = await api.get(`/documents/${documentId}/download`)

    if (response.data.success) {
      const { file_url } = response.data.data

      // 開啟下載
      window.open(file_url, '_blank')

      // Refresh documents to update download count
      await fetchDocuments()
    }
  } catch (err: unknown) {
    const errorMessage = (err as any)?.response?.data?.error?.message || ''
    const errorCode = (err as any)?.response?.data?.error?.code || ''
    
    // 如果是檔案不可用的錯誤,顯示機密文件提示
    if (
      errorCode === 'FILE_UNAVAILABLE' ||
      errorCode === 'NOT_FOUND' ||
      errorMessage.includes('不存在') ||
      errorMessage.includes('不可下載') ||
      (err as any)?.response?.status === 404
    ) {
      showConfidentialAlert()
    } else {
      error.value = errorMessage || '下載文件失敗'
    }
  }
}

const showConfidentialAlert = () => {
  showConfidentialModal.value = true
}

const closeConfidentialModal = () => {
  showConfidentialModal.value = false
}

const handlePreview = (document: Document) => {
  previewDocument.value = document
  showPreviewModal.value = true
}

const closePreviewModal = () => {
  showPreviewModal.value = false
  previewDocument.value = null
}

const handleDownloadFromPreview = async () => {
  if (previewDocument.value) {
    await handleDownload(previewDocument.value.id)
    // 如果下載成功,關閉預覽視窗
    if (!error.value) {
      closePreviewModal()
    }
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
  await Promise.all([fetchDocuments(), fetchCategories(), fetchDownloadStats()])
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
