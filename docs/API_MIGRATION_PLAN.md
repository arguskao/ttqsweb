# 🚀 API 遷移計劃

> **目標**: 將所有 `src/api/` 的路由遷移到 `functions/api/v1/`  
> **預計時間**: 1-2 週  
> **當前進度**: 33/240+ 路由 (~14%)

---

## 📊 當前狀態

### ✅ 已遷移（33 個文件）

#### 認證相關
- [x] auth/login.ts
- [x] auth/register.ts

#### 課程相關
- [x] courses.ts (列表)
- [x] courses/[id].ts (詳情)
- [x] courses/[id]/enroll.ts (報名)
- [x] courses/[id]/progress.ts (進度)
- [x] courses/[courseId]/students.ts (學員)
- [x] courses/[courseId]/messages.ts (訊息)
- [x] courses/[courseId]/enrollments/[enrollmentId].ts

#### 經驗分享
- [x] experiences.ts
- [x] experiences/[experienceId].ts
- [x] experiences/[experienceId]/comments.ts
- [x] experiences/[experienceId]/like.ts
- [x] admin/experiences.ts
- [x] instructors/experiences.ts

#### 群組相關
- [x] groups.ts
- [x] groups/[groupId].ts
- [x] groups/[groupId]/join.ts
- [x] groups/[groupId]/members.ts

#### 論壇相關
- [x] forum/topics.ts
- [x] forum/topics/[topicId].ts
- [x] forum/topics/[topicId]/replies.ts

#### 講師相關
- [x] instructor-applications.ts
- [x] instructors/[instructorId]/courses.ts
- [x] users/[userId]/instructor-application.ts

#### 工作相關
- [x] jobs/[id]/favorite.ts
- [x] job-applications/upload-resume.ts

#### 用戶相關
- [x] users/enrollments.ts
- [x] users/favorites.ts

#### 其他
- [x] upload.ts
- [x] sync-files.ts
- [x] ttqs/plans.ts
- [x] ttqs/plans/[planId].ts

---

## 🎯 待遷移的主要模塊

### 1. Jobs 模塊（高優先級）⭐⭐⭐

**文件**: `src/api/jobs/`

需要遷移的路由：
- [ ] GET /api/v1/jobs - 工作列表
- [ ] POST /api/v1/jobs - 創建工作
- [ ] GET /api/v1/jobs/:id - 工作詳情
- [ ] PUT /api/v1/jobs/:id - 更新工作
- [ ] DELETE /api/v1/jobs/:id - 刪除工作
- [ ] GET /api/v1/jobs/employer - 雇主的工作
- [ ] GET /api/v1/jobs/pending-approval - 待審核工作
- [ ] PUT /api/v1/jobs/:id/approve - 審核工作
- [ ] GET /api/v1/jobs/type/:type - 按類型查詢
- [ ] GET /api/v1/jobs/location/:location - 按地點查詢
- [ ] GET /api/v1/jobs/stats - 工作統計
- [ ] GET /api/v1/jobs/:id/analytics - 工作分析

**工作申請相關**：
- [ ] GET /api/v1/job-applications - 申請列表
- [ ] POST /api/v1/job-applications - 提交申請
- [ ] GET /api/v1/job-applications/:id - 申請詳情
- [ ] PUT /api/v1/job-applications/:id - 更新申請
- [ ] DELETE /api/v1/job-applications/:id - 刪除申請
- [ ] PUT /api/v1/job-applications/:id/status - 更新狀態

**預計時間**: 2-3 小時

---

### 2. Documents 模塊（高優先級）⭐⭐⭐

**文件**: `src/api/documents/`

需要遷移的路由：
- [ ] GET /api/v1/documents - 文檔列表
- [ ] POST /api/v1/documents - 上傳文檔
- [ ] GET /api/v1/documents/:id - 文檔詳情
- [ ] PUT /api/v1/documents/:id - 更新文檔
- [ ] DELETE /api/v1/documents/:id - 刪除文檔
- [ ] GET /api/v1/documents/:id/download - 下載文檔
- [ ] POST /api/v1/documents/:id/share - 分享文檔

**預計時間**: 1-2 小時

---

### 3. Course 進階功能（中優先級）⭐⭐

**文件**: `src/api/course/`

需要遷移的路由：
- [ ] GET /api/v1/courses/popular - 熱門課程
- [ ] GET /api/v1/courses/recommended - 推薦課程
- [ ] POST /api/v1/courses/:id/review - 課程評價
- [ ] GET /api/v1/courses/:id/reviews - 評價列表
- [ ] POST /api/v1/courses/:id/favorite - 收藏課程
- [ ] GET /api/v1/course-applications - 課程申請
- [ ] POST /api/v1/course-applications - 提交申請
- [ ] PUT /api/v1/course-applications/:id/approve - 審核申請

**預計時間**: 2 小時

---

### 4. Instructor 進階功能（中優先級）⭐⭐

**文件**: `src/api/instructor/`

需要遷移的路由：
- [ ] GET /api/v1/instructors - 講師列表
- [ ] GET /api/v1/instructors/:id - 講師詳情
- [ ] PUT /api/v1/instructors/:id - 更新講師資料
- [ ] GET /api/v1/instructors/:id/stats - 講師統計
- [ ] POST /api/v1/instructors/:id/rating - 評分
- [ ] GET /api/v1/instructors/:id/ratings - 評分列表
- [ ] GET /api/v1/instructor-applications/pending - 待審核申請
- [ ] PUT /api/v1/instructor-applications/:id/approve - 審核申請

**預計時間**: 1.5 小時

---

### 5. TTQS 模塊（中優先級）⭐⭐

**文件**: `src/api/ttqs/`

需要遷移的路由：
- [ ] GET /api/v1/ttqs/executions - 執行記錄
- [ ] POST /api/v1/ttqs/executions - 創建執行
- [ ] GET /api/v1/ttqs/improvements - 改善行動
- [ ] POST /api/v1/ttqs/improvements - 創建改善
- [ ] GET /api/v1/ttqs/documents - TTQS 文檔
- [ ] POST /api/v1/ttqs/documents - 上傳文檔
- [ ] GET /api/v1/ttqs/analytics - TTQS 分析
- [ ] GET /api/v1/ttqs/reports - TTQS 報表

**預計時間**: 2 小時

---

### 6. Support 模塊（低優先級）⭐

**文件**: `src/api/support/`

需要遷移的路由：
- [ ] GET /api/v1/venues - 場地列表
- [ ] POST /api/v1/venues - 創建場地
- [ ] GET /api/v1/venues/:id - 場地詳情
- [ ] GET /api/v1/venue-bookings - 預約列表
- [ ] POST /api/v1/venue-bookings - 創建預約
- [ ] GET /api/v1/recommendations - 建議列表
- [ ] POST /api/v1/recommendations - 提交建議
- [ ] GET /api/v1/developments - 發展計劃
- [ ] POST /api/v1/developments - 創建計劃

**預計時間**: 1.5 小時

---

### 7. Analytics 模塊（低優先級）⭐

**文件**: `src/api/analytics-routes.ts`

需要遷移的路由：
- [ ] GET /api/v1/analytics/learning-stats - 學習統計
- [ ] GET /api/v1/analytics/job-matching-stats - 工作匹配統計
- [ ] GET /api/v1/analytics/course-satisfaction-stats - 課程滿意度
- [ ] GET /api/v1/analytics/dashboard - 儀表板數據
- [ ] GET /api/v1/analytics/export - 導出報表

**預計時間**: 1 小時

---

### 8. API Documentation（低優先級）⭐

**文件**: `src/api/api-docs-routes.ts`

需要遷移的路由：
- [ ] GET /api/v1/docs - API 文檔
- [ ] GET /api/v1/docs/openapi.json - OpenAPI 規範
- [ ] GET /api/v1/docs/markdown - Markdown 文檔
- [ ] GET /api/v1/docs/stats - 文檔統計
- [ ] POST /api/v1/docs/rescan - 重新掃描
- [ ] GET /api/v1/docs/endpoints - 端點列表

**預計時間**: 1 小時

---

## 📅 遷移時間表

### 第一批（今天）- 高優先級
- Jobs 模塊（2-3 小時）
- Documents 模塊（1-2 小時）

**預計完成**: 4-5 小時

### 第二批（明天）- 中優先級
- Course 進階功能（2 小時）
- Instructor 進階功能（1.5 小時）
- TTQS 模塊（2 小時）

**預計完成**: 5.5 小時

### 第三批（後天）- 低優先級
- Support 模塊（1.5 小時）
- Analytics 模塊（1 小時）
- API Documentation（1 小時）

**預計完成**: 3.5 小時

---

## 🔧 遷移步驟（標準流程）

每個 API 的遷移步驟：

1. **創建文件** (30 秒)
   ```bash
   touch functions/api/v1/jobs/[id].ts
   ```

2. **複製模板** (1 分鐘)
   ```typescript
   import { withErrorHandler } from '@/utils/error-handler'
   // ... 導入其他工具
   ```

3. **實現處理函數** (3-5 分鐘)
   - 從 `src/api/` 複製業務邏輯
   - 使用統一錯誤處理
   - 使用 Neon serverless driver

4. **導出包裝函數** (30 秒)
   ```typescript
   export const onRequestGet = withErrorHandler(handleGet, 'API Name')
   ```

5. **測試** (2 分鐘)
   ```bash
   curl http://localhost:8788/api/v1/jobs/1
   ```

**平均每個 API**: 7-10 分鐘

---

## ✅ 完成後的清理

遷移完成後：

1. **移除 `[[path]].ts`**
   ```bash
   git rm functions/api/v1/[[path]].ts
   ```

2. **移動 `src/api/` 到 `trash/`**
   ```bash
   mkdir -p trash
   git mv src/api trash/api-legacy
   ```

3. **保留必要的文件**
   - Repository 類
   - 工具函數
   - 類型定義

4. **更新文檔**

---

## 📊 預期成果

### 代碼減少
- **預計減少**: ~10,000 行代碼
- **平均減少**: 45-50%

### 性能提升
- **響應時間**: 減少 20-30%
- **冷啟動**: 更快（Cloudflare 原生）

### 維護性
- **統一架構**: 所有 API 使用相同模式
- **易於測試**: 標準化的錯誤處理
- **類型安全**: 完整的 TypeScript 支持

---

## 🚀 開始遷移

準備好了嗎？讓我們從第一批開始！

**命令**:
```bash
# 我會幫你創建和遷移每個 API
```

---

**創建時間**: 2024年12月19日  
**預計完成**: 2024年12月21日
