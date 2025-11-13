# 快速開始指南 - 講師功能

## 🚀 快速部署（5 分鐘）

### 步驟 1: 創建資料庫表
```bash
npx tsx src/scripts/create-messages-table.ts
```

預期輸出：
```
✅ 訊息表創建成功
✅ 索引創建成功
✅ 驗證成功：course_messages 表已存在
```

### 步驟 2: 驗證功能
```bash
npx tsx src/scripts/test-instructor-features.ts
```

預期輸出：
```
✅ 資料庫表結構正確
✅ 索引已創建
✅ 查詢功能正常
🎉 所有測試通過！
```

### 步驟 3: 構建和部署
```bash
npm run build
```

完成！功能已準備就緒。

## 📱 使用指南

### 講師使用流程

1. **登入系統**
   - 使用講師帳號登入
   - 確認身份為 `instructor`

2. **查看課程**
   - 點擊導航欄的「我的授課」
   - 查看自己教授的課程列表

3. **管理學員**
   - 在課程卡片上點擊「學員管理」
   - 查看學員名單、進度和統計資訊

4. **發送訊息**
   
   **群發訊息（發送給所有學員）：**
   - 在學員管理頁面點擊「發送訊息給學員」
   - 填寫主旨和訊息內容
   - 點擊「發送訊息」
   
   **單獨發送（發送給特定學員）：**
   - 在學員列表中找到目標學員
   - 點擊該學員的「發送訊息」按鈕
   - 填寫主旨和訊息內容
   - 點擊「發送訊息」

### 學員使用流程

1. **登入系統**
   - 使用學員帳號登入

2. **報名課程**
   - 瀏覽課程列表
   - 選擇課程並點擊「立即報名」

3. **查看訊息**
   - 進入已報名的課程詳情頁
   - 點擊「查看課程訊息」按鈕
   - 查看講師發送的所有訊息

## 🔍 功能測試清單

### 講師功能測試
- [ ] 登入講師帳號
- [ ] 進入「我的授課」頁面
- [ ] 看到自己的課程列表
- [ ] 點擊「學員管理」按鈕
- [ ] 看到學員名單和統計資訊
- [ ] 點擊「發送訊息給學員」
- [ ] 填寫並發送群發訊息
- [ ] 點擊特定學員的「發送訊息」
- [ ] 填寫並發送單獨訊息
- [ ] 確認訊息發送成功

### 學員功能測試
- [ ] 登入學員帳號
- [ ] 瀏覽課程列表
- [ ] 報名一個課程
- [ ] 進入課程詳情頁
- [ ] 點擊「查看課程訊息」
- [ ] 看到講師發送的訊息
- [ ] 確認群發訊息顯示正確
- [ ] 確認單獨訊息顯示正確

### 權限測試
- [ ] 講師無法看到「立即報名」按鈕
- [ ] 講師看到「管理課程」按鈕
- [ ] 學員無法訪問其他課程的訊息
- [ ] 講師無法訪問其他講師的學員名單

## 🐛 常見問題

### Q1: 執行 migration 時出現錯誤
**A:** 檢查 `.env` 檔案中的 `DATABASE_URL` 是否正確設置。

### Q2: 講師看不到學員名單
**A:** 確認：
1. 講師身份正確（userType = 'instructor'）
2. 課程的 instructor_id 正確關聯到講師
3. 課程有學員報名

### Q3: 學員收不到訊息
**A:** 確認：
1. 學員已報名該課程
2. 訊息已成功發送（檢查資料庫）
3. 學員使用正確的課程 ID 查看訊息

### Q4: API 返回 401 錯誤
**A:** 確認：
1. Token 是否有效
2. Token 是否包含正確的 userId 和 userType
3. 檢查瀏覽器的 localStorage 和 sessionStorage

## 📊 API 測試

### 測試學員名單 API
```bash
curl -X GET https://your-domain.pages.dev/api/v1/courses/1/students \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN"
```

### 測試發送訊息 API
```bash
curl -X POST https://your-domain.pages.dev/api/v1/courses/1/messages \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "測試訊息",
    "message": "這是一條測試訊息",
    "isBroadcast": true
  }'
```

### 測試查看訊息 API
```bash
curl -X GET https://your-domain.pages.dev/api/v1/courses/1/messages \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

## 📁 檔案結構

```
functions/api/v1/courses/[courseId]/
├── students.ts          # 學員名單 API
└── messages.ts          # 訊息 API

src/views/
├── instructor/
│   ├── InstructorMyCoursesView.vue      # 我的授課（已修改）
│   └── CourseStudentsView.vue           # 學員管理（新增）
└── courses/
    ├── CourseDetailView.vue             # 課程詳情（已修改）
    └── CourseMessagesView.vue           # 課程訊息（新增）

src/database/migrations/
└── 030_create_course_messages_table.sql # 訊息表 migration

src/scripts/
├── create-messages-table.ts             # 創建訊息表
└── test-instructor-features.ts          # 功能測試
```

## 🎯 下一步

完成基本功能後，可以考慮：

1. **訊息已讀狀態**
   - 追蹤學員是否已讀訊息
   - 顯示已讀/未讀標記

2. **Email 通知**
   - 發送訊息時同時發送 Email
   - 使用 Cloudflare Workers 的 Email API

3. **訊息回覆**
   - 允許學員回覆講師的訊息
   - 建立對話串

4. **訊息搜尋**
   - 搜尋歷史訊息
   - 按日期、主旨篩選

## 📚 相關文檔

- `INSTRUCTOR_FEATURES.md` - 詳細功能說明
- `DEPLOYMENT_GUIDE.md` - 完整部署指南
- `IMPLEMENTATION_SUMMARY.md` - 實現總結

## 💡 提示

- 所有 API 都需要有效的 JWT token
- 講師只能查看和管理自己的課程
- 學員只能查看已報名課程的訊息
- 群發訊息會為每個學員創建一條記錄

## ✅ 完成檢查

部署完成後，確認以下項目：

- [ ] 資料庫表創建成功
- [ ] 測試腳本執行通過
- [ ] 前端頁面可以正常訪問
- [ ] API 端點回應正常
- [ ] 權限控制正確
- [ ] 訊息發送和接收正常

全部完成後，系統即可投入使用！🎉
