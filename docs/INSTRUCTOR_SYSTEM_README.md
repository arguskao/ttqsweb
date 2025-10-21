# 講師管理系統實施說明

## 概述

已完成講師管理系統的實施，包含講師註冊、審核、管理介面和評鑑系統。

## 實施內容

### 1. 資料庫結構 (7.1)

**新增資料表：**
- `instructors` - 講師資料表
  - 儲存講師申請資料、審核狀態、評分統計
  - 支援待審核、已批准、已拒絕三種狀態
  - 追蹤平均評分和評價總數
  - 支援講師停用機制

- `instructor_ratings` - 講師評價表
  - 儲存學員對講師的評價
  - 1-5分評分制度
  - 防止重複評價（同一學員對同一講師的同一課程只能評價一次）

**檔案位置：**
- `src/database/migrations/007_create_instructors_table.sql`

### 2. API 端點 (7.1)

**講師管理 API：**
- `POST /api/v1/instructors/apply` - 申請成為講師
- `GET /api/v1/instructors/profile` - 獲取講師個人資料
- `PUT /api/v1/instructors/profile` - 更新講師資料
- `GET /api/v1/instructors` - 獲取講師列表（支援篩選）
- `GET /api/v1/instructors/:id` - 獲取講師詳情
- `POST /api/v1/instructors/:id/review` - 審核講師申請（管理員）
- `POST /api/v1/instructors/:id/rate` - 評價講師
- `GET /api/v1/instructors/:id/ratings` - 獲取講師評價列表
- `GET /api/v1/instructors/:id/stats` - 獲取講師統計資料

**檔案位置：**
- `src/api/instructor-routes.ts`
- `src/api/index.ts` (已註冊路由)

### 3. 前端介面 (7.2)

**講師管理頁面：**

1. **講師個人中心** (`InstructorProfileView.vue`)
   - 顯示講師申請狀態
   - 講師資料編輯功能
   - 統計資料展示（評分、課程數、學員數）
   - 評價列表查看
   - 講師申請表單

2. **講師列表頁** (`InstructorsView.vue`)
   - 瀏覽所有已批准的講師
   - 專業領域搜尋
   - 分頁功能
   - 講師卡片展示

3. **講師詳情頁** (`InstructorDetailView.vue`)
   - 完整的講師資料展示
   - 個人簡介和資格證明
   - 教學統計
   - 學員評價列表

4. **管理員審核頁** (`InstructorApplicationsView.vue`)
   - 查看所有講師申請
   - 狀態篩選（待審核/已批准/已拒絕）
   - 批准/拒絕申請功能
   - 詳細資料查看

**檔案位置：**
- `src/views/instructor/InstructorProfileView.vue`
- `src/views/instructor/InstructorsView.vue`
- `src/views/instructor/InstructorDetailView.vue`
- `src/views/admin/InstructorApplicationsView.vue`

### 4. 評鑑系統 (7.3)

**講師評價組件：**
- `InstructorRatingModal.vue` - 可重用的評價彈窗組件
  - 1-5星評分系統
  - 評價內容輸入
  - 防止重複評價
  - 即時回饋

**自動退場機制：**
- 當講師獲得至少5個評價且平均分低於80分（4.0/5.0）時自動停用
- 在每次新增評價後自動檢查並執行

**檔案位置：**
- `src/components/common/InstructorRatingModal.vue`

### 5. 路由配置

**新增路由：**
- `/instructors` - 講師列表
- `/instructors/:id` - 講師詳情
- `/instructor/profile` - 講師個人中心（需登入）
- `/admin/instructor-applications` - 管理員審核頁（需登入）

**檔案位置：**
- `src/router/index.ts`

## 功能特點

### 講師申請流程
1. 用戶提交講師申請（提供簡介、資格證明、專業領域、工作年資）
2. 管理員審核申請
3. 批准後講師可以開始授課
4. 講師可以隨時更新個人資料

### 評鑑機制
1. 學員完成課程後可以評價講師
2. 評分採用1-5星制度
3. 系統自動計算平均評分
4. 評分低於80分（至少5個評價）時自動停用講師
5. 防止重複評價機制

### 統計功能
- 講師平均評分（5分制和100分制）
- 評價總數
- 授課數量
- 學員人數

## 資料庫遷移

執行以下命令來創建講師相關資料表：

```bash
# 如果使用本地資料庫
npm run migrate

# 如果使用 Cloudflare D1
npm run cloudflare-migrate
```

## API 使用範例

### 申請成為講師
```javascript
POST /api/v1/instructors/apply
{
  "bio": "我是一位資深藥師...",
  "qualifications": "藥師執照、...",
  "specialization": "藥學、保健食品",
  "years_of_experience": 5
}
```

### 評價講師
```javascript
POST /api/v1/instructors/123/rate
{
  "rating": 5,
  "comment": "講師教學認真，內容豐富",
  "course_id": 456
}
```

### 審核講師申請
```javascript
POST /api/v1/instructors/123/review
{
  "status": "approved"  // 或 "rejected"
}
```

## 注意事項

1. 講師評價功能需要學員已註冊相關課程
2. 管理員審核功能目前簡化實作，未來可加入更嚴格的權限控制
3. 講師停用後不會刪除資料，只是設置 `is_active = false`
4. 評分計算採用即時更新，每次新增評價後立即重新計算

## 後續改進建議

1. 加入管理員角色權限系統
2. 實作講師課程安排功能
3. 加入教學資料上傳功能
4. 實作更詳細的講師績效報告
5. 加入講師認證徽章系統
6. 實作講師排名功能
