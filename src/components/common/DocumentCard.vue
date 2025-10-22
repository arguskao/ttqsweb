<template>
  <div class="card">
    <div class="card-content">
      <div class="content">
        <div class="level is-mobile mb-3">
          <div class="level-left">
            <div class="level-item">
              <span class="tag is-info">{{ document.category || '一般文件' }}</span>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <span class="icon-text has-text-grey">
                <span class="icon">
                  <i class="fas fa-download"></i>
                </span>
                <span>{{ document.downloadCount ?? 0 }} 次</span>
              </span>
            </div>
          </div>
        </div>

        <h4 class="title is-5">
          <span class="icon-text">
            <span class="icon has-text-primary">
              <i :class="fileIconClass"></i>
            </span>
            <span>{{ document.title }}</span>
          </span>
        </h4>

        <p v-if="document.description" class="subtitle is-6 has-text-grey">
          {{ document.description }}
        </p>

        <div class="level is-mobile">
          <div class="level-left">
            <div class="level-item">
              <span class="icon-text has-text-grey-light">
                <span class="icon">
                  <i class="fas fa-file"></i>
                </span>
                <span>{{ fileTypeLabel }}</span>
              </span>
            </div>
            <div v-if="document.fileSize" class="level-item">
              <span class="icon-text has-text-grey-light">
                <span class="icon">
                  <i class="fas fa-hdd"></i>
                </span>
                <span>{{ formatFileSize(document.fileSize) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="card-footer">
      <a
        href="#"
        @click.prevent="handlePreview"
        class="card-footer-item"
      >
        <span class="icon">
          <i class="fas fa-eye"></i>
        </span>
        <span>預覽</span>
      </a>

      <a
        href="#"
        @click.prevent="handleDownload"
        class="card-footer-item has-text-primary"
      >
        <span class="icon">
          <i class="fas fa-download"></i>
        </span>
        <span>下載</span>
      </a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

interface Props {
  document: Document
}

const props = defineProps<Props>()

const emit = defineEmits<{
  download: [id: number]
  preview: [document: Document]
}>()

const fileIconClass = computed(() => {
  const type = props.document.fileType?.toLowerCase() ?? ''

  if (type.includes('pdf')) return 'fas fa-file-pdf'
  if (type.includes('word') || type.includes('doc')) return 'fas fa-file-word'
  if (type.includes('excel') || type.includes('xls')) return 'fas fa-file-excel'
  if (type.includes('powerpoint') || type.includes('ppt')) return 'fas fa-file-powerpoint'
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return 'fas fa-file-image'
  if (type.includes('zip') || type.includes('rar')) return 'fas fa-file-archive'

  return 'fas fa-file-alt'
})

const fileTypeLabel = computed(() => {
  const type = props.document.fileType?.toLowerCase() ?? ''

  if (type.includes('pdf')) return 'PDF'
  if (type.includes('word') || type.includes('doc')) return 'Word'
  if (type.includes('excel') || type.includes('xls')) return 'Excel'
  if (type.includes('powerpoint') || type.includes('ppt')) return 'PowerPoint'
  if (type.includes('image')) return '圖片'
  if (type.includes('zip') || type.includes('rar')) return '壓縮檔'

  return props.document.fileType || '文件'
})

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`
}

const handleDownload = () => {
  emit('download', props.document.id)
}

const handlePreview = () => {
  emit('preview', props.document)
}
</script>
