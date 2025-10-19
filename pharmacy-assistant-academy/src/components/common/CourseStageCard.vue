<template>
  <div class="box">
    <h4 class="title is-4" :class="titleColorClass">{{ title }}</h4>
    <div class="content">
      <ul>
        <li v-for="item in items" :key="item">{{ item }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  items: string[]
  titleColor?: 'primary' | 'info' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  titleColor: 'primary'
})

const titleColorClass = computed(() => `has-text-${props.titleColor}`)
</script>