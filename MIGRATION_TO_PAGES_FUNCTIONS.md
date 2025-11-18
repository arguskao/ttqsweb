# 遷移到 Cloudflare Pages Functions 計劃

## 目標
完全使用 Cloudflare Pages Functions 的檔案路由系統，移除自定義 Router

## 當前狀況
- ✅ 已有 69 個 Pages Functions 路由檔案
- ⚠️ `src/api/` 中約有 60 個路由定義
- ⚠️ `[[path]].ts` 作為 catch-all 轉發到自定義 Router

## 已遷移的路由（在 functions/ 中）
- ✅ /api/v1/auth/login
- ✅ /api/v1/auth/register
- ✅ /api/v1/auth/profile
- ✅ /api/v1/instructors/profile
- ✅ /api/v1/courses
- ✅ /api/v1/documents
- ✅ /api/v1/jobs
- ✅ /api/v1/groups
- ✅ /api/v1/forum/topics
- ✅ /api/v1/experiences
- ✅ /api/v1/ttqs/*
- ✅ /api/v1/users/*

## 需要遷移的路由（在 src/api/ 中）

### 高優先級（常用端點）
1. ❌ /api/v1/auth/logout
2. ❌ /api/v1/auth/refresh
3. ❌ /api/v1/instructors/search
4. ❌ /api/v1/instructors/top-rated
5. ❌ /api/v1/jobs/pending-approval
6. ❌ /api/v1/jobs/location/:location

### 中優先級（功能端點）
7. ❌ /api/v1/analytics/* (dashboard, export, stats)
8. ❌ /api/v1/courses/popular
9. ❌ /api/v1/documents/:id/validate
10. ❌ /api/v1/files/* (categories, stats)

### 低優先級（工具端點）
11. ❌ /api/v1/health
12. ❌ /api/v1/info
13. ❌ /api/v1/debug/jwt
14. ❌ /api/v1/batch
15. ❌ /api/v1/errors/stats
16. ❌ /api/v1/docs/* (API 文檔)

## 遷移步驟

### Phase 1: 創建缺失的路由檔案 ✅ DONE
已創建以下新路由檔案：
- ✅ functions/api/v1/health.ts
- ✅ functions/api/v1/info.ts
- ✅ functions/api/v1/auth/logout.ts
- ✅ functions/api/v1/auth/refresh.ts
- ✅ functions/api/v1/courses/popular.ts
- ✅ functions/api/v1/instructors/search.ts
- ✅ functions/api/v1/instructors/top-rated.ts
- ✅ functions/api/v1/jobs/location/[location].ts
- ✅ functions/api/v1/jobs/pending-approval.ts

### Phase 2: 刪除 [[path]].ts ✅ DONE
- ✅ 已備份到 [[path]].ts.backup
- ✅ 已刪除 functions/api/v1/[[path]].ts
- ✅ 現在完全使用檔案路由系統

### Phase 3: 清理 src/api/ ⏳ NEXT
- 保留共用邏輯：types, errors
- 可選：移除不再使用的路由定義檔案
- 更新文檔

### Phase 4: 測試 ⏳ REQUIRED
測試所有端點是否正常工作（見下方測試清單）

## 保留的檔案（共用邏輯）
- src/api/types.ts - 型別定義
- src/api/errors.ts - 錯誤類別
- functions/utils/error-handler.ts - 錯誤處理工具（已存在）

## 刪除的檔案
- functions/api/v1/[[path]].ts - Catch-all 路由
- src/api/index.ts - 主路由入口
- src/api/router.ts - 自定義 Router
- src/api/auth-routes.ts - 認證路由（已遷移）
- src/api/instructor-routes.ts - 講師路由（已遷移）
- src/api/job-routes.ts - 工作路由（已遷移）
- src/api/course-routes*.ts - 課程路由（已遷移）
- src/api/documents-routes*.ts - 文件路由（已遷移）
- src/api/community/* - 社群路由（已遷移）
- src/api/instructor/* - 講師模組（已遷移）

## 預期效果
- ✅ 單一路由系統，無衝突
- ✅ 完全兼容 Cloudflare Workers
- ✅ 更好的性能（減少抽象層）
- ✅ 更清晰的檔案結構
- ✅ 統一的錯誤處理
