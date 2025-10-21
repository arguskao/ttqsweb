// 組件性能優化工具
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { Ref } from 'vue'

// 虛擬滾動組件
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function useVirtualScroll<T>(items: Ref<T[]>, options: VirtualScrollOptions) {
  const { itemHeight, containerHeight, overscan = 5 } = options

  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement>()

  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.value.length
    )

    return {
      start: Math.max(0, start - overscan),
      end
    }
  })

  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end).map((item, index) => ({
      data: item,
      index: start + index,
      top: (start + index) * itemHeight
    }))
  })

  const totalHeight = computed(() => items.value.length * itemHeight)

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    containerRef,
    visibleItems,
    totalHeight,
    scrollTop
  }
}

// 懶加載組件
export function useLazyLoad(rootMargin = '100px', threshold = 0.1) {
  const isIntersecting = ref(false)
  const elementRef = ref<HTMLElement>()

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (elementRef.value) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            isIntersecting.value = entry.isIntersecting
          })
        },
        {
          rootMargin,
          threshold
        }
      )

      observer.observe(elementRef.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    elementRef,
    isIntersecting
  }
}

// 防抖函數
export function useDebounce<T>(value: Ref<T>, delay: number) {
  const debouncedValue = ref(value.value) as Ref<T>
  let timeoutId: number | null = null

  const updateDebouncedValue = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = window.setTimeout(() => {
      debouncedValue.value = value.value
    }, delay)
  }

  // 監聽原始值的變化
  let stopWatcher: () => void = () => {}

  onMounted(() => {
    stopWatcher = () => {
      updateDebouncedValue()
    }
  })

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    stopWatcher()
  })

  return debouncedValue
}

// 節流函數
export function useThrottle<T>(value: Ref<T>, delay: number) {
  const throttledValue = ref(value.value) as Ref<T>
  let lastUpdate = 0

  const updateThrottledValue = () => {
    const now = Date.now()
    if (now - lastUpdate >= delay) {
      throttledValue.value = value.value
      lastUpdate = now
    }
  }

  let stopWatcher: () => void = () => {}

  onMounted(() => {
    stopWatcher = () => {
      updateThrottledValue()
    }
  })

  onUnmounted(() => {
    stopWatcher()
  })

  return throttledValue
}

// 緩存計算結果
export function useMemo<T>(fn: () => T, deps: Ref<any>[]) {
  const cachedValue = ref<T>()
  const lastDeps = ref<any[]>([])

  const computeValue = () => {
    const currentDeps = deps.map(dep => dep.value)

    // 檢查依賴是否變化
    const hasChanged = currentDeps.some((dep, index) => dep !== lastDeps.value[index])

    if (hasChanged || cachedValue.value === undefined) {
      cachedValue.value = fn()
      lastDeps.value = currentDeps
    }

    return cachedValue.value
  }

  return computed(() => computeValue())
}

// 異步組件加載
export function useAsyncComponent(
  loader: () => Promise<any>,
  options: {
    loadingComponent?: any
    errorComponent?: any
    delay?: number
    timeout?: number
  } = {}
) {
  const { loadingComponent, errorComponent, delay = 200, timeout = 3000 } = options

  const component = ref(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const loadComponent = async () => {
    try {
      isLoading.value = true
      error.value = null

      // 延遲加載
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      // 設置超時
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      )

      const componentPromise = loader()
      const result = await Promise.race([componentPromise, timeoutPromise])

      component.value = result.default || result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('Failed to load component:', err)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadComponent()
  })

  return {
    component,
    isLoading,
    error,
    reload: loadComponent
  }
}

// 性能監控
export function usePerformanceMonitor(componentName: string) {
  const renderTime = ref(0)
  const mountTime = ref(0)
  const updateCount = ref(0)

  const startTime = ref(0)

  const startRender = () => {
    startTime.value = performance.now()
  }

  const endRender = () => {
    if (startTime.value > 0) {
      renderTime.value = performance.now() - startTime.value
      updateCount.value++

      // 記錄性能數據
      if (import.meta.env.DEV) {
        console.log(`[${componentName}] Render time: ${renderTime.value.toFixed(2)}ms`)
      }
    }
  }

  onMounted(() => {
    mountTime.value = performance.now()

    if (import.meta.env.DEV) {
      console.log(`[${componentName}] Mounted in ${mountTime.value.toFixed(2)}ms`)
    }
  })

  return {
    renderTime,
    mountTime,
    updateCount,
    startRender,
    endRender
  }
}

// 內存使用監控
export function useMemoryMonitor() {
  const memoryUsage = ref({
    used: 0,
    total: 0,
    percentage: 0
  })

  const updateMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      }
    }
  }

  let intervalId: number | null = null

  onMounted(() => {
    updateMemoryUsage()
    intervalId = window.setInterval(updateMemoryUsage, 5000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return memoryUsage
}

// 組件緩存
export function useComponentCache<T>(key: string, ttl = 300000) {
  const cache = new Map<string, { data: T; expiry: number }>()

  const get = (): T | null => {
    const cached = cache.get(key)
    if (!cached) return null

    if (Date.now() > cached.expiry) {
      cache.delete(key)
      return null
    }

    return cached.data
  }

  const set = (data: T) => {
    cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  const clear = () => {
    cache.delete(key)
  }

  return {
    get,
    set,
    clear
  }
}

// 批量更新
export function useBatchUpdate<T>(items: Ref<T[]>, batchSize = 100) {
  const processedItems = ref<T[]>([])
  const isProcessing = ref(false)
  const progress = ref(0)

  const processBatch = async (processor: (item: T) => T | Promise<T>) => {
    isProcessing.value = true
    progress.value = 0

    const results: T[] = []
    const total = items.value.length

    for (let i = 0; i < total; i += batchSize) {
      const batch = items.value.slice(i, i + batchSize)
      const processedBatch = await Promise.all(batch.map(item => processor(item)))

      results.push(...processedBatch)
      progress.value = Math.round(((i + batchSize) / total) * 100)

      // 讓出控制權，避免阻塞UI
      await nextTick()
    }

    processedItems.value = results
    isProcessing.value = false
    progress.value = 100

    return results
  }

  return {
    processedItems,
    isProcessing,
    progress,
    processBatch
  }
}

// 導出所有工具函數
// 注意：上方皆以具名導出定義，不需要再次重複導出宣告
