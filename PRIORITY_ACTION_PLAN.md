# 🎯 優化行動計劃 - 按優先級排序

> **制定日期**: 2024-11-14  
> **基於**: 實際專案狀況和當前進度  
> **原則**: 先完成高價值工作，再做錦上添花

---

## 📊 當前狀態

### ✅ 已完成
- 統一錯誤處理工具（後端 + 前端）
- 已遷移 6 個核心 API（減少 545 行代碼）
- 測試腳本和文檔完善

### 🚧 進行中
- API 遷移工作（6/50+ 完成）

### ⚠️ 待處理
- 44+ 個 API 待遷移
- 4 個 jobs 相關 TODO
- 小型性能優化

---

## 🎯 Phase 1: 本週必做（2024-11-14 ~ 11-20）

### 1️⃣ 繼續 API 遷移 ⭐⭐⭐⭐⭐
**優先級**: 最高  
**預計時間**: 3-4 天  
**價值**: 極高（減少代碼重複 49%）

#### 目標
遷移 10 個高優先級 API（總計 16/50+）

#### 待遷移清單
```
高優先級（核心功能）：
□ courses.ts - 課程列表
□ courses/[id]/progress.ts - 課程進度
□ instructors/[instructorId]/courses.ts - 講師課程
□ users/[userId]/profile.ts - 用戶資料
□ upload.ts - 檔案上傳

中優先級（常用功能）：
□ experiences.ts - 經驗分享列表
□ experiences/[experienceId].ts - 經驗分享詳情
□ groups.ts - 群組列表
□ forum/topics.ts - 論壇主題
□ jobs/[id]/favorite.ts - 職缺收藏
```

#### 執行步驟
1. 每天遷移 2-3 個 API
2. 遷移後立即測試
3. 更新 `ERROR_HANDLER_MIGRATION.md`
4. 每完成 5 個就 commit 一次

#### 成功指標
- [ ] 完成 10 個 API 遷移
- [ ] 所有測試通過
- [ ] 累計減少 ~1000 行代碼

---

### 2️⃣ 修復 Jobs TODO 項目 ⭐⭐⭐⭐
**優先級**: 高  
**預計時間**: 2-3 小時  
**價值**: 高（影響用戶體驗）

#### 問題清單

**A. hasApplied 檢查未實現**
```typescript
// 文件: src/api/jobs-service-neon.ts:114
hasApplied: false // TODO: 實際檢查用戶是否已申請
```

**解決方案**:
```typescript
// 實現用戶申請狀態檢查
async function checkUserApplications(userId: number, jobIds: number[]) {
  const sql = neon(env.DATABASE_URL)
  const applications = await sql`
    SELECT job_id 
    FROM job_applications 
    WHERE user_id = ${userId} 
    AND job_id = ANY(${jobIds})
  `
  return new Set(applications.map(a => a.job_id))
}

// 在 getJobs 中使用
const appliedJobIds = userId ? await checkUserApplications(userId, jobIds) : new Set()
jobs.map(job => ({
  ...job,
  hasApplied: appliedJobIds.has(job.id)
}))
```

**B. 薪資查詢欄位重構**
```typescript
// 文件: src/api/jobs/repositories.ts:71
// TODO: 薪資查詢需要根據實際的 salary 欄位進行重構
```

**解決方案**:
```typescript
// 選項 1: 如果 salary 是字串（如 "30000-50000"）
if (salaryMin) {
  // 解析薪資範圍字串
  whereConditions.push(`
    CAST(SPLIT_PART(salary, '-', 1) AS INTEGER) >= $${paramIndex}
  `)
  params.push(salaryMin)
  paramIndex++
}

// 選項 2: 添加新欄位到資料庫
// ALTER TABLE jobs ADD COLUMN salary_min INTEGER;
// ALTER TABLE jobs ADD COLUMN salary_max INTEGER;
```

**C. experience_level 欄位不存在**
```typescript
// 文件: src/api/jobs/repositories.ts:85, 231
// TODO: 這些欄位在資料庫中不存在
```

**解決方案**:
```typescript
// 選項 1: 添加欄位到資料庫
// ALTER TABLE jobs ADD COLUMN experience_level VARCHAR(50);

// 選項 2: 暫時移除此功能，添加註釋說明
// 功能已移除：experience_level 欄位待資料庫 schema 更新後重新啟用
```

#### 執行步驟
1. 檢查資料庫 schema
2. 決定解決方案（添加欄位 vs 調整邏輯）
3. 實現 hasApplied 檢查
4. 測試 jobs 相關功能
5. 移除所有 TODO 註釋

#### 成功指標
- [ ] hasApplied 正確顯示
- [ ] 薪資過濾正常工作（或明確標記為待實現）
- [ ] 移除所有 TODO 註釋

---

### 3️⃣ 清理 Scroll 事件監聽器 ⭐⭐
**優先級**: 中  
**預計時間**: 10 分鐘  
**價值**: 中（防止潛在問題）

#### 問題
```typescript
// src/main.ts:131-134
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(trackScrollDepth, 100)
})
// 沒有清理機制
```

#### 解決方案
```typescript
// src/main.ts
let scrollTimeout: ReturnType<typeof setTimeout>
let scrollCleanup: (() => void) | null = null

const trackScrollDepth = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const scrollPercent = Math.round((scrollTop / docHeight) * 100)

  if (scrollPercent > maxScrollDepth && scrollPercent % 25 === 0) {
    maxScrollDepth = scrollPercent
    analytics.trackScrollDepth(scrollPercent)
  }
}

const handleScroll = () => {
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(trackScrollDepth, 100)
}

// 添加監聽器
window.addEventListener('scroll', handleScroll, { passive: true })

// 清理函數
scrollCleanup = () => {
  window.removeEventListener('scroll', handleScroll)
  clearTimeout(scrollTimeout)
}

// 在 beforeunload 時清理
window.addEventListener('beforeunload', () => {
  if (scrollCleanup) scrollCleanup()
})
```

#### 成功指標
- [ ] 添加清理機制
- [ ] 使用 passive 事件監聽器提升性能
- [ ] 測試無內存洩漏

---

## 🎯 Phase 2: 下週目標（2024-11-21 ~ 11-27）

### 4️⃣ 完成剩餘高優先級 API 遷移 ⭐⭐⭐⭐
**目標**: 再遷移 10 個 API（總計 26/50+）

```
待遷移：
□ courses/[id]/materials.ts - 課程教材
□ courses/[id]/assignments.ts - 課程作業
□ users/[userId]/certificates.ts - 用戶證書
□ instructors/applications.ts - 講師申請
□ jobs.ts - 職缺列表
□ jobs/[id].ts - 職缺詳情
□ jobs/[id]/applications.ts - 職缺申請
□ messages.ts - 訊息列表
□ notifications.ts - 通知列表
□ admin/users.ts - 用戶管理
```

---

### 5️⃣ 優化大列表渲染 ⭐⭐⭐
**優先級**: 中高  
**預計時間**: 1 天

#### 目標組件
- 課程列表（CourseList.vue）
- 職缺列表（JobList.vue）
- 經驗分享列表（ExperienceList.vue）

#### 優化方案

**A. 虛擬滾動（Virtual Scrolling）**
```vue
<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  items,
  { itemHeight: 120 }
)
</script>

<template>
  <div v-bind="containerProps" class="list-container">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.data.id">
        <CourseCard :course="item.data" />
      </div>
    </div>
  </div>
</template>
```

**B. 分頁加載**
```typescript
const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['courses'],
  queryFn: ({ pageParam = 1 }) => fetchCourses(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage
})
```

**C. 圖片懶加載**
```vue
<img 
  v-lazy="course.imageUrl" 
  :alt="course.title"
  loading="lazy"
/>
```

#### 成功指標
- [ ] 列表滾動流暢（60fps）
- [ ] 首屏渲染時間 < 1s
- [ ] 內存使用穩定

---

### 6️⃣ 實現 API 響應緩存 ⭐⭐
**優先級**: 中  
**預計時間**: 半天

#### 緩存策略

**A. 靜態資源緩存（課程、經驗分享）**
```typescript
// src/services/api-enhanced.ts
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 分鐘
})

async get<T>(url: string, options?: { cache?: boolean }) {
  if (options?.cache) {
    const cached = cache.get(url)
    if (cached) return cached
  }
  
  const response = await this.request<T>({ method: 'GET', url })
  
  if (options?.cache) {
    cache.set(url, response)
  }
  
  return response
}
```

**B. HTTP 緩存標頭（後端）**
```typescript
// functions/api/v1/courses/[id].ts
return createSuccessResponse(course, '查詢成功', 200, {
  'Cache-Control': 'public, max-age=300', // 5 分鐘
  'ETag': generateETag(course)
})
```

**C. SWR 策略（Stale-While-Revalidate）**
```typescript
// 使用 @tanstack/vue-query
const { data, isLoading } = useQuery({
  queryKey: ['course', id],
  queryFn: () => fetchCourse(id),
  staleTime: 5 * 60 * 1000, // 5 分鐘內使用緩存
  cacheTime: 10 * 60 * 1000 // 10 分鐘後清除
})
```

#### 成功指標
- [ ] 重複請求減少 70%
- [ ] 頁面切換更快
- [ ] 離線體驗改善

---

## 🎯 Phase 3: 本月完成（2024-11 月底）

### 7️⃣ 完成所有 API 遷移 ⭐⭐⭐⭐
**目標**: 遷移剩餘 24+ 個 API

```
低優先級（管理功能）：
□ admin/courses.ts
□ admin/users.ts
□ admin/jobs.ts
□ admin/experiences.ts
□ ttqs/plans.ts
□ ttqs/plans/[planId].ts
□ 其他管理 API...
```

---

### 8️⃣ 性能優化總結 ⭐⭐⭐
**預計時間**: 1 天

#### A. 構建優化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['element-plus'],
          'utils': ['axios', 'dayjs']
        }
      }
    }
  }
})
```

#### B. 預加載關鍵路由
```typescript
// 已實現，需要優化
routePreloader.preloadCriticalRoutes([
  '/courses',
  '/jobs',
  '/experiences'
])
```

#### C. 圖片優化
- 使用 WebP 格式
- 響應式圖片
- CDN 加速

---

### 9️⃣ 測試覆蓋率提升 ⭐⭐
**目標**: 達到 60% 覆蓋率

```
優先測試：
□ 認證流程（登入、註冊）
□ 課程報名流程
□ 職缺申請流程
□ 錯誤處理邏輯
```

---

## 🎯 Phase 4: 長期優化（12 月）

### 🔟 安全性增強 ⭐⭐
**優先級**: 低（當前已足夠）

#### A. CSP 策略（可選）
```typescript
// functions/_middleware.ts
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com"
)
```

#### B. Rate Limiting
```typescript
// 使用 Cloudflare Workers KV
const rateLimiter = new RateLimiter({
  limit: 100,
  window: 60 * 1000 // 1 分鐘
})
```

---

### 1️⃣1️⃣ 監控和分析 ⭐⭐
**優先級**: 低

#### A. 錯誤追蹤
- 集成 Sentry
- 自定義錯誤報告

#### B. 性能監控
- Real User Monitoring (RUM)
- 自定義性能指標

---

## 📊 進度追蹤

### 本週目標（11-14 ~ 11-20）
- [ ] 遷移 10 個 API
- [ ] 修復 4 個 TODO
- [ ] 清理 scroll 事件

### 下週目標（11-21 ~ 11-27）
- [ ] 再遷移 10 個 API
- [ ] 優化大列表渲染
- [ ] 實現 API 緩存

### 本月目標（11 月底）
- [ ] 完成所有 API 遷移
- [ ] 性能優化總結
- [ ] 測試覆蓋率 60%

---

## 🎯 成功指標

### 代碼質量
- ✅ TypeScript 錯誤: 0
- ✅ ESLint 錯誤: 0
- 🎯 TODO 項目: 0（當前 4）
- 🎯 代碼重複: -50%（當前 -49%）
- 🎯 測試覆蓋率: 60%（當前 ~0%）

### 性能指標
- 🎯 FCP: < 1.5s（當前 ~2s）
- 🎯 LCP: < 2.5s（當前 ~3s）
- 🎯 FID: < 100ms（當前 ~150ms）
- 🎯 CLS: < 0.1（當前 ~0.15）

### 開發效率
- 🎯 API 開發時間: -60%
- 🎯 Bug 修復時間: -40%
- 🎯 新功能開發: +30% 速度

---

## 💡 關鍵原則

1. **先完成，再完美** - 不要過度優化
2. **測量後優化** - 用數據驅動決策
3. **漸進式改進** - 小步快跑
4. **保持簡單** - 避免過度工程

---

**制定者**: Kiro AI Assistant  
**最後更新**: 2024-11-14  
**下次檢查**: 2024-11-20
