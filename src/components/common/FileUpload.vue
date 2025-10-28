<template>
  <div class="file-upload">
    <div
      class="upload-area"
      :class="{ 'is-dragover': isDragOver, 'is-uploading': isUploading }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
    >
      <div v-if="!isUploading" class="upload-content">
        <span class="icon is-large has-text-primary">
          <i class="fas fa-cloud-upload-alt fa-3x"></i>
        </span>
        <p class="title is-5 mt-4">拖曳文件到此處或點擊上傳</p>
        <p class="subtitle is-6 has-text-grey">
          支持的文件類型：圖片、PDF、Word、Excel、PowerPoint、視頻
        </p>
        <p class="subtitle is-7 has-text-grey-light">最大文件大小：50MB</p>
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          :accept="acceptedFileTypes"
          @change="handleFileSelect"
        />
        <button class="button is-primary mt-3" @click="triggerFileInput">
          <span class="icon">
            <i class="fas fa-upload"></i>
          </span>
          <span>選擇文件</span>
        </button>
      </div>

      <div v-else class="upload-progress">
        <span class="icon is-large has-text-info">
          <i class="fas fa-spinner fa-pulse fa-3x"></i>
        </span>
        <p class="title is-5 mt-4">上傳中...</p>
        <progress class="progress is-primary" :value="uploadProgress" max="100">
          {{ uploadProgress }}%
        </progress>
        <p class="has-text-grey">{{ uploadProgress }}%</p>
      </div>
    </div>

    <!-- 文件信息表單 -->
    <div v-if="selectedFile && !isUploading" class="box mt-4">
      <h3 class="title is-5">文件信息</h3>
      <div class="field">
        <label class="label">文件名稱</label>
        <div class="control">
          <input
            v-model="fileInfo.title"
            class="input"
            type="text"
            placeholder="輸入文件標題"
          />
        </div>
      </div>

      <div class="field">
        <label class="label">文件描述</label>
        <div class="control">
          <textarea
            v-model="fileInfo.description"
            class="textarea"
            placeholder="輸入文件描述（可選）"
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="field">
        <label class="label">文件分類</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="fileInfo.category">
              <option value="general">一般文件</option>
              <option value="course_materials">課程資料</option>
              <option value="user_avatars">用戶頭像</option>
              <option value="documents">文檔</option>
              <option value="images">圖片</option>
              <option value="videos">視頻</option>
              <option value="ttqs">TTQS文件</option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="checkbox">
          <input v-model="fileInfo.isPublic" type="checkbox" />
          公開文件（所有用戶可見）
        </label>
      </div>

      <div class="field is-grouped">
        <div class="control">
          <button class="button is-primary" @click="uploadFile" :disabled="!fileInfo.title">
            <span class="icon">
              <i class="fas fa-upload"></i>
            </span>
            <span>開始上傳</span>
          </button>
        </div>
        <div class="control">
          <button class="button is-light" @click="cancelUpload">取消</button>
        </div>
      </div>

      <!-- 文件預覽 -->
      <div v-if="filePreview" class="mt-4">
        <p class="label">文件預覽</p>
        <figure v-if="isImageFile" class="image is-128x128">
          <img :src="filePreview" :alt="fileInfo.title" />
        </figure>
        <div v-else class="notification is-info is-light">
          <p>
            <strong>{{ selectedFile.name }}</strong>
          </p>
          <p class="is-size-7">大小：{{ formatFileSize(selectedFile.size) }}</p>
          <p class="is-size-7">類型：{{ selectedFile.type }}</p>
        </div>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="error" class="notification is-danger mt-4">
      <button class="delete" @click="error = null"></button>
      {{ error }}
    </div>

    <!-- 成功提示 -->
    <div v-if="success" class="notification is-success mt-4">
      <button class="delete" @click="success = null"></button>
      {{ success }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/services/api'

const emit = defineEmits(['upload-success', 'upload-error'])

// State
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const filePreview = ref<string | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const fileInfo = ref({
  title: '',
  description: '',
  category: 'general',
  isPublic: true
})

// Accepted file types
const acceptedFileTypes = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/*'
].join(',')

// Computed
const isImageFile = computed(() => {
  return selectedFile.value?.type.startsWith('image/')
})

// Methods
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  // Validate file size (50MB)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = '文件大小超過 50MB 限制'
    return
  }

  // Validate file type
  const allowedTypes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'video/'
  ]

  const isAllowed = allowedTypes.some((type) => file.type.startsWith(type))
  if (!isAllowed) {
    error.value = '不支持的文件類型'
    return
  }

  selectedFile.value = file
  fileInfo.value.title = file.name

  // Generate preview for images
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      filePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    filePreview.value = null
  }

  error.value = null
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadProgress.value = 0
  error.value = null
  success.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('title', fileInfo.value.title)
    formData.append('description', fileInfo.value.description)
    formData.append('category', fileInfo.value.category)
    formData.append('is_public', fileInfo.value.isPublic.toString())

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    if (response.data.success) {
      success.value = '文件上傳成功！'
      emit('upload-success', response.data.data)
      resetForm()
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '文件上傳失敗'
    emit('upload-error', err)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const cancelUpload = () => {
  resetForm()
}

const resetForm = () => {
  selectedFile.value = null
  filePreview.value = null
  fileInfo.value = {
    title: '',
    description: '',
    category: 'general',
    isPublic: true
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #dbdbdb;
  border-radius: 6px;
  padding: 3rem;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #fafafa;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #3273dc;
  background-color: #f5f5f5;
}

.upload-area.is-dragover {
  border-color: #3273dc;
  background-color: #eff5fb;
  transform: scale(1.02);
}

.upload-area.is-uploading {
  border-color: #3273dc;
  background-color: #fff;
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.upload-content,
.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.progress {
  width: 100%;
  max-width: 400px;
  margin-top: 1rem;
}
</style>
