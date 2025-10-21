<template>
  <div
    ref="containerRef"
    class="virtual-list"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div
        v-for="item in visibleItems"
        :key="item.index"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface VirtualListItem<T> {
  data: T
  index: number
  top: number
}

interface Props<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  getItemKey?: (item: T, index: number) => string | number
}

const props = withDefaults(defineProps<Props<any>>(), {
  overscan: 5,
  getItemKey: (_item: any, index: number) => index
})

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

// 計算可見範圍
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const end = Math.min(
    start + Math.ceil(props.containerHeight / props.itemHeight) + props.overscan,
    props.items.length
  )

  return {
    start: Math.max(0, start - props.overscan),
    end
  }
})

// 計算總高度
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 可見項目
const visibleItems = computed<VirtualListItem<any>[]>(() => {
  const { start, end } = visibleRange.value
  const items: VirtualListItem<any>[] = []

  for (let i = start; i < end; i++) {
    if (props.items[i]) {
      items.push({
        data: props.items[i],
        index: i,
        top: i * props.itemHeight
      })
    }
  }

  return items
})

// 處理滾動事件
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

// 滾動到指定項目
const scrollToItem = (index: number) => {
  if (containerRef.value) {
    const targetScrollTop = index * props.itemHeight
    containerRef.value.scrollTop = targetScrollTop
  }
}

// 滾動到頂部
const scrollToTop = () => {
  scrollToItem(0)
}

// 滾動到底部
const scrollToBottom = () => {
  scrollToItem(props.items.length - 1)
}

// 獲取可見項目的索引範圍
const getVisibleRange = () => visibleRange.value

// 導出方法
defineExpose({
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  getVisibleRange
})
</script>

<style scoped>
.virtual-list {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* 自定義滾動條樣式 */
.virtual-list::-webkit-scrollbar {
  width: 8px;
}

.virtual-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 平滑滾動 */
.virtual-list {
  scroll-behavior: smooth;
}
</style>
