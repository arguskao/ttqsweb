<template>
  <div class="card job-card">
    <div class="card-content">
      <div class="media">
        <div class="media-content">
          <p class="title is-5">{{ job.title }}</p>
          <p class="subtitle is-6">{{ job.employerName || '未提供雇主名稱' }}</p>
        </div>
        <div class="media-right">
          <button 
            v-if="showFavorite" 
            class="button is-white" 
            @click="toggleFavorite"
            :class="{ 'has-text-danger': isFavorited }"
          >
            <span class="icon">
              <i :class="isFavorited ? 'fas fa-heart' : 'far fa-heart'"></i>
            </span>
          </button>
        </div>
      </div>

      <div class="content">
        <p class="job-description">
          {{ truncatedDescription }}
        </p>

        <div class="tags">
          <span v-if="job.jobType" class="tag is-info">
            {{ jobTypeLabel }}
          </span>
          <span v-if="job.location" class="tag is-light">
            <span class="icon is-small">
              <i class="fas fa-map-marker-alt"></i>
            </span>
            <span>{{ job.location }}</span>
          </span>
          <span v-if="salaryRange" class="tag is-success is-light">
            <span class="icon is-small">
              <i class="fas fa-dollar-sign"></i>
            </span>
            <span>{{ salaryRange }}</span>
          </span>
        </div>

        <div class="job-meta">
          <small class="has-text-grey">
            發布於 {{ formattedDate }}
          </small>
          <span v-if="job.expiresAt" class="has-text-grey-light">
            <small> • 截止於 {{ formattedExpiryDate }}</small>
          </span>
        </div>
      </div>
    </div>

    <footer class="card-footer">
      <a class="card-footer-item" @click="viewDetails">
        查看詳情
      </a>
      <a v-if="showApply && !job.hasApplied" class="card-footer-item has-text-primary" @click="applyNow">
        立即申請
      </a>
      <span v-else-if="job.hasApplied" class="card-footer-item has-text-grey">
        已申請
      </span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Job {
  id: number
  title: string
  description?: string | null
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  jobType?: 'full_time' | 'part_time' | 'internship' | null
  employerName?: string
  createdAt: string
  expiresAt?: string | null
  hasApplied?: boolean
}

interface Props {
  job: Job
  showFavorite?: boolean
  showApply?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFavorite: true,
  showApply: true
})

const emit = defineEmits<{
  viewDetails: [jobId: number]
  apply: [jobId: number]
  toggleFavorite: [jobId: number]
}>()

const isFavorited = ref(false)

const jobTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    full_time: '全職',
    part_time: '兼職',
    internship: '實習'
  }
  return props.job.jobType ? labels[props.job.jobType] : ''
})

const truncatedDescription = computed(() => {
  if (!props.job.description) return '無職缺描述'
  return props.job.description.length > 150
    ? props.job.description.substring(0, 150) + '...'
    : props.job.description
})

const salaryRange = computed(() => {
  const { salaryMin, salaryMax } = props.job
  if (!salaryMin && !salaryMax) return null
  if (salaryMin && salaryMax) {
    return `NT$ ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}`
  }
  if (salaryMin) return `NT$ ${salaryMin.toLocaleString()}+`
  if (salaryMax) return `最高 NT$ ${salaryMax.toLocaleString()}`
  return null
})

const formattedDate = computed(() => {
  return new Date(props.job.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedExpiryDate = computed(() => {
  if (!props.job.expiresAt) return ''
  return new Date(props.job.expiresAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const viewDetails = () => {
  emit('viewDetails', props.job.id)
}

const applyNow = () => {
  emit('apply', props.job.id)
}

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  emit('toggleFavorite', props.job.id)
}
</script>

<style scoped>
.job-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.job-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-content {
  flex: 1;
}

.job-description {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.tags {
  margin-bottom: 0.75rem;
}

.job-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.card-footer-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.card-footer-item:hover {
  background-color: #f5f5f5;
}
</style>
