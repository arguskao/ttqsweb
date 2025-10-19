<template>
  <div class="card">
    <div class="card-content">
      <div class="content">
        <div class="level is-mobile">
          <div class="level-left">
            <div class="level-item">
              <span class="tag" :class="courseTypeClass">{{ courseTypeLabel }}</span>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <span class="has-text-weight-semibold has-text-primary">NT$ {{ course.price.toLocaleString() }}</span>
            </div>
          </div>
        </div>
        
        <h4 class="title is-5">{{ course.title }}</h4>
        <p class="subtitle is-6">{{ course.description }}</p>
        
        <div class="level is-mobile">
          <div class="level-left">
            <div class="level-item">
              <span class="icon-text">
                <span class="icon">
                  <i class="fas fa-clock"></i>
                </span>
                <span>{{ course.durationHours }} 小時</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <footer class="card-footer">
      <router-link 
        :to="`/courses/${course.id}`" 
        class="card-footer-item button is-primary is-light"
      >
        <span class="icon">
          <i class="fas fa-info-circle"></i>
        </span>
        <span>查看詳情</span>
      </router-link>
      
      <a 
        href="#" 
        @click.prevent="handleEnroll"
        class="card-footer-item button is-primary"
      >
        <span class="icon">
          <i class="fas fa-graduation-cap"></i>
        </span>
        <span>立即報名</span>
      </a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Course } from '@/types'

interface Props {
  course: Course
}

const props = defineProps<Props>()

const courseTypeClass = computed(() => {
  switch (props.course.courseType) {
    case 'basic':
      return 'is-info'
    case 'advanced':
      return 'is-warning'
    case 'internship':
      return 'is-success'
    default:
      return 'is-light'
  }
})

const courseTypeLabel = computed(() => {
  switch (props.course.courseType) {
    case 'basic':
      return '基礎課程'
    case 'advanced':
      return '進階課程'
    case 'internship':
      return '實習課程'
    default:
      return '課程'
  }
})

const emit = defineEmits<{
  enroll: []
}>()

const handleEnroll = () => {
  emit('enroll')
}
</script>