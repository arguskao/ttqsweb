# 社群與後續支援功能實施說明

## 概述

本文檔說明任務 12「社群與後續支援功能」的實施細節，包含學員交流系統和後續支援服務。

## 實施內容

### 12.1 學員交流系統

#### 資料庫結構

新增資料表（migration: `009_create_community_tables.sql`）：

1. **student_groups** - 學員群組表
   - 支援課程、興趣、校友、讀書會等類型
   - 追蹤成員數量

2. **group_members** - 群組成員表
   - 支援管理員、版主、成員三種角色
   - 記錄加入時間

3. **forum_topics** - 討論區主題表
   - 支援置頂和鎖定功能
   - 追蹤瀏覽數和回覆數

4. **forum_replies** - 討論區回覆表
   - 支援巢狀回覆
   - 可標記為解決方案

5. **experience_shares** - 經驗分享表
   - 支援多種分享類型（工作經驗、學習技巧、面試、職涯建議、成功故事）
   - 支援標籤系統
   - 追蹤按讚數、評論數、瀏覽數

6. **experience_comments** - 經驗分享評論表
   - 支援巢狀評論

#### API 端點

**群組管理** (`community-routes.ts`)：
- `GET /api/v1/groups` - 獲取所有群組列表
- `GET /api/v1/groups/my-groups` - 獲取用戶加入的群組
- `POST /api/v1/groups` - 創建新群組
- `POST /api/v1/groups/:id/join` - 加入群組

**討論區**：
- `GET /api/v1/groups/:id/topics` - 獲取群組的討論主題
- `POST /api/v1/groups/:id/topics` - 創建討論主題
- `GET /api/v1/topics/:id` - 獲取討論主題詳情
- `POST /api/v1/topics/:id/replies` - 回覆討論主題

**經驗分享**：
- `GET /api/v1/experiences` - 獲取經驗分享列表（支援精選篩選）
- `POST /api/v1/experiences` - 創建經驗分享
- `GET /api/v1/experiences/:id` - 獲取經驗分享詳情
- `POST /api/v1/experiences/:id/like` - 對經驗分享按讚
- `POST /api/v1/experiences/:id/comments` - 評論經驗分享

#### 前端頁面

1. **GroupsView.vue** - 群組列表頁面
   - 顯示所有群組和我的群組
   - 創建新群組功能
   - 加入群組功能

2. **ExperiencesView.vue** - 經驗分享頁面
   - 顯示所有經驗分享和精選內容
   - 發布經驗分享功能
   - 按讚和評論功能

### 12.2 後續支援服務

#### 資料庫結構

新增資料表（同樣在 `009_create_community_tables.sql`）：

1. **practice_venues** - 練習場地表
   - 記錄場地名稱、位置、容量
   - 支援設施列表和開放時間

2. **venue_bookings** - 場地預約表
   - 記錄預約日期和時間
   - 支援待確認、已確認、已取消、已完成等狀態

3. **retraining_recommendations** - 再培訓課程推薦表
   - 基於用戶學習歷程生成推薦
   - 支援高、中、低優先級
   - 追蹤推薦狀態

4. **instructor_development** - 講師發展路徑表
   - 追蹤講師發展階段（有興趣、培訓、助教、認證、資深）
   - 記錄教學時數和學員評分
   - 管理認證資訊

#### API 端點

**場地預約** (`support-routes.ts`)：
- `GET /api/v1/venues` - 獲取所有可用場地
- `GET /api/v1/venues/:id` - 獲取場地詳情
- `GET /api/v1/venues/:id/bookings` - 獲取場地預約情況
- `POST /api/v1/venues/:id/bookings` - 創建場地預約
- `GET /api/v1/bookings/my-bookings` - 獲取用戶的預約記錄
- `PATCH /api/v1/bookings/:id/cancel` - 取消預約

**課程推薦**：
- `GET /api/v1/recommendations/my-recommendations` - 獲取用戶的課程推薦
- `POST /api/v1/recommendations/generate` - 生成個性化課程推薦
- `PATCH /api/v1/recommendations/:id/accept` - 接受課程推薦
- `PATCH /api/v1/recommendations/:id/decline` - 拒絕課程推薦

**講師發展**：
- `POST /api/v1/instructor-development/apply` - 申請成為講師
- `GET /api/v1/instructor-development/status` - 獲取講師發展狀態
- `PATCH /api/v1/instructor-development/:id/stage` - 更新講師發展階段（管理員）
- `POST /api/v1/instructor-development/log-hours` - 記錄教學時數

#### 前端頁面

1. **VenuesView.vue** - 場地預約頁面
   - 顯示可用場地列表
   - 場地預約功能
   - 我的預約記錄管理

2. **RecommendationsView.vue** - 課程推薦頁面
   - 顯示個性化課程推薦
   - 生成推薦功能
   - 接受/拒絕推薦

3. **InstructorDevelopmentView.vue** - 講師發展頁面
   - 顯示講師發展狀態
   - 申請成為講師功能
   - 記錄教學時數
   - 發展路徑指引

## 整合說明

### API 整合

所有新的 API 路由已整合到主 API 入口（`src/api/index.ts`）：

```typescript
// Setup Community routes
import { setupCommunityRoutes } from './community-routes'
setupCommunityRoutes(router)

// Setup Support routes
import { setupSupportRoutes } from './support-routes'
setupSupportRoutes(router)
```

### 資料庫遷移

執行以下命令應用資料庫遷移：

```bash
npm run migrate
```

或針對 Cloudflare 環境：

```bash
npm run migrate:cloudflare
```

## 功能特點

### 學員交流系統

1. **群組功能**
   - 多種群組類型支援
   - 成員角色管理
   - 群組成員數追蹤

2. **討論區**
   - 主題置頂和鎖定
   - 巢狀回覆支援
   - 瀏覽數和回覆數統計

3. **經驗分享**
   - 多種分享類型
   - 標籤系統
   - 按讚和評論功能
   - 精選內容展示

### 後續支援服務

1. **場地預約**
   - 時間衝突檢測
   - 預約狀態管理
   - 場地設施資訊

2. **課程推薦**
   - 基於學習歷程的智能推薦
   - 優先級管理
   - 推薦狀態追蹤

3. **講師發展**
   - 五階段發展路徑
   - 教學時數追蹤
   - 學員評分系統
   - 認證管理

## 需求對應

本實施完全滿足以下需求：

- **需求 9.1**: 學員群組交流功能 ✓
- **需求 9.2**: 課後練習場地預約 ✓
- **需求 9.3**: 再培訓課程和持續進修機會 ✓
- **需求 9.4**: 成為講師的發展路徑 ✓

## 後續建議

1. **路由配置**: 需要在 Vue Router 中添加新頁面的路由配置
2. **權限管理**: 建議為管理員功能添加權限檢查
3. **通知系統**: 可以添加群組活動、預約確認等通知功能
4. **搜尋功能**: 為群組和經驗分享添加更強大的搜尋功能
5. **統計分析**: 添加社群活躍度和使用情況的統計分析

## 測試建議

1. 測試群組創建和加入流程
2. 測試討論區發帖和回覆功能
3. 測試經驗分享的發布和互動
4. 測試場地預約的時間衝突檢測
5. 測試課程推薦生成邏輯
6. 測試講師發展申請流程
