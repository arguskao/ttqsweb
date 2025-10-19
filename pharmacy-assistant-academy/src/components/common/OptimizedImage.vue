<template>
  <div class="optimized-image-container" :class="containerClass">
    <img
      ref="imageRef"
      :class="['optimized-image', { 'lazy': isLazy, 'loaded': isLoaded }]"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="isLazy ? 'lazy' : 'eager'"
      @load="onImageLoad"
      @error="onImageError"
    />
    <div v-if="!isLoaded && !hasError" class="image-placeholder">
      <div class="loading-spinner"></div>
    </div>
    <div v-if="hasError" class="image-error">
      <i class="fas fa-image"></i>
      <span>圖片載入失敗</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  lazy?: boolean
  webp?: boolean
  sizes?: string
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  lazy: true,
  webp: true,
  sizes: '100vw'
})

const imageRef = ref<HTMLImageElement>()
const isLoaded = ref(false)
const hasError = ref(false)
const isLazy = computed(() => props.lazy)

// Generate optimized image sources
const generateSources = () => {
  const baseSrc = props.src
  const sources = []
  
  if (props.webp) {
    // Generate WebP version
    const webpSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    sources.push({
      srcset: webpSrc,
      type: 'image/webp'
    })
  }
  
  // Original format as fallback
  sources.push({
    srcset: baseSrc,
    type: getImageType(baseSrc)
  })
  
  return sources
}

const getImageType = (src: string): string => {
  const extension = src.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/jpeg'
  }
}

const onImageLoad = () => {
  isLoaded.value = true
  hasError.value = false
}

const onImageError = () => {
  hasError.value = true
  isLoaded.value = false
}

onMounted(() => {
  if (imageRef.value) {
    // Set the src based on browser support
    const img = imageRef.value
    
    if (props.webp && supportsWebP()) {
      img.src = props.src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    } else {
      img.src = props.src
    }
    
    // Add intersection observer for lazy loading
    if (props.lazy && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement
            if (!image.src) {
              image.src = props.src
            }
            observer.unobserve(image)
          }
        })
      }, {
        rootMargin: '50px'
      })
      
      observer.observe(img)
    }
  }
})

// Check WebP support
const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}
</script>

<style scoped>
.optimized-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.optimized-image {
  display: block;
  width: 100%;
  height: auto;
  transition: opacity 0.3s ease;
}

.optimized-image.lazy {
  opacity: 0;
}

.optimized-image.loaded {
  opacity: 1;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #dbdbdb;
  border-top: 2px solid #00d1b2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #999;
  font-size: 0.875rem;
}

.image-error i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive image styles */
@media (max-width: 768px) {
  .optimized-image-container {
    width: 100%;
  }
}
</style>