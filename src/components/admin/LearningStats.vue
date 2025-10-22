<template>
  <div class="box">
    <h2 class="title is-4">學習統計</h2>

    <div class="columns">
      <div class="column is-6">
        <h3 class="subtitle is-5">課程完成率</h3>
        <div class="progress-container">
          <div class="progress-wrapper">
            <div class="progress-label">基礎課程</div>
            <progress
              class="progress is-primary"
              :value="learningStats.basicCourseCompletion"
              max="100"
            >
              {{ learningStats.basicCourseCompletion }}%
            </progress>
            <span class="progress-text">{{ learningStats.basicCourseCompletion }}%</span>
          </div>

          <div class="progress-wrapper">
            <div class="progress-label">進階課程</div>
            <progress
              class="progress is-info"
              :value="learningStats.advancedCourseCompletion"
              max="100"
            >
              {{ learningStats.advancedCourseCompletion }}%
            </progress>
            <span class="progress-text">{{ learningStats.advancedCourseCompletion }}%</span>
          </div>

          <div class="progress-wrapper">
            <div class="progress-label">實務課程</div>
            <progress
              class="progress is-success"
              :value="learningStats.practicalCourseCompletion"
              max="100"
            >
              {{ learningStats.practicalCourseCompletion }}%
            </progress>
            <span class="progress-text">{{ learningStats.practicalCourseCompletion }}%</span>
          </div>
        </div>
      </div>

      <div class="column is-6">
        <h3 class="subtitle is-5">熱門課程</h3>
        <div class="popular-courses">
          <div v-for="course in learningStats.popularCourses" :key="course.id" class="course-item">
            <div class="course-info">
              <div class="course-name">{{ course.name }}</div>
              <div class="course-stats">
                <span class="enrollment-count">{{ course.enrollmentCount }} 人報名</span>
                <span class="completion-rate">{{ course.completionRate }}% 完成</span>
              </div>
            </div>
            <div class="course-rating">
              <div class="stars">
                <i
                  v-for="star in 5"
                  :key="star"
                  class="fas fa-star"
                  :class="{
                    'has-text-warning': star <= course.rating,
                    'has-text-light': star > course.rating
                  }"
                ></i>
              </div>
              <span class="rating-text">{{ course.rating.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PopularCourse {
  id: number
  name: string
  enrollmentCount: number
  completionRate: number
  rating: number
}

interface LearningStats {
  basicCourseCompletion: number
  advancedCourseCompletion: number
  practicalCourseCompletion: number
  popularCourses: PopularCourse[]
}

interface Props {
  learningStats: LearningStats
}

defineProps<Props>()
</script>

<style scoped>
.progress-container {
  margin-bottom: 1rem;
}

.progress-wrapper {
  margin-bottom: 1rem;
}

.progress-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #363636;
}

.progress-text {
  margin-left: 0.5rem;
  font-weight: 600;
  color: #3273dc;
}

.popular-courses {
  max-height: 300px;
  overflow-y: auto;
}

.course-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background: #fafafa;
}

.course-info {
  flex: 1;
}

.course-name {
  font-weight: 600;
  color: #363636;
  margin-bottom: 0.25rem;
}

.course-stats {
  font-size: 0.875rem;
  color: #666;
}

.enrollment-count {
  margin-right: 1rem;
}

.completion-rate {
  color: #48c774;
  font-weight: 600;
}

.course-rating {
  text-align: right;
}

.stars {
  margin-bottom: 0.25rem;
}

.rating-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffdd57;
}
</style>

