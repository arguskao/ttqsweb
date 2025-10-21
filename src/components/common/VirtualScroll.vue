<template>
  <div 
    ref="containerRef" 
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-scroll-content"
      :style="{ height: totalHeight + 'px' }"
    >
      <div
        v-for="item in visibleItems"
        :key="item.index"
        class="virtual-scroll-item"
        :style="{ 
          position: 'absolute',
          top: item.top + 'px',
          height: itemHeight + 'px',
          width: '100%'
        }"
      >
        <slot :item="item.data" :index="item.index" />
      </div>
    </div>
    
    <!-- 加載指示器 -->
    <div v-if="isLoading" class="virtual-scroll-loading">
      <div class="loader"></div>
      <p>載入中...</p>
    </div>
    
    <!-- 空狀態 -->
    <div v-if="!isLoading && items.length === 0" class="virtual-scroll-empty">
      <div class="empty-icon">
        <i class="fas fa-inbox"></i>
      </div>
      <p class="empty-text">{{ emptyText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVirtualScroll } from '@/composables/usePerformance'

// Props
interface Props {
  items: any[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  isLoading?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  overscan: 5,
  isLoading: false,
  emptyText: '暫無數據'
})

// Emits
const emit = defineEmits<{
  'scroll': [scrollTop: number]
  'load-more': []
}>()

// 使用虛擬滾動
const itemsRef = ref(props.items)
const { containerRef, visibleItems, totalHeight, scrollTop } = useVirtualScroll(
  itemsRef,
  {
    itemHeight: props.itemHeight,
    containerHeight: props.containerHeight,
    overscan: props.overscan
  }
)

// 監聽滾動事件
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight
  
  // 觸發滾動事件
  emit('scroll', scrollTop)
  
  // 檢查是否需要加載更多
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    emit('load-more')
  }
}

// 監聽items變化
watch(() => props.items, (newItems) => {
  itemsRef.value = newItems
}, { deep: true })

// 滾動到指定位置
const scrollToIndex = (index: number) => {
  if (containerRef.value) {
    const scrollTop = index * props.itemHeight
    containerRef.value.scrollTop = scrollTop
  }
}

// 滾動到頂部
const scrollToTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

// 滾動到底部
const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight
  }
}

// 獲取可見範圍
const getVisibleRange = () => {
  if (!containerRef.value) return { start: 0, end: 0 }
  
  const scrollTop = containerRef.value.scrollTop
  const start = Math.floor(scrollTop / props.itemHeight)
  const end = Math.min(
    start + Math.ceil(props.containerHeight / props.itemHeight),
    props.items.length
  )
  
  return { start, end }
}

// 暴露方法
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getVisibleRange
})
</script>

<style scoped>
.virtual-scroll-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.virtual-scroll-content {
  position: relative;
}

.virtual-scroll-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.virtual-scroll-item:last-child {
  border-bottom: none;
}

.virtual-scroll-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.virtual-scroll-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ccc;
}

.empty-text {
  font-size: 1.1rem;
  margin: 0;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 自定義滾動條樣式 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .virtual-scroll-item {
    padding: 0.75rem 0.5rem;
  }
  
  .empty-icon {
    font-size: 2rem;
  }
  
  .empty-text {
    font-size: 1rem;
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .virtual-scroll-container {
    border-color: #000;
  }
  
  .virtual-scroll-item {
    border-bottom-color: #000;
  }
  
  .virtual-scroll-loading {
    background: #fff;
    border: 1px solid #000;
  }
}

/* 減少動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  .loader {
    animation: none;
  }
  
  .virtual-scroll-container {
    scroll-behavior: auto;
  }
}
</style>
