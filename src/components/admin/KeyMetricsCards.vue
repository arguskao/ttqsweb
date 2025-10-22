<template>
  <div class="columns">
    <div class="column is-3">
      <div class="box has-text-centered">
        <div class="icon is-large has-text-primary">
          <i class="fas fa-users fa-2x"></i>
        </div>
        <p class="title">{{ metrics.total_learners }}</p>
        <p class="subtitle">總學員數</p>
        <div class="has-text-success">
          <i class="fas fa-arrow-up"></i>
          <span>{{ metrics.learners_growth }}%</span>
        </div>
      </div>
    </div>
    <div class="column is-3">
      <div class="box has-text-centered">
        <div class="icon is-large has-text-info">
          <i class="fas fa-book fa-2x"></i>
        </div>
        <p class="title">{{ metrics.active_courses }}</p>
        <p class="subtitle">活躍課程</p>
        <div class="has-text-success">
          <i class="fas fa-arrow-up"></i>
          <span>{{ metrics.courses_growth }}%</span>
        </div>
      </div>
    </div>
    <div class="column is-3">
      <div class="box has-text-centered">
        <div class="icon is-large has-text-warning">
          <i class="fas fa-briefcase fa-2x"></i>
        </div>
        <p class="title">{{ metrics.active_jobs }}</p>
        <p class="subtitle">活躍職缺</p>
        <div class="has-text-success">
          <i class="fas fa-arrow-up"></i>
          <span>{{ metrics.jobs_growth }}%</span>
        </div>
      </div>
    </div>
    <div class="column is-3">
      <div class="box has-text-centered">
        <div class="icon is-large has-text-success">
          <i class="fas fa-chalkboard-teacher fa-2x"></i>
        </div>
        <p class="title">{{ metrics.active_instructors }}</p>
        <p class="subtitle">活躍講師</p>
        <div class="has-text-success">
          <i class="fas fa-arrow-up"></i>
          <span>{{ metrics.instructors_growth }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface KeyMetrics {
  total_learners: number
  active_courses: number
  active_jobs: number
  active_instructors: number
  learners_growth: number
  courses_growth: number
  jobs_growth: number
  instructors_growth: number
}

interface Props {
  metrics: KeyMetrics
}

defineProps<Props>()
</script>

<style scoped>
.icon {
  margin-bottom: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 0.5rem;
}

.has-text-success {
  font-size: 0.9rem;
}
</style>

