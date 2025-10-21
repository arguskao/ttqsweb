<template>
  <section class="section">
    <div class="container">
      <div class="has-text-centered mb-6">
        <h2 class="title is-2">精選課程</h2>
        <p class="subtitle">開始您的藥局助理職涯之路</p>
      </div>

      <div v-if="loading" class="has-text-centered">
        <p>載入課程中...</p>
      </div>

      <div v-else-if="error" class="notification is-danger">
        <p>{{ error }}</p>
      </div>

      <div v-else class="columns">
        <div v-for="course in displayedCourses" :key="course.id" class="column is-4">
          <CourseCard :course="course" />
        </div>
      </div>

      <div class="has-text-centered mt-6">
        <router-link to="/courses" class="button is-primary is-large">
          <span>查看所有課程</span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import CourseCard from './CourseCard.vue'

import { courseService } from '@/services/course-service'
import type { Course } from '@/types'

const courses = ref<Course[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const displayedCourses = computed(() => courses.value.slice(0, 3))

const fetchCourses = async () => {
  try {
    loading.value = true
    error.value = null
    courses.value = await courseService.getFeaturedCourses()
  } catch (err) {
    error.value = '載入課程失敗，請稍後再試'
    console.error('Error fetching courses:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
