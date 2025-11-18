# API 測試清單

## 遷移完成後必須測試的端點

### 🔐 認證相關 (Auth)
- [ ] POST /api/v1/auth/register - 註冊
- [ ] POST /api/v1/auth/login - 登入
- [ ] GET /api/v1/auth/profile - 獲取個人資料
- [ ] PUT /api/v1/auth/profile - 更新個人資料
- [ ] POST /api/v1/auth/logout - 登出
- [ ] POST /api/v1/auth/refresh - 刷新 token

### 👨‍🏫 講師相關 (Instructors)
- [ ] GET /api/v1/instructors - 獲取所有講師
- [ ] GET /api/v1/instructors/profile - 獲取當前講師資料
- [ ] GET /api/v1/instructors/search?q=關鍵字 - 搜尋講師
- [ ] GET /api/v1/instructors/top-rated - 獲取高評分講師
- [ ] GET /api/v1/instructors/:userId - 獲取講師詳情

### 💼 工作相關 (Jobs)
- [ ] GET /api/v1/jobs - 獲取所有工作
- [ ] GET /api/v1/jobs/:id - 獲取工作詳情
- [ ] GET /api/v1/jobs/stats - 工作統計
- [ ] GET /api/v1/jobs/location/:location - 按地點搜尋工作
- [ ] GET /api/v1/jobs/pending-approval - 待審核工作（管理員）
- [ ] POST /api/v1/jobs - 發布工作

### 📚 課程相關 (Courses)
- [ ] GET /api/v1/courses - 獲取所有課程
- [ ] GET /api/v1/courses/:id - 獲取課程詳情
- [ ] GET /api/v1/courses/popular - 獲取熱門課程
- [ ] POST /api/v1/courses/:id/enroll - 報名課程

### 📄 文件相關 (Documents)
- [ ] GET /api/v1/documents - 獲取所有文件
- [ ] GET /api/v1/documents/:id - 獲取文件詳情
- [ ] GET /api/v1/documents/:id/download - 下載文件
- [ ] POST /api/v1/documents - 上傳文件

### 👥 群組相關 (Groups)
- [ ] GET /api/v1/groups - 獲取所有群組
- [ ] GET /api/v1/groups/:id - 獲取群組詳情
- [ ] POST /api/v1/groups - 創建群組
- [ ] POST /api/v1/groups/:id/join - 加入群組

### 💬 論壇相關 (Forum)
- [ ] GET /api/v1/forum/topics - 獲取所有主題
- [ ] GET /api/v1/forum/topics/:id - 獲取主題詳情
- [ ] POST /api/v1/forum/topics - 創建主題

### 📝 經驗分享 (Experiences)
- [ ] GET /api/v1/experiences - 獲取所有經驗分享
- [ ] GET /api/v1/experiences/:id - 獲取經驗分享詳情
- [ ] POST /api/v1/experiences - 創建經驗分享

### 🛠️ 系統相關 (System)
- [ ] GET /api/v1/health - 健康檢查
- [ ] GET /api/v1/info - API 資訊

## 測試命令範例

### 1. 健康檢查
```bash
curl https://your-domain.pages.dev/api/v1/health
```

### 2. 登入測試
```bash
curl -X POST https://your-domain.pages.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. 獲取個人資料（需要 token）
```bash
curl https://your-domain.pages.dev/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. 搜尋講師
```bash
curl "https://your-domain.pages.dev/api/v1/instructors/search?q=藥學"
```

### 5. 獲取熱門課程
```bash
curl "https://your-domain.pages.dev/api/v1/courses/popular?limit=5"
```

### 6. 按地點搜尋工作
```bash
curl "https://your-domain.pages.dev/api/v1/jobs/location/台北"
```

## 預期結果

所有端點應該返回：
- ✅ 正確的 HTTP 狀態碼（200, 201, 400, 401, 404, 500）
- ✅ 統一的 JSON 格式
- ✅ 正確的 CORS headers
- ✅ 適當的錯誤訊息（如果失敗）

## 錯誤處理測試

### 測試無效 token
```bash
curl https://your-domain.pages.dev/api/v1/auth/profile \
  -H "Authorization: Bearer invalid_token"
```
預期：401 Unauthorized

### 測試不存在的路由
```bash
curl https://your-domain.pages.dev/api/v1/nonexistent
```
預期：404 Not Found

### 測試缺少必填欄位
```bash
curl -X POST https://your-domain.pages.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
預期：400 Bad Request

## 部署後測試

1. **本地測試**（如果有 dev server）
   ```bash
   npm run dev
   # 然後使用 localhost:8788 測試
   ```

2. **Preview 部署測試**
   ```bash
   npm run deploy:pages:preview
   # 使用 preview URL 測試
   ```

3. **Production 部署測試**
   ```bash
   npm run deploy:pages:production
   # 使用 production URL 測試
   ```

## 注意事項

- ⚠️ 確保環境變數已正確設置（DATABASE_URL, JWT_SECRET）
- ⚠️ 測試前先清除瀏覽器 localStorage 中的舊 token
- ⚠️ 某些端點需要特定權限（admin, instructor）
- ⚠️ 注意 rate limiting（如果有實作）
