<template>
  <div class="course-card">
    <div class="course-tag" :class="tagClass">
      {{ courseTypeText }}
    </div>
    <div class="course-price">NT$ {{ formatPrice(course.price) }}</div>
    <h3 class="course-title">{{ course.title }}</h3>
    <p class="course-subtitle">{{ course.description }}</p>
    <div class="course-duration">
      <span class="duration-icon">⏰</span>
      <span>{{ course.durationHours || course.duration_hours || 0 }} 小時</span>
    </div>
    <div class="course-actions">
      <button class="button is-light is-success" @click="viewDetails">
        <span class="button-icon">👁️</span>
        查看詳情
      </button>
      <button class="button is-primary" @click="registerNow">
        <span class="button-icon">✅</span>
        立即報名
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Course } from '@/types'

interface Props {
  course: Course
}

const props = defineProps<Props>()

const emit = defineEmits<{
  viewDetails: [course: Course]
  registerNow: [course: Course]
}>()

const courseTypeText = computed(() => {
  const typeMap = {
    basic: '基礎課程',
    advanced: '進階課程',
    internship: '實習課程'
  }
  const courseType = props.course.courseType || props.course.course_type
  return typeMap[courseType as keyof typeof typeMap] || courseType || '未知課程'
})

const tagClass = computed(() => {
  const classMap = {
    basic: 'basic',
    advanced: 'advanced',
    internship: 'internship'
  }
  const courseType = props.course.courseType || props.course.course_type
  return classMap[courseType as keyof typeof classMap] || 'basic'
})

const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toLocaleString()
}

const viewDetails = () => {
  emit('viewDetails', props.course)
}

const registerNow = () => {
  emit('registerNow', props.course)
}
</script>

<style scoped>
.course-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.course-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.course-tag.basic {
  background-color: #3b82f6;
}

.course-tag.advanced {
  background-color: #f59e0b;
}

.course-tag.internship {
  background-color: #10b981;
}

.course-price {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.course-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 40px 0 8px 0;
  line-height: 1.3;
}

.course-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.course-duration {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 24px;
}

.duration-icon {
  font-size: 1rem;
}

.course-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.course-actions .button {
  flex: 1;
  font-weight: 600;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
}

.course-actions .button.is-light.is-success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.course-actions .button.is-light.is-success:hover {
  background-color: #bbf7d0;
}

.course-actions .button.is-primary {
  background-color: #0d9488;
  border-color: #0d9488;
}

.course-actions .button.is-primary:hover {
  background-color: #0f766e;
  border-color: #0f766e;
}

.button-icon {
  margin-right: 6px;
  font-size: 0.875rem;
}
</style>
