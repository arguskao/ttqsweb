<template>
  <div class="card">
    <div class="card-content has-text-centered">
      <div class="content">
        <div class="icon is-large" :class="iconColorClass" style="font-size: 3rem;">
          {{ icon }}
        </div>
        <h3 class="title is-4">{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  title: string
  description: string
  iconColor?: 'primary' | 'info' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary'
})

const iconColorClass = computed(() => `has-text-${props.iconColor}`)
</script>
