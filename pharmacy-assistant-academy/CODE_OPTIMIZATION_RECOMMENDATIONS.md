# 藥助Next學院 - 代碼優化建議

## 📊 項目概況

**項目名稱**: 藥助Next學院 (Pharmacy Assistant Academy)  
**技術棧**: Vue 3 + TypeScript + Vite + Bulma + PostgreSQL  
**評估日期**: 2024年12月  
**評估範圍**: 前端架構、後端API、數據庫設計、代碼質量  

---

## 🎯 優化總結

| 優化領域 | 發現問題數 | 高優先級 | 中優先級 | 低優先級 |
|---------|-----------|---------|---------|---------|
| 架構設計 | 3 | 1 | 2 | 0 |
| 前端代碼 | 4 | 2 | 1 | 1 |
| 代碼質量 | 3 | 1 | 1 | 1 |
| 數據庫層 | 2 | 0 | 1 | 1 |
| 性能優化 | 2 | 0 | 1 | 1 |
| 安全性 | 2 | 1 | 1 | 0 |
| 用戶體驗 | 2 | 0 | 0 | 2 |

**總計**: 18個優化項目，5個高優先級，7個中優先級，6個低優先級

---

## 🏗️ 架構層面優化

### 1. 🔴 狀態管理改進 (高優先級)

**問題描述**:
- 目前使用 `localStorage` 直接存储認證狀態
- 缺少集中的狀態管理，導致數據一致性問題
- 組件間數據共享複雜

**現狀代碼**:
```typescript
// 當前在 auth-service.ts 中直接操作 localStorage
localStorage.setItem('auth_token', response.data.token)
localStorage.setItem('user', JSON.stringify(response.data.user))
```

**優化方案**:
```typescript
// main.ts - 添加 Pinia
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

// stores/auth.ts - 完善狀態管理
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  
  // 持久化中間件
  const persistAuth = () => {
    if (token.value && user.value) {
      localStorage.setItem('auth_token', token.value)
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
  }
  
  return { user, token, isLoading, persistAuth }
})
```

**預期效益**:
- 統一狀態管理，提高代碼可維護性
- 減少 localStorage 直接操作
- 改善組件間數據同步

---

### 2. 🟡 API錯誤處理增強 (中優先級)

**問題描述**:
- API 服務缺少統一的錯誤處理
- 沒有重試機制處理網絡故障
- 錯誤信息用戶體驗不佳

**現狀代碼**:
```typescript
// services/api.ts - 簡單的錯誤處理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

**優化方案**:
```typescript
// services/api.ts - 增強錯誤處理
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    
    // 重試機制
    if (!config.__isRetryRequest && error.response?.status >= 500) {
      config.__isRetryRequest = true
      config.__retryCount = (config.__retryCount || 0) + 1
      
      if (config.__retryCount <= 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * config.__retryCount))
        return api.request(config)
      }
    }
    
    // 統一錯誤處理
    const errorHandler = useErrorHandler()
    errorHandler.handleApiError(error)
    
    return Promise.reject(error)
  }
)
```

**預期效益**:
- 提高 API 調用穩定性
- 統一錯誤處理流程
- 改善用戶體驗

---

### 3. 🟡 依賴注入模式 (中優先級)

**問題描述**:
- 服務之間直接引用，耦合度高
- 難以進行單元測試
- 缺少服務生命周期管理

**優化方案**:
```typescript
// services/container.ts - 依賴注入容器
class ServiceContainer {
  private services = new Map()
  
  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory)
  }
  
  resolve<T>(name: string): T {
    const factory = this.services.get(name)
    if (!factory) throw new Error(`Service ${name} not found`)
    return factory()
  }
}

export const container = new ServiceContainer()

// 註冊服務
container.register('authService', () => new AuthService())
container.register('courseService', () => new CourseService())
```

**預期效益**:
- 降低服務間耦合度
- 提高代碼可測試性
- 統一服務管理

---

## 💻 前端代碼優化

### 4. 🔴 TypeScript類型安全強化 (高優先級)

**問題描述**:
- 部分 API 響應類型定義不夠嚴格
- 組件 props 缺少運行時驗證
- 錯誤處理類型不統一

**現狀代碼**:
```typescript
// types/index.ts - 當前類型定義
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, string>
  }
}
```

**優化方案**:
```typescript
// types/api.ts - 強化類型定義
export type ApiErrorCode = 
  | 'VALIDATION_ERROR' 
  | 'AUTH_ERROR' 
  | 'PERMISSION_ERROR'
  | 'SERVER_ERROR' 
  | 'NETWORK_ERROR'

export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, string[]>
  timestamp: string
  requestId: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    pagination?: PaginationMeta
    version: string
  }
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

// 使用 Zod 進行運行時驗證
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(8, '密碼至少需要8個字符'),
  userType: z.enum(['job_seeker', 'employer']),
  firstName: z.string().min(1, '姓名不能為空'),
  lastName: z.string().min(1, '姓名不能為空'),
  phone: z.string().optional()
})

export type RegisterData = z.infer<typeof RegisterSchema>
```

**預期效益**:
- 提高類型安全性，減少運行時錯誤
- 統一錯誤處理格式
- 改善開發體驗和代碼提示

---

### 5. 🔴 組件性能優化 (高優先級)

**問題描述**:
- 路由組件沒有使用懶加載
- 列表渲染缺少虛擬滾動
- 缺少組件緩存機制

**現狀代碼**:
```typescript
// router/index.ts - 當前路由配置
{
  path: '/courses',
  component: () => import('../views/courses/CoursesView.vue')
}
```

**優化方案**:
```typescript
// router/index.ts - 優化路由配置
import { defineAsyncComponent } from 'vue'

const routes = [
  {
    path: '/courses',
    component: defineAsyncComponent({
      loader: () => import('../views/courses/CoursesView.vue'),
      loadingComponent: LoadingSpinner,
      errorComponent: ErrorComponent,
      delay: 200,
      timeout: 3000
    }),
    meta: { 
      requiresAuth: true,
      keepAlive: true // 添加緩存
    }
  }
]

// App.vue - 添加 KeepAlive
<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="route.meta?.keepAlive ? [route.name] : []">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

// components/VirtualList.vue - 虛擬滾動組件
<template>
  <div class="virtual-list" :style="{ height: containerHeight + 'px' }">
    <div :style="{ height: totalHeight + 'px' }">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        :style="{ 
          position: 'absolute',
          top: item.top + 'px',
          height: itemHeight + 'px',
          width: '100%'
        }"
      >
        <slot :item="item.data" />
      </div>
    </div>
  </div>
</template>
```

**預期效益**:
- 減少初始加載時間
- 提高長列表渲染性能
- 改善用戶交互體驗

---

### 6. 🟡 響應式設計改進 (中優先級)

**問題描述**:
- 移動端適配不夠完善
- 觸摸交互體驗有待改善
- 斷點使用不夠合理

**優化方案**:
```scss
// assets/responsive.scss - 響應式設計
$mobile: 768px;
$tablet: 1024px;
$desktop: 1216px;
$widescreen: 1408px;

// 移動端優先的斷點
@mixin mobile {
  @media (max-width: #{$mobile - 1px}) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: #{$mobile}) and (max-width: #{$tablet - 1px}) {
    @content;
  }
}

// 組件中使用
.course-card {
  @include mobile {
    .card-content {
      padding: 1rem;
    }
    
    .level {
      flex-direction: column;
      
      .level-left,
      .level-right {
        justify-content: center;
      }
    }
  }
}

// 觸摸友好的按鈕尺寸
.button {
  @include mobile {
    min-height: 44px; // iOS 建議的最小觸摸目標
    min-width: 44px;
  }
}
```

**預期效益**:
- 改善移動端用戶體驗
- 提高觸摸交互的準確性
- 統一響應式設計規範

---

### 7. 🟢 無障礙設計優化 (低優先級)

**問題描述**:
- 缺少鍵盤導航支持
- 顏色對比度需要檢查
- 屏幕閱讀器支持不足

**優化方案**:
```vue
<!-- 添加無障礙屬性 -->
<template>
  <nav 
    class="navbar" 
    role="navigation" 
    aria-label="主導航"
    @keydown="handleKeyNavigation"
  >
    <div class="navbar-menu">
      <router-link 
        to="/courses" 
        class="navbar-item"
        :aria-current="$route.name === 'courses' ? 'page' : null"
        @focus="announceNavigation"
      >
        課程
      </router-link>
    </div>
  </nav>
  
  <!-- 跳過連結 -->
  <a 
    href="#main-content" 
    class="skip-link"
    @click="skipToMain"
  >
    跳到主內容
  </a>
</template>

<style>
/* 高對比度模式支持 */
@media (prefers-contrast: high) {
  .button.is-primary {
    background-color: #000;
    color: #fff;
    border: 2px solid #fff;
  }
}

/* 減少動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
  
  &:focus {
    top: 6px;
  }
}
</style>
```

**預期效益**:
- 提高應用程序的包容性
- 符合無障礙設計標準
- 改善殘障用戶體驗

---

## 🔧 代碼質量優化

### 8. 🔴 單元測試實施 (高優先級)

**問題描述**:
- 項目缺少測試套件
- 無法保證代碼變更的安全性
- 缺少自動化測試流程

**優化方案**:
```json
// package.json - 添加測試依賴
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0",
    "jsdom": "^23.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

```typescript
// tests/components/CourseCard.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CourseCard from '@/components/common/CourseCard.vue'
import type { Course } from '@/types'

const mockCourse: Course = {
  id: 1,
  title: '藥學入門',
  description: '基礎藥學知識課程',
  courseType: 'basic',
  durationHours: 40,
  price: 5000,
  instructorId: 1,
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
}

describe('CourseCard', () => {
  it('should render course information correctly', () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })
    
    expect(wrapper.find('.title').text()).toBe('藥學入門')
    expect(wrapper.find('.subtitle').text()).toBe('基礎藥學知識課程')
    expect(wrapper.text()).toContain('40 小時')
    expect(wrapper.text()).toContain('NT$ 5,000')
  })
  
  it('should emit enroll event when enroll button is clicked', async () => {
    const wrapper = mount(CourseCard, {
      props: { course: mockCourse }
    })
    
    await wrapper.find('[data-testid="enroll-button"]').trigger('click')
    expect(wrapper.emitted('enroll')).toBeTruthy()
  })
})
```

```typescript
// tests/services/auth-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '@/services/auth-service'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('mock-token')
      expect(authService.isAuthenticated()).toBe(true)
    })
    
    it('should return false when token does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null)
      expect(authService.isAuthenticated()).toBe(false)
    })
  })
})
```

**預期效益**:
- 提高代碼質量和穩定性
- 減少回歸錯誤
- 增強重構信心

---

### 9. 🟡 代碼分割優化 (中優先級)

**問題描述**:
- 打包後的文件過大
- 首屏加載時間較長
- 缺少合理的代碼分割策略

**優化方案**:
```typescript
// vite.config.ts - 優化構建配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方依賴
          'vendor-vue': ['vue', 'vue-router'],
          'vendor-ui': ['bulma'],
          'vendor-utils': ['axios'],
          
          // 業務模塊
          'auth': [
            './src/services/auth-service.ts',
            './src/stores/auth.ts',
            './src/views/auth/LoginView.vue',
            './src/views/auth/RegisterView.vue'
          ],
          'courses': [
            './src/services/course-service.ts',
            './src/views/courses/CoursesView.vue',
            './src/views/courses/CourseDetailView.vue'
          ],
          'jobs': [
            './src/views/jobs/JobsView.vue'
          ]
        }
      }
    },
    
    // 壓縮配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // 開發服務器優化
  server: {
    fs: {
      strict: false
    }
  }
})
```

**預期效益**:
- 減少首屏加載時間
- 提高緩存利用率
- 改善用戶體驗

---

### 10. 🟢 代碼規範統一 (低優先級)

**問題描述**:
- ESLint 規則需要完善
- 缺少 Git hooks 自動檢查
- 代碼風格不夠統一

**優化方案**:
```json
// package.json - 添加 Git hooks
{
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,vue}": [
      "stylelint --fix"
    ]
  }
}
```

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
npm run type-check
npm run test:run
```

```typescript
// eslint.config.ts - 完善 ESLint 配置
export default defineConfigWithVueTs(
  {
    rules: {
      // Vue 3 Composition API 規則
      'vue/prefer-composition-api': 'error',
      'vue/no-deprecated-slot-attribute': 'error',
      'vue/no-deprecated-slot-scope-attribute': 'error',
      
      // TypeScript 規則
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      
      // 一般規則
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error'
    }
  }
)
```

**預期效益**:
- 統一代碼風格
- 提高代碼質量
- 減少人工審查工作

---

## 🗄️ 數據庫層面優化

### 11. 🟡 數據庫索引優化 (中優先級)

**問題描述**:
- 缺少復合索引優化查詢性能
- 沒有針對常用查詢建立索引
- 數據庫查詢效率有待提升

**現狀代碼**:
```sql
-- 001_create_users_table.sql - 當前索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
```

**優化方案**:
```sql
-- 新增複合索引優化查詢
-- 用戶查詢優化
CREATE INDEX IF NOT EXISTS idx_users_type_active ON users(user_type, is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 課程註冊查詢優化
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_status 
ON course_enrollments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_status 
ON course_enrollments(course_id, status);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_progress 
ON course_enrollments(user_id, progress_percentage) 
WHERE status IN ('in_progress', 'completed');

-- 工作申請查詢優化
CREATE INDEX IF NOT EXISTS idx_job_applications_user_date 
ON job_applications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_employer_active 
ON jobs(employer_id, is_active, created_at DESC);

-- 全文搜索索引 (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_courses_search 
ON courses USING gin(to_tsvector('chinese', title || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_jobs_search 
ON jobs USING gin(to_tsvector('chinese', title || ' ' || description));
```

**預期效益**:
- 提高數據庫查詢性能
- 減少查詢響應時間
- 支持全文搜索功能

---

### 12. 🟢 數據驗證增強 (低優先級)

**問題描述**:
- 數據庫層缺少業務規則約束
- 沒有充分利用數據庫約束功能
- 數據一致性依賴應用層

**優化方案**:
```sql
-- 新增業務規則約束
-- 課程約束
ALTER TABLE courses 
ADD CONSTRAINT check_duration CHECK (duration_hours > 0 AND duration_hours <= 1000),
ADD CONSTRAINT check_price CHECK (price >= 0);

-- 課程註冊約束
ALTER TABLE course_enrollments 
ADD CONSTRAINT check_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD CONSTRAINT check_completion_logic CHECK (
  (status = 'completed' AND completion_date IS NOT NULL AND final_score IS NOT NULL) OR
  (status != 'completed' AND (completion_date IS NULL OR final_score IS NULL))
);

-- 工作約束
ALTER TABLE jobs 
ADD CONSTRAINT check_salary CHECK (
  (salary_min IS NULL AND salary_max IS NULL) OR 
  (salary_min IS NOT NULL AND salary_max IS NOT NULL AND salary_max >= salary_min)
),
ADD CONSTRAINT check_expiry CHECK (expires_at > created_at);

-- 添加觸發器確保數據一致性
CREATE OR REPLACE FUNCTION validate_course_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- 檢查課程是否啟用
  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = NEW.course_id AND is_active = true) THEN
    RAISE EXCEPTION '無法註冊已停用的課程';
  END IF;
  
  -- 檢查重複註冊
  IF EXISTS (SELECT 1 FROM course_enrollments 
             WHERE user_id = NEW.user_id AND course_id = NEW.course_id 
             AND status != 'dropped') THEN
    RAISE EXCEPTION '用戶已註冊此課程';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_course_enrollment
  BEFORE INSERT ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION validate_course_enrollment();
```

**預期效益**:
- 提高數據完整性
- 減少應用層驗證負擔
- 防止無效數據插入

---

## 🚀 性能優化

### 13. 🟡 緩存策略實施 (中優先級)

**問題描述**:
- 缺少緩存機制，重複查詢數據庫
- API 響應時間較長
- 沒有利用瀏覽器緩存

**優化方案**:
```typescript
// services/cache-service.ts - 內存緩存服務
class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>()
  
  set(key: string, value: any, ttlMs = 300000): void {
    const expiry = Date.now() + ttlMs
    this.cache.set(key, { data: value, expiry })
    
    // 定時清理過期緩存
    setTimeout(() => {
      const cached = this.cache.get(key)
      if (cached && cached.expiry <= Date.now()) {
        this.cache.delete(key)
      }
    }, ttlMs)
  }
  
  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (cached.expiry <= Date.now()) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // 緩存裝飾器
  static withCache(ttlMs = 300000) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value
      
      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${propertyKey}_${JSON.stringify(args)}`
        const cached = cacheService.get(cacheKey)
        
        if (cached) return cached
        
        const result = await originalMethod.apply(this, args)
        cacheService.set(cacheKey, result, ttlMs)
        
        return result
      }
    }
  }
}

export const cacheService = new CacheService()

// 使用示例
export class CourseService {
  @CacheService.withCache(600000) // 10分鐘緩存
  async getCourses(filters: CourseFilters): Promise<Course[]> {
    return await apiService.get('/courses', { params: filters })
  }
}
```

```typescript
// composables/useApiCache.ts - Vue Composition API 緩存
export function useApiCache<T>(
  key: string, 
  fetcher: () => Promise<T>,
  options: { ttl?: number; staleWhileRevalidate?: boolean } = {}
) {
  const { ttl = 300000, staleWhileRevalidate = true } = options
  
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  const fetchData = async (force = false) => {
    if (!force) {
      const cached = cacheService.get<T>(key)
      if (cached) {
        data.value = cached
        return cached
      }
    }
    
    loading.value = true
    error.value = null
    
    try {
      const result = await fetcher()
      data.value = result
      cacheService.set(key, result, ttl)
      return result
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 初始加載
  onMounted(() => fetchData())
  
  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    refresh: () => fetchData(true),
    mutate: (newData: T) => {
      data.value = newData
      cacheService.set(key, newData, ttl)
    }
  }
}
```

**預期效益**:
- 減少 API 調用次數
- 提高應用響應速度
- 改善用戶體驗

---

### 14. 🟢 圖片和資源優化 (低優先級)

**問題描述**:
- 圖片格式和大小未優化
- 缺少圖片懶加載
- 沒有 CDN 支持

**優化方案**:
```vue
<!-- components/LazyImage.vue - 懶加載圖片組件 -->
<template>
  <div class="lazy-image-container" ref="container">
    <img
      v-if="loaded"
      :src="optimizedSrc"
      :alt="alt"
      :class="imageClass"
      @load="onLoad"
      @error="onError"
    />
    <div v-else-if="loading" class="loading-placeholder">
      <div class="loading-spinner"></div>
    </div>
    <div v-else-if="error" class="error-placeholder">
      <span>圖片載入失敗</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  quality: 80,
  format: 'webp'
})

const container = ref<HTMLElement>()
const loaded = ref(false)
const loading = ref(false)
const error = ref(false)

// 圖片優化 URL
const optimizedSrc = computed(() => {
  const url = new URL(props.src, window.location.origin)
  
  if (props.width) url.searchParams.set('w', props.width.toString())
  if (props.height) url.searchParams.set('h', props.height.toString())
  url.searchParams.set('q', props.quality.toString())
  url.searchParams.set('f', props.format)
  
  return url.toString()
})

// Intersection Observer 用於懶加載
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!container.value) return
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loaded.value && !loading.value) {
          loadImage()
        }
      })
    },
    { threshold: 0.1 }
  )
  
  observer.observe(container.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const loadImage = () => {
  loading.value = true
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
</script>
```

```typescript
// utils/image-optimization.ts - 圖片優化工具
export class ImageOptimizer {
  static async compressImage(
    file: File, 
    options: { 
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: string
    } = {}
  ): Promise<Blob> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'image/webp' } = options
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // 計算新尺寸
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        canvas.width = width
        canvas.height = height
        
        // 繪製和壓縮
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, format, quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }
  
  static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ')
  }
}
```

**預期效益**:
- 減少圖片載入時間
- 節省帶寬使用
- 提高頁面性能

---

## 🔒 安全性優化

### 15. 🔴 認證安全增強 (高優先級)

**問題描述**:
- JWT token 缺少刷新機制
- 沒有 token 過期自動處理
- 缺少防範 XSS 和 CSRF 攻擊

**現狀代碼**:
```typescript
// services/auth-service.ts - 當前認證實現
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiService.post<AuthResponse>('/auth/login', credentials)
  
  if (response.success && response.data) {
    localStorage.setItem('auth_token', response.data.token)
    return response.data
  }
  throw new Error('登入失敗')
}
```

**優化方案**:
```typescript
// services/auth-service.ts - 增強認證安全
interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

class AuthService {
  private refreshPromise: Promise<string> | null = null
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<{
      user: User
      tokens: TokenResponse
    }>('/auth/login', credentials)
    
    if (response.success && response.data) {
      this.setTokens(response.data.tokens)
      return { user: response.data.user, token: response.data.tokens.accessToken }
    }
    throw new Error('登入失敗')
  }
  
  private setTokens(tokens: TokenResponse): void {
    // 使用 httpOnly cookie 存儲 refresh token (更安全)
    document.cookie = `refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict`
    
    // access token 存儲在內存中
    sessionStorage.setItem('accessToken', tokens.accessToken)
    sessionStorage.setItem('tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString())
  }
  
  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }
    
    this.refreshPromise = this.performTokenRefresh()
    
    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }
  
  private async performTokenRefresh(): Promise<string> {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include' // 包含 httpOnly cookies
    })
    
    if (!response.ok) {
      this.clearTokens()
      throw new Error('Token refresh failed')
    }
    
    const data = await response.json()
    this.setTokens(data.tokens)
    
    return data.tokens.accessToken
  }
  
  isTokenExpired(): boolean {
    const expiry = sessionStorage.getItem('tokenExpiry')
    if (!expiry) return true
    
    return Date.now() >= parseInt(expiry) - 60000 // 提前1分鐘刷新
  }
  
  async getValidToken(): Promise<string | null> {
    const token = sessionStorage.getItem('accessToken')
    
    if (!token) return null
    
    if (this.isTokenExpired()) {
      try {
        return await this.refreshToken()
      } catch {
        return null
      }
    }
    
    return token
  }
}
```

```typescript
// api/auth-middleware.ts - 增強中間件安全
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

// 安全中間件
export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"]
      }
    }
  }),
  
  // 防範暴力攻擊
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15分鐘
    max: 5, // 最多5次嘗試
    message: '登入嘗試次數過多，請稍後再試',
    standardHeaders: true,
    legacyHeaders: false
  })
]

// CSRF 保護
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-csrf-token']
  const sessionToken = req.session?.csrfToken
  
  if (!token || token !== sessionToken) {
    return res.status(403).json({ error: 'CSRF token mismatch' })
  }
  
  next()
}
```

**預期效益**:
- 提高認證安全性
- 防範常見安全攻擊
- 改善 token 管理機制

---

### 16. 🟡 輸入驗證加強 (中優先級)

**問題描述**:
- 前端驗證可被繞過
- 缺少統一的驗證機制
- 沒有防範注入攻擊

**優化方案**:
```typescript
// utils/validation.ts - 使用 Zod 進行驗證
import { z } from 'zod'

// 基礎驗證 schemas
export const EmailSchema = z.string()
  .email('請輸入有效的電子郵件地址')
  .max(255, '電子郵件地址過長')

export const PasswordSchema = z.string()
  .min(8, '密碼至少需要8個字符')
  .max(128, '密碼過長')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含大小寫字母和數字')

export const PhoneSchema = z.string()
  .regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼')
  .optional()

// 業務驗證 schemas
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
  userType: z.enum(['job_seeker', 'employer']),
  firstName: z.string().min(1, '姓名不能為空').max(50, '姓名過長'),
  lastName: z.string().min(1, '姓名不能為空').max(50, '姓名過長'),
  phone: PhoneSchema
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '密碼確認不一致',
    path: ['confirmPassword']
  }
)

// 課程驗證
export const CourseSchema = z.object({
  title: z.string().min(1, '課程標題不能為空').max(200, '標題過長'),
  description: z.string().min(1, '課程描述不能為空').max(2000, '描述過長'),
  courseType: z.enum(['basic', 'advanced', 'internship']),
  durationHours: z.number().min(1, '課程時長至少1小時').max(1000, '課程時長過長'),
  price: z.number().min(0, '價格不能為負數').max(999999, '價格過高')
})

// 驗證裝飾器
export function ValidateBody(schema: z.ZodSchema) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        const validatedData = schema.parse(req.body)
        req.body = validatedData
        return originalMethod.call(this, req, res, next)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '輸入數據驗證失敗',
              details: error.flatten().fieldErrors
            }
          })
        }
        throw error
      }
    }
  }
}

// 使用示例
export class AuthController {
  @ValidateBody(RegisterSchema)
  async register(req: Request, res: Response) {
    // req.body 已經通過驗證
    const userData = req.body
    // ... 處理註冊邏輯
  }
}
```

**預期效益**:
- 統一輸入驗證機制
- 防範注入攻擊
- 提高數據質量

---

## 📱 用戶體驗優化

### 17. 🟢 加載狀態管理 (低優先級)

**問題描述**:
- 缺少全局加載狀態管理
- 用戶等待時沒有明確反饋
- 加載動畫不夠友好

**優化方案**:
```typescript
// stores/loading.ts - 全局加載狀態管理
export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(false)
  const loadingText = ref('')
  const loadingQueue = ref(new Set<string>())
  
  const showLoading = (text = '載入中...', id = 'default') => {
    loadingQueue.value.add(id)
    loadingText.value = text
    isLoading.value = true
  }
  
  const hideLoading = (id = 'default') => {
    loadingQueue.value.delete(id)
    if (loadingQueue.value.size === 0) {
      isLoading.value = false
      loadingText.value = ''
    }
  }
  
  return {
    isLoading: readonly(isLoading),
    loadingText: readonly(loadingText),
    showLoading,
    hideLoading
  }
})
```

```vue
<!-- components/GlobalLoading.vue - 全局加載組件 -->
<template>
  <Teleport to="body">
    <Transition name="loading">
      <div v-if="isLoading" class="global-loading">
        <div class="loading-backdrop" @click.stop></div>
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p class="loading-text">{{ loadingText }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLoadingStore } from '@/stores/loading'

const { isLoading, loadingText } = storeToRefs(useLoadingStore())
</script>

<style scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.loading-content {
  position: relative;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.3s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}
</style>
```

**預期效益**:
- 改善用戶等待體驗
- 統一加載狀態管理
- 提供明確的操作反饋

---

### 18. 🟢 錯誤邊界處理 (低優先級)

**問題描述**:
- 缺少全局錯誤處理機制
- 錯誤信息對用戶不友好
- 沒有錯誤恢復機制

**優化方案**:
```vue
<!-- components/ErrorBoundary.vue - 錯誤邊界組件 -->
<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3 class="error-title">發生錯誤</h3>
      <p class="error-message">{{ friendlyErrorMessage }}</p>
      
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
      
      <details v-if="isDevelopment" class="error-details">
        <summary>錯誤詳情 (開發模式)</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  
  <slot v-else :retry="retry" />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const hasError = ref(false)
const error = ref<Error | null>(null)
const isDevelopment = computed(() => import.meta.env.DEV)

const friendlyErrorMessage = computed(() => {
  if (!error.value) return ''
  
  // 根據錯誤類型提供友好的錯誤信息
  const errorMessage = error.value.message.toLowerCase()
  
  if (errorMessage.includes('network')) {
    return '網絡連接出現問題，請檢查您的網絡連接。'
  } else if (errorMessage.includes('timeout')) {
    return '請求超時，請稍後再試。'
  } else if (errorMessage.includes('unauthorized')) {
    return '登入已過期，請重新登入。'
  } else if (errorMessage.includes('forbidden')) {
    return '您沒有權限執行此操作。'
  } else {
    return '系統出現未知錯誤，請稍後再試或聯繫客服。'
  }
})

const errorDetails = computed(() => {
  if (!error.value) return ''
  
  return {
    message: error.value.message,
    stack: error.value.stack,
    timestamp: new Date().toISOString()
  }
})

onErrorCaptured((err) => {
  console.error('錯誤邊界捕獲錯誤:', err)
  error.value = err
  hasError.value = true
  
  // 發送錯誤報告 (生產環境)
  if (!isDevelopment.value) {
    reportError(err)
  }
  
  return false // 阻止錯誤繼續傳播
})

const retry = () => {
  hasError.value = false
  error.value = null
}

const goHome = () => {
  hasError.value = false
  error.value = null
  router.push('/')
}

const reportError = async (err: Error) => {
  try {
    await fetch('/api/v1/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: err.message,
        stack: err.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    })
  } catch (reportErr) {
    console.error('錯誤報告發送失敗:', reportErr)
  }
}
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  font-size: 4rem;
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
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.error-details {
  text-align: left;
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.error-details pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8rem;
  color: #666;
}
</style>
```

**預期效益**:
- 提高錯誤處理能力
- 改善用戶體驗
- 便於錯誤追蹤和調試

---

## 🎯 實施優先級和時間規劃

### 📈 優先級矩陣

| 優化項目 | 影響度 | 實施難度 | 優先級 | 預估時間 |
|---------|-------|---------|-------|---------|
| 1. 狀態管理改進 | 高 | 中 | 🔴 高 | 2-3天 |
| 4. TypeScript類型安全 | 高 | 低 | 🔴 高 | 1-2天 |
| 5. 組件性能優化 | 高 | 中 | 🔴 高 | 3-4天 |
| 8. 單元測試實施 | 高 | 高 | 🔴 高 | 5-7天 |
| 15. 認證安全增強 | 高 | 中 | 🔴 高 | 2-3天 |
| 2. API錯誤處理增強 | 中 | 低 | 🟡 中 | 1-2天 |
| 6. 響應式設計改進 | 中 | 低 | 🟡 中 | 2-3天 |
| 9. 代碼分割優化 | 中 | 中 | 🟡 中 | 1-2天 |
| 11. 數據庫索引優化 | 中 | 低 | 🟡 中 | 1天 |
| 13. 緩存策略實施 | 中 | 中 | 🟡 中 | 2-3天 |
| 16. 輸入驗證加強 | 中 | 中 | 🟡 中 | 2-3天 |

### 🗓️ 實施計劃

#### 第一階段 (1-2週): 核心優化
```
週一-週二: TypeScript類型安全強化
週三-週五: 狀態管理改進 + API錯誤處理
週六-週日: 認證安全增強
```

#### 第二階段 (3-4週): 性能優化
```
週一-週三: 組件性能優化
週四-週五: 代碼分割優化
週六-週日: 緩存策略實施
```

#### 第三階段 (5-6週): 質量提升
```
週一-週五: 單元測試實施
週六-週日: 輸入驗證加強
```

#### 第四階段 (7-8週): 用戶體驗
```
週一-週三: 響應式設計改進
週四-週五: 數據庫索引優化
週六-週日: 用戶體驗優化
```

---

## 🔍 效果評估指標

### 性能指標
- **首屏加載時間**: 目標 < 2秒
- **API響應時間**: 目標 < 500ms
- **打包大小**: 減少 30% 以上
- **緩存命中率**: 目標 > 80%

### 代碼質量指標
- **測試覆蓋率**: 目標 > 80%
- **TypeScript嚴格模式**: 無 any 類型
- **ESLint錯誤**: 0個錯誤
- **安全漏洞**: 0個高危漏洞

### 用戶體驗指標
- **頁面響應時間**: < 100ms
- **錯誤率**: < 1%
- **移動端適配**: 100%頁面支持
- **無障礙得分**: WCAG 2.1 AA 級

---

## 📋 總結與建議

這份優化建議涵蓋了 **18個關鍵優化項目**，從架構設計到用戶體驗的全方位改進。

### 🎯 核心收益
1. **提高開發效率**: 通過完善的類型系統和測試覆蓋，減少 bug 和調試時間
2. **增強用戶體驗**: 通過性能優化和響應式設計，提供更流暢的用戶體驗
3. **保障系統安全**: 通過認證增強和輸入驗證，提高系統安全性
4. **提升可維護性**: 通過架構優化和代碼規範，降低維護成本

### 🚀 下一步行動
1. **立即開始**: 優先實施 5 個高優先級項目
2. **逐步推進**: 按照 4 個階段的時間計劃執行
3. **持續監控**: 建立指標監控和定期評估機制
4. **團隊培訓**: 確保團隊掌握新的技術和最佳實踐

### 💡 長期規劃
- **微服務架構**: 考慮未來拆分為微服務架構
- **CI/CD優化**: 建立完善的持續集成和部署流程
- **監控告警**: 實施全面的應用監控和告警機制
- **性能監控**: 建立實時性能監控和優化機制

---

**文檔版本**: v1.0  
**最後更新**: 2024年12月  
**建議有效期**: 6個月

如需詳細討論任何優化項目的具體實施方案，請聯繫開發團隊。