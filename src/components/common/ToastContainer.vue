<template>
  <Teleport to="body">
    <div class="toast-container">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :title="toast.title"
        :type="toast.type"
        :duration="toast.duration"
        :closable="toast.closable"
        @close="removeToast(toast.id)"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Toast from './Toast.vue'

export interface ToastOptions {
  id: string
  message: string
  title?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  closable?: boolean
}

const toasts = ref<ToastOptions[]>([])

const addToast = (options: Omit<ToastOptions, 'id'>) => {
  const id = `toast-${Date.now()}-${Math.random()}`
  toasts.value.push({ id, ...options })
  return id
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

defineExpose({
  addToast,
  removeToast
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
}
</style>
