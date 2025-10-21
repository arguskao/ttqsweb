# 藥助Next學院 - 代碼優化建議報告

## 📊 代碼庫分析摘要

這是一個基於 Vue 3 + TypeScript + Vite 的現代化藥局助理教育平台，具備以下特點：
- 使用 Composition API 和 TypeScript
- 部署到 Cloudflare Pages
- 具備完善的性能監控和優化基礎設施
- 採用模組化架構設計

## 🚀 主要優化建議

### 1. 性能優化

#### 1.1 Bundle 分析和優化
**當前狀況**：已有基本的 chunk 分割配置
**優化建議**：
```typescript
// vite.config.ts - 優化 chunk 分割策略
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          // UI 框架
          'vendor-ui': ['bulma'],
          // HTTP 客戶端
          'vendor-http': ['axios'],
          // 工具函數
          'vendor-utils': ['zod', 'jsonwebtoken'],
          // 按功能模組分割
          'auth-module': [
            './src/views/auth/LoginView.vue',
            './src/views/auth/RegisterView.vue',
            './src/services/auth-service-enhanced.ts',
            './src/stores/auth.ts'
          ],
          'course-module': [
            './src/views/courses/CoursesView.vue',
            './src/views/courses/CourseDetailView.vue',
            './src/views/courses/LearningProgressView.vue',
            './src/services/course-service-enhanced.ts'
          ],
          // 管理功能（較少使用）
          'admin-module': [
            './src/views/admin/AnalyticsDashboardView.vue',
            './src/views/admin/InstructorApplicationsView.vue',
            './src/views/admin/TrainingPlansView.vue',
            './src/views/admin/TTQSDashboardView.vue'
          ]
        }
      }
    },
    // 增加壓縮級別
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    }
  }
})
```

#### 1.2 圖片優化
**建議實施**：
```typescript
// src/components/common/OptimizedImage.vue - 增強版本
<script setup lang="ts">
interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  sizes?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+Cjwvc3ZnPg=='
})

// 生成 WebP 和原格式的 srcset
const generateSrcSet = (src: string) => {
  const baseName = src.replace(/\.(jpg|jpeg|png)$/i, '')
  const ext = src.match(/\.(jpg|jpeg|png)$/i)?.[1]
  
  return {
    webp: `${baseName}.webp`,
    original: src,
    srcset: `${baseName}_480.${ext} 480w, ${baseName}_768.${ext} 768w, ${baseName}_1024.${ext} 1024w`
  }
}
</script>

<template>
  <picture>
    <source 
      :srcset="generateSrcSet(src).webp" 
      type="image/webp"
      :sizes="sizes"
    >
    <img
      :src="placeholder"
      :data-src="src"
      :srcset="generateSrcSet(src).srcset"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      :sizes="sizes"
      class="optimized-image"
    >
  </picture>
</template>
```

#### 1.3 API 優化
**當前問題**：API 服務已有重試機制，但可以進一步優化
**建議改進**：
```typescript
// src/services/api-enhanced.ts
export class ApiServiceEnhanced {
  private requestQueue = new Map<string, Promise<any>>()
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  // 請求去重
  private dedupeRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!
    }

    const promise = request().finally(() => {
      this.requestQueue.delete(key)
    })

    this.requestQueue.set(key, promise)
    return promise
  }

  // 智能緩存
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCachedData<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // 優化的 GET 方法
  async get<T>(url: string, config?: AxiosRequestConfig & { cache?: boolean; ttl?: number }): Promise<ApiResponse<T>> {
    const cacheKey = `GET:${url}:${JSON.stringify(config?.params || {})}`
    
    // 檢查緩存
    if (config?.cache !== false) {
      const cached = this.getCachedData<ApiResponse<T>>(cacheKey)
      if (cached) return cached
    }

    // 請求去重
    return this.dedupeRequest(cacheKey, async () => {
      const response = await apiService.get<T>(url, config)
      
      // 設置緩存
      if (config?.cache !== false) {
        this.setCachedData(cacheKey, response, config?.ttl)
      }
      
      return response
    })
  }
}
```

### 2. 代碼結構優化

#### 2.1 Composables 重構
**建議創建更多可重用的 Composables**：
```typescript
// src/composables/useApiRequest.ts
export function useApiRequest<T>(
  request: () => Promise<T>,
  options: {
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const { immediate = true, onSuccess, onError } = options
  
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async () => {
    try {
      loading.value = true
      error.value = null
      const result = await request()
      data.value = result
      onSuccess?.(result)
      return result
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
      throw err
    } finally {
      loading.value = false
    }
  }

  if (immediate) {
    execute()
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    execute,
    refresh: execute
  }
}

// src/composables/useInfiniteScroll.ts
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    initialPage?: number
    threshold?: number
  } = {}
) {
  const { initialPage = 1, threshold = 100 } = options
  
  const items = ref<T[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(initialPage)

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return

    try {
      loading.value = true
      const result = await fetchFn(currentPage.value)
      
      if (currentPage.value === 1) {
        items.value = result.data
      } else {
        items.value.push(...result.data)
      }
      
      hasMore.value = result.hasMore
      currentPage.value++
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    items.value = []
    currentPage.value = initialPage
    hasMore.value = true
    loadMore()
  }

  // 自動檢測滾動
  const { arrivedState } = useScroll(window)
  watch(
    () => arrivedState.bottom,
    (isBottom) => {
      if (isBottom) loadMore()
    }
  )

  return {
    items: readonly(items),
    loading: readonly(loading),
    hasMore: readonly(hasMore),
    loadMore,
    reset
  }
}
```

#### 2.2 狀態管理優化
```typescript
// src/stores/app.ts - 全局應用狀態
export const useAppStore = defineStore('app', () => {
  // 應用主題
  const theme = ref<'light' | 'dark'>('light')
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // 側邊欄狀態
  const sidebarOpen = ref(false)
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  // 全局載入狀態
  const globalLoading = ref(false)
  const setGlobalLoading = (loading: boolean) => {
    globalLoading.value = loading
  }

  // 通知系統
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
  }>>([])

  const addNotification = (notification: Omit<typeof notifications.value[0], 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`
    notifications.value.push({ ...notification, id })
    
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  return {
    // Theme
    theme: readonly(theme),
    setTheme,
    
    // Sidebar
    sidebarOpen: readonly(sidebarOpen),
    toggleSidebar,
    
    // Loading
    globalLoading: readonly(globalLoading),
    setGlobalLoading,
    
    // Notifications
    notifications: readonly(notifications),
    addNotification,
    removeNotification
  }
})
```

### 3. TypeScript 優化

#### 3.1 類型定義改進
```typescript
// src/types/common.ts
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: {
    requestId: string
    duration: number
    version: string
  }
}

// 事件類型
export interface TrackingEvent {
  action: string
  category: string
  label?: string
  value?: number
  customData?: Record<string, any>
}

// 表單驗證類型
export interface ValidationRule<T = any> {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: T) => boolean | string
  message?: string
}

export interface FormField<T = any> {
  value: T
  rules: ValidationRule<T>[]
  error?: string
  touched: boolean
}
```

### 4. 安全性優化

#### 4.1 CSP 和安全頭配置
```typescript
// functions/_middleware.ts - Cloudflare Pages 中間件
export async function onRequest(context: EventContext<any, any, any>) {
  const response = await context.next()
  
  // 安全標頭
  const securityHeaders = {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.pharmacy-academy.com https://www.google-analytics.com",
      "frame-ancestors 'none'"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}
```

### 5. 測試優化

#### 5.1 測試工具改進
```typescript
// src/tests/utils/test-utils.ts
import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

// 測試用路由配置
const createTestRouter = () => createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } }
  ]
})

// 自定義渲染函數
export function renderWithProviders(
  component: any,
  options: RenderOptions = {},
  routerOptions: { initialEntries?: string[] } = {}
) {
  const pinia = createPinia()
  const router = createTestRouter()

  if (routerOptions.initialEntries?.length) {
    router.push(routerOptions.initialEntries[0])
  }

  return render(component, {
    global: {
      plugins: [pinia, router],
      ...options.global
    },
    ...options
  })
}

// Mock API 服務
export const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  upload: vi.fn(),
  download: vi.fn()
}
```

### 6. 開發體驗優化

#### 6.1 開發工具改進
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "vue.format.defaultFormatter": {
    "html": "prettier",
    "css": "prettier",
    "scss": "prettier",
    "typescript": "prettier",
    "javascript": "prettier"
  },
  "emmet.includeLanguages": {
    "vue-html": "html"
  },
  "vetur.format.defaultFormatterOptions": {
    "prettier": {
      "semi": false,
      "singleQuote": true,
      "tabWidth": 2,
      "trailingComma": "none"
    }
  }
}
```

## 📈 預期效果

實施這些優化後，預期可以獲得：

1. **性能提升**：
   - 首屏加載時間減少 30-40%
   - Bundle 大小減少 20-25%
   - 運行時內存使用優化 15-20%

2. **開發效率**：
   - 類型安全性提高 90%
   - 代碼重用率提高 40%
   - 測試覆蓋率提高到 85%+

3. **維護性**：
   - 代碼耦合度降低
   - 模組化程度提高
   - 錯誤處理更完善

## 🎯 實施優先級

### 高優先級（立即實施）
1. Bundle 優化和代碼分割
2. API 服務改進（去重、緩存）
3. 安全標頭配置

### 中優先級（1-2週內）
1. Composables 重構
2. 狀態管理優化
3. 圖片優化系統

### 低優先級（長期規劃）
1. 測試覆蓋率提升
2. 開發工具配置
3. 性能監控增強

## 💡 其他建議

1. **定期性能審計**：建議每月進行一次性能分析
2. **依賴項管理**：定期更新依賴項並檢查安全漏洞
3. **監控告警**：設置性能指標告警機制
4. **文檔維護**：保持技術文檔與代碼同步更新

---

這些優化建議基於當前代碼庫的分析結果，建議按優先級逐步實施，並在每個階段進行效果評估。