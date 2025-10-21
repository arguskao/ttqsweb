<template>
  <div ref="containerRef" class="lazy-image-container" :class="containerClass">
    <!-- 加載中的佔位符 -->
    <div
      v-if="!loaded && !error && isIntersecting"
      class="lazy-image-loading"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p v-if="showLoadingText" class="loading-text">載入中...</p>
    </div>

    <!-- 錯誤狀態 -->
    <div
      v-if="error"
      class="lazy-image-error"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <p v-if="showErrorText" class="error-text">{{ errorText }}</p>
    </div>

    <!-- 實際圖片 -->
    <img
      v-if="loaded && !error"
      :src="optimizedSrc"
      :alt="alt"
      :width="width"
      :height="height"
      :class="imageClass"
      @load="onLoad"
      @error="onError"
      :loading="lazy ? 'lazy' : 'eager'"
    />

    <!-- 未加載時的佔位符 -->
    <div
      v-if="!loaded && !error && !isIntersecting"
      class="lazy-image-placeholder"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <div class="placeholder-content">
        <i class="fas fa-image"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLazyLoad } from '@/composables/usePerformance'

// Props
interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'auto'
  lazy?: boolean
  containerClass?: string
  imageClass?: string
  showLoadingText?: boolean
  showErrorText?: boolean
  errorText?: string
  placeholder?: string
  blur?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  height: 200,
  quality: 80,
  format: 'auto',
  lazy: true,
  showLoadingText: false,
  showErrorText: true,
  errorText: '圖片載入失敗',
  placeholder: '',
  blur: false
})

// Emits
const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
  intersect: [isIntersecting: boolean]
}>()

// 響應式數據
const loaded = ref(false)
const error = ref(false)
const loading = ref(false)

// 懶加載
const { elementRef: containerRef, isIntersecting } = useLazyLoad(props.lazy ? '50px' : '0px')

// 優化後的圖片URL
const optimizedSrc = computed(() => {
  if (!props.src) return ''

  try {
    const url = new URL(props.src, window.location.origin)

    // 添加尺寸參數
    if (props.width) url.searchParams.set('w', props.width.toString())
    if (props.height) url.searchParams.set('h', props.height.toString())

    // 添加質量參數
    url.searchParams.set('q', props.quality.toString())

    // 添加格式參數
    if (props.format !== 'auto') {
      url.searchParams.set('f', props.format)
    }

    // 添加模糊效果
    if (props.blur) {
      url.searchParams.set('blur', '5')
    }

    return url.toString()
  } catch {
    // 如果URL解析失敗，返回原始src
    return props.src
  }
})

// 圖片加載事件
const onLoad = (event: Event) => {
  loaded.value = true
  loading.value = false
  error.value = false
  emit('load', event)
}

// 圖片錯誤事件
const onError = (event: Event) => {
  error.value = true
  loading.value = false
  loaded.value = false
  emit('error', event)
}

// 開始加載圖片
const loadImage = () => {
  if (loaded.value || error.value || loading.value) return

  loading.value = true

  // 創建新的圖片對象來預加載
  const img = new Image()

  img.onload = () => {
    loaded.value = true
    loading.value = false
  }

  img.onerror = () => {
    error.value = true
    loading.value = false
  }

  img.src = optimizedSrc.value
}

// 監聽可見性變化
watch(isIntersecting, intersecting => {
  emit('intersect', intersecting)

  if (intersecting && props.lazy) {
    loadImage()
  }
})

// 監聽src變化
watch(
  () => props.src,
  () => {
    loaded.value = false
    error.value = false
    loading.value = false

    if (!props.lazy || isIntersecting.value) {
      loadImage()
    }
  }
)

// 如果不是懶加載，立即加載
onMounted(() => {
  if (!props.lazy) {
    loadImage()
  }
})

// 暴露方法
defineExpose({
  loadImage,
  loaded,
  error,
  loading
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.lazy-image-loading,
.lazy-image-error,
.lazy-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #666;
}

.lazy-image-loading {
  background-color: #fafafa;
}

.lazy-image-error {
  background-color: #fff5f5;
  border-color: #fed7d7;
  color: #c53030;
}

.lazy-image-placeholder {
  background-color: #f7fafc;
  border-color: #e2e8f0;
}

.loading-spinner {
  margin-bottom: 0.5rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text,
.error-text {
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}

.error-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.placeholder-content {
  font-size: 2rem;
  color: #cbd5e0;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .lazy-image-loading,
  .lazy-image-error,
  .lazy-image-placeholder {
    min-height: 120px;
  }

  .placeholder-content {
    font-size: 1.5rem;
  }

  .error-icon {
    font-size: 1.2rem;
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .lazy-image-loading,
  .lazy-image-error,
  .lazy-image-placeholder {
    border-color: #000;
  }

  .lazy-image-error {
    background-color: #fff;
    color: #000;
  }
}

/* 減少動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .lazy-image-loading,
  .lazy-image-placeholder {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #a0aec0;
  }

  .lazy-image-error {
    background-color: #742a2a;
    border-color: #9c1a1a;
    color: #fed7d7;
  }

  .placeholder-content {
    color: #4a5568;
  }
}
</style>
