<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero is-primary is-medium">
      <div class="hero-body">
        <div class="container has-text-centered">
          <h1 class="title is-1">藥助Next學院</h1>
          <h2 class="subtitle is-3">專業藥局助理轉職教育平台</h2>
          <div class="content is-large">
            <p class="has-text-weight-semibold">職能導向 • 實務結合 • 就業媒合</p>
          </div>
          <div class="buttons is-centered">
            <router-link to="/courses" class="button is-white is-large">
              <span class="icon">
                🎓
              </span>
              <span>開始學習</span>
            </router-link>
            <router-link to="/jobs" class="button is-light is-large">
              <span class="icon">
                💼
              </span>
              <span>尋找工作</span>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Policy Section -->
    <section class="section">
      <div class="container">
        <div class="has-text-centered mb-6">
          <h2 class="title is-2">訓練核心政策</h2>
          <p class="subtitle">我們的教學理念與特色</p>
        </div>

        <div class="columns">
          <div class="column">
            <PolicyCard
              icon="🎓"
              title="職能導向"
              description="針對藥局實際工作需求，設計專業職能課程，確保學員具備即戰力"
              icon-color="primary"
            />
          </div>

          <div class="column">
            <PolicyCard
              icon="⚙️"
              title="實務結合"
              description="強調實務操作與理論結合，提供真實藥局環境的學習體驗"
              icon-color="info"
            />
          </div>

          <div class="column">
            <PolicyCard
              icon="💼"
              title="就業媒合"
              description="提供完整的就業媒合服務，協助學員成功轉職進入醫藥產業"
              icon-color="success"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Course Carousel Section -->
    <CourseCarousel />

    <!-- Courses Section -->
    <CoursesSection />

    <!-- Course Stages Section -->
    <section class="section has-background-light">
      <div class="container">
        <div class="has-text-centered mb-6">
          <h2 class="title is-2">分階段課程設計</h2>
          <p class="subtitle">循序漸進的學習路徑</p>
        </div>

        <div class="columns">
          <div class="column">
            <CourseStageCard
              title="基礎階段"
              :items="basicStageItems"
              title-color="primary"
            />
          </div>

          <div class="column">
            <CourseStageCard
              title="進階階段"
              :items="advancedStageItems"
              title-color="info"
            />
          </div>

          <div class="column">
            <CourseStageCard
              title="實習階段"
              :items="internshipStageItems"
              title-color="success"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import CourseCarousel from '@/components/common/CourseCarousel.vue'
import CoursesSection from '@/components/common/CoursesSection.vue'
import CourseStageCard from '@/components/common/CourseStageCard.vue'
import PolicyCard from '@/components/common/PolicyCard.vue'

// Course stage data
const basicStageItems = [
  '藥學入門知識',
  '庫存管理基礎',
  '溝通技巧培養',
  '職場倫理規範'
]

const advancedStageItems = [
  '保健食品專業知識',
  '處方箋辨識技能',
  '櫃台管理實務',
  '醫療法規應用'
]

const internshipStageItems = [
  '實際藥局實習',
  '職場適應訓練',
  '專業技能驗證',
  '就業準備輔導'
]
</script>
