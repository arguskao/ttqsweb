<template>
  <div class="progress-bar-component">
    <div class="level is-mobile mb-2">
      <div class="level-left">
        <div class="level-item">
          <span class="has-text-weight-semibold">{{ label }}</span>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <span class="tag" :class="statusClass">{{ percentage }}%</span>
        </div>
      </div>
    </div>
    <progress
      class="progress"
      :class="progressClass"
      :value="percentage"
      max="100"
    >
      {{ percentage }}%
    </progress>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  percentage: number
  label?: string
  color?: 'primary' | 'info' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  label: '進度',
  color: 'primary'
})

const progressClass = computed(() => {
  return `is-${props.color}`
})

const statusClass = computed(() => {
  if (props.percentage >= 100) return 'is-success'
  if (props.percentage >= 75) return 'is-info'
  if (props.percentage >= 50) return 'is-warning'
  return 'is-light'
})
</script>

<style scoped>
.progress-bar-component {
  width: 100%;
}
</style>
