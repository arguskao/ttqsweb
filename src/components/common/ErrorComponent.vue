<template>
  <div class="error-component">
    <div class="error-icon">
      <i class="fas fa-exclamation-triangle"></i>
    </div>
    <h3 class="error-title">{{ title }}</h3>
    <p class="error-message">{{ message }}</p>

    <div class="error-actions">
      <button @click="retry" class="button is-primary">
        <span class="icon">
          <i class="fas fa-redo"></i>
        </span>
        <span>重試</span>
      </button>

      <button @click="goHome" class="button is-light">
        <span class="icon">
          <i class="fas fa-home"></i>
        </span>
        <span>回到首頁</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '載入失敗',
  message: '組件載入時發生錯誤，請重試或回到首頁。'
})

const router = useRouter()

const retry = () => {
  window.location.reload()
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.error-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 300px;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: #ff6b6b;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.error-message {
  margin-bottom: 2rem;
  color: #666;
  line-height: 1.6;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
    width: 100%;
    max-width: 200px;
  }

  .error-actions .button {
    width: 100%;
  }
}
</style>
