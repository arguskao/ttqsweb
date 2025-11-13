# 部署指南 - 講師功能

## 部署步驟

### 1. 資料庫 Migration

執行以下命令創建訊息表：

```bash
npx tsx src/scripts/create-messages-table.ts
```

或者直接執行 SQL：

```sql
-- 在 Neon 資料庫控制台執行
CREATE TABLE IF NOT EXISTS course_messages (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    CONSTRAINT check_broadcast_or_recipient CHECK (
        (is_broadcast = TRUE AND recipient_id IS NULL) OR
        (is_broadcast = FALSE AND recipient_id IS NOT NULL)
    )
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_course_messages_course ON course_messages(course_id);
CREATE INDEX IF NOT EXISTS idx_course_messages_sender ON course_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_course_messages_recipient ON course_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_course_messages_created_at ON course_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_messages_unread ON course_messages(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_course_messages_course_recipient ON course_messages(course_id, recipient_id);
```

### 2. 部署到 Cloudflare Pages

```bash
# 構建前端
npm run build

# 部署（如果使用 Cloudflare Pages）
# 會自動部署 functions 目錄下的 API
```

### 3. 驗證部署

#### 檢查 API 端點

```bash
# 測試獲取學員名單（需要講師 token）
curl -X GET https://your-domain.pages.dev/api/v1/courses/1/students \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN"

# 測試發送訊息（需要講師 token）
curl -X POST https://your-domain.pages.dev/api/v1/courses/1/messages \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "測試訊息",
    "message": "這是一條測試訊息",
    "isBroadcast": true
  }'

# 測試獲取訊息（需要學員 token）
curl -X GET https://your-domain.pages.dev/api/v1/courses/1/messages \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

## 新增的檔案

### 後端 API
- `functions/api/v1/courses/[courseId]/students.ts` - 學員名單 API
- `functions/api/v1/courses/[courseId]/messages.ts` - 訊息 API

### 前端頁面
- `src/views/instructor/CourseStudentsView.vue` - 講師學員管理頁面
- `src/views/courses/CourseMessagesView.vue` - 學員查看訊息頁面

### 資料庫
- `src/database/migrations/030_create_course_messages_table.sql` - 訊息表 migration
- `src/scripts/create-messages-table.ts` - 創建訊息表的腳本

### 文檔
- `INSTRUCTOR_FEATURES.md` - 功能說明文檔
- `DEPLOYMENT_GUIDE.md` - 部署指南（本文件）

## 修改的檔案

- `src/router/index.ts` - 添加新路由
- `src/views/instructor/InstructorMyCoursesView.vue` - 添加學員管理按鈕
- `src/views/courses/CourseDetailView.vue` - 添加查看訊息按鈕

## 環境變數

確保以下環境變數已設置：

```env
DATABASE_URL=your_neon_database_url
```

## Cloudflare Pages 設置

### Functions 路由

Cloudflare Pages 會自動識別以下路由：

- `/api/v1/courses/:courseId/students` → `functions/api/v1/courses/[courseId]/students.ts`
- `/api/v1/courses/:courseId/messages` → `functions/api/v1/courses/[courseId]/messages.ts`

### 環境變數設置

在 Cloudflare Pages 控制台：

1. 進入專案設置
2. 選擇「Environment variables」
3. 添加 `DATABASE_URL`

## 測試清單

部署後請測試以下功能：

### 講師功能
- [ ] 登入講師帳號
- [ ] 查看「我的授課」頁面
- [ ] 點擊「學員管理」查看學員名單
- [ ] 查看學員統計資訊（總數、進行中、已完成、平均進度）
- [ ] 發送群發訊息給所有學員
- [ ] 發送單獨訊息給特定學員
- [ ] 確認訊息發送成功

### 學員功能
- [ ] 登入學員帳號
- [ ] 報名課程
- [ ] 進入課程詳情頁
- [ ] 點擊「查看課程訊息」
- [ ] 確認可以看到講師發送的訊息
- [ ] 確認群發訊息和單獨訊息都能正確顯示

### 權限測試
- [ ] 講師無法看到其他講師課程的學員
- [ ] 學員無法看到未報名課程的訊息
- [ ] 講師無法報名課程（不顯示報名按鈕）
- [ ] 一般用戶可以正常報名課程

## 故障排除

### 問題：無法創建訊息表

**解決方案：**
1. 檢查 DATABASE_URL 是否正確
2. 確認資料庫連接正常
3. 手動在 Neon 控制台執行 SQL

### 問題：API 返回 401 未授權

**解決方案：**
1. 檢查 token 是否有效
2. 確認 token 包含正確的 userId 和 userType
3. 檢查瀏覽器 localStorage 和 sessionStorage

### 問題：講師看不到學員名單

**解決方案：**
1. 確認講師身份正確（userType = 'instructor'）
2. 檢查課程的 instructor_id 是否正確關聯
3. 查看瀏覽器控制台的錯誤訊息

### 問題：學員收不到訊息

**解決方案：**
1. 確認學員已報名課程
2. 檢查 course_enrollments 表中的記錄
3. 確認訊息已正確插入 course_messages 表

## 效能優化

已實施的優化：

1. **資料庫索引**：為常用查詢添加索引
2. **查詢優化**：使用 JOIN 減少查詢次數
3. **權限檢查**：在 API 層面進行權限驗證

## 安全性

已實施的安全措施：

1. **JWT 驗證**：所有 API 都需要有效的 JWT token
2. **權限控制**：檢查用戶是否有權限訪問資源
3. **資料驗證**：驗證輸入資料的有效性
4. **SQL 注入防護**：使用參數化查詢

## 監控建議

建議監控以下指標：

1. **API 回應時間**：學員名單和訊息查詢的回應時間
2. **錯誤率**：API 錯誤的頻率
3. **訊息發送量**：每日發送的訊息數量
4. **資料庫查詢效能**：慢查詢日誌

## 備份建議

定期備份以下資料：

1. **course_messages 表**：所有訊息記錄
2. **course_enrollments 表**：學員報名記錄
3. **相關索引**：確保索引也被備份

## 回滾計劃

如果需要回滾：

1. **資料庫**：保留 course_messages 表（不影響現有功能）
2. **前端**：移除新增的路由和頁面
3. **API**：移除新增的 API 端點

回滾不會影響現有的課程和學員資料。
