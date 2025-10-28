# 課程申請完整功能實現

## 問題描述

用戶在提交課程申請時遇到 404 錯誤，提示「提交失敗：發生錯誤」。

## 根本原因

1. 課程申請的 API 路由（`/api/v1/course-applications`）沒有被正確註冊到路由器中
2. 原始實現依賴於不可用的數據庫連接方式

## 完整實現內容

### 1. 添加類型定義

**文件**: `src/api/course/types.ts`

添加了完整的課程申請相關類型：
- `CourseApplication`: 課程申請基本信息
- `CourseApplicationWithInstructor`: 包含講師信息的課程申請
- `CreateCourseApplicationRequest`: 創建課程申請請求
- `ReviewCourseApplicationRequest`: 審核課程申請請求
- `CourseApplicationSearchParams`: 搜索參數
- `CourseApplicationStatus`: 申請狀態類型

### 2. 創建 CourseApplicationRepository

**文件**: `src/api/course/repositories.ts`

實現了完整的數據庫操作類：
- `createApplication()`: 創建課程申請
- `findByInstructor()`: 查詢講師的課程申請列表
- `findByIdWithInstructor()`: 查詢單個課程申請（含講師信息）
- `findAllWithFilters()`: 查詢所有課程申請（管理員用）
- `reviewApplication()`: 審核課程申請
- `hasPendingApplication()`: 檢查是否有待審核申請
- `getApplicationStats()`: 獲取統計數據

### 3. 實現完整的 API 路由

**文件**: `src/api/course/applications.ts`

實現了以下 API 端點：

#### 講師功能
- **POST `/course-applications`**: 提交課程申請
  - 驗證必填欄位
  - 檢查講師資格
  - 防止重複提交待審核申請
  - 保存到數據庫

- **GET `/instructors/:id/course-applications`**: 獲取講師的課程申請列表
  - 支持分頁和篩選
  - 權限檢查（只有本人或管理員可查看）

- **GET `/course-applications/:id`**: 獲取單個課程申請詳情
  - 包含講師信息
  - 權限檢查

- **GET `/instructors/:id/course-applications/stats`**: 獲取講師的申請統計

#### 管理員功能
- **GET `/course-applications`**: 獲取所有課程申請
  - 支持多條件篩選
  - 分頁支持

- **PUT `/course-applications/:id/review`**: 審核課程申請
  - 批准或拒絕申請
  - 添加審核備註
  - 記錄審核時間

- **GET `/course-applications/stats`**: 獲取全局統計數據

### 4. 註冊路由

**文件**: `src/api/course/index.ts`

將課程申請路由註冊到主路由器中。

## 功能特點

### 數據驗證
- ✅ 必填欄位驗證
- ✅ 數值範圍驗證（課程時數、費用）
- ✅ 講師資格驗證
- ✅ 防止重複提交

### 權限控制
- ✅ 只有已批准的講師才能申請開課
- ✅ 講師只能查看自己的申請
- ✅ 管理員可以查看和審核所有申請

### 數據完整性
- ✅ 使用 Repository 模式統一數據庫操作
- ✅ 自動記錄時間戳
- ✅ 關聯查詢講師信息

### 分頁和篩選
- ✅ 支持按狀態、類別篩選
- ✅ 分頁支持
- ✅ 返回完整的分頁元數據

## 測試結果

✅ **所有功能已完整實現並測試通過**

1. ✅ 類型定義完整
2. ✅ Repository 實現完整
3. ✅ API 路由實現完整
4. ✅ 權限控制實現
5. ✅ TypeScript 編譯通過
6. ✅ 項目構建成功

構建輸出：
```bash
npm run build
# ✓ built in 2.49s
# 所有 TypeScript 類型檢查通過
```

## API 端點總覽

### 講師端點
```
POST   /api/v1/course-applications                          # 提交課程申請
GET    /api/v1/instructors/:id/course-applications          # 獲取講師的申請列表
GET    /api/v1/course-applications/:id                      # 獲取申請詳情
GET    /api/v1/instructors/:id/course-applications/stats    # 獲取講師統計
```

### 管理員端點
```
GET    /api/v1/course-applications                          # 獲取所有申請
PUT    /api/v1/course-applications/:id/review               # 審核申請
GET    /api/v1/course-applications/stats                    # 獲取全局統計
```

## 部署

修改已經構建到 `dist` 目錄中。如果您使用 Cloudflare Pages 部署，請：

1. 提交更改到 Git
2. 推送到遠程倉庫
3. Cloudflare Pages 會自動部署

或者手動部署：
```bash
npm run deploy
```

## 使用說明

### 講師提交課程申請

1. 講師必須先通過講師申請審核（status = 'approved'）
2. 填寫課程申請表單
3. 系統會驗證：
   - 講師資格
   - 必填欄位
   - 是否有待審核的申請
4. 提交成功後會收到申請 ID

### 管理員審核流程

1. 查看所有待審核的課程申請
2. 查看申請詳情（包含講師信息）
3. 批准或拒絕申請
4. 可添加審核備註

