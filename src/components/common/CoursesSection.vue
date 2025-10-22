<template>
  <section class="courses-section">
    <div class="container">
      <h2 class="section-title">開始您的藥局助理職涯之路</h2>
      <div class="courses-grid">
        <CourseCard
          v-for="course in courses"
          :key="course.id"
          :course="course"
          @view-details="handleViewDetails"
          @register-now="handleRegisterNow"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import CourseCard from './CourseCard.vue'

import type { Course } from '@/types'

const courses: Course[] = [
  {
    id: 1,
    title: '藥學入門',
    description: '基礎藥學知識課程',
    course_type: 'basic',
    duration_hours: 40,
    price: 5000,
    instructor_id: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: '保健食品專業知識',
    description: '進階保健食品課程',
    course_type: 'advanced',
    duration_hours: 60,
    price: 8000,
    instructor_id: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    title: '藥局實習',
    description: '實際藥局環境實習',
    course_type: 'internship',
    duration_hours: 120,
    price: 12000,
    instructor_id: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const handleViewDetails = (course: Course) => {
  console.log('查看詳情:', course.title)
  // TODO: 導航到課程詳情頁面
}

const handleRegisterNow = (course: Course) => {
  console.log('立即報名:', course.title)
  // TODO: 導航到報名頁面
}
</script>

<style scoped>
.courses-section {
  padding: 60px 0;
  background-color: #f9fafb;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 48px;
  line-height: 1.2;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .courses-section {
    padding: 40px 0;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 32px;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
