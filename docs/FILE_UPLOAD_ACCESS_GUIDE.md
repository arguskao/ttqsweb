# 文件上傳功能訪問指南
File Upload Feature Access Guide

## 🎯 快速訪問

### 方式 1：直接 URL 訪問
```
https://a58800bf.pharmacy-assistant-academy.pages.dev/admin/files
```

### 方式 2：通過導航菜單
1. 使用管理員帳號登入
2. 點擊右上角用戶菜單
3. 選擇「文件管理」📁

---

## 🔐 管理員登入信息

**帳號：** `admin@ttqs.com`  
**密碼：** `admin123`

---

## 📋 功能說明

### 1. 上傳文件
- 支持拖拽上傳
- 支持點擊選擇文件
- 文件類型：圖片、PDF、Word、Excel、PowerPoint、視頻
- 最大文件大小：50MB

### 2. 文件分類
- **一般文件** (general)
- **課程資料** (course_materials)
- **用戶頭像** (user_avatars)
- **文檔** (documents)
- **圖片** (images)
- **視頻** (videos)
- **TTQS文件** (ttqs)

### 3. 文件管理
- 查看文件列表
- 複製文件 URL
- 查看文件詳情
- 刪除文件
- 搜索和篩選

### 4. R2 同步
- 點擊「同步 R2 文件」按鈕
- 自動同步 R2 存儲桶中的現有文件到數據庫

---

## 🚀 使用流程

### 上傳新文件

1. **登入管理員帳號**
   - 訪問：https://a58800bf.pharmacy-assistant-academy.pages.dev/login
   - 輸入管理員帳號密碼

2. **進入文件管理**
   - 點擊右上角用戶菜單 → 文件管理
   - 或直接訪問：/admin/files

3. **上傳文件**
   - 選擇「上傳文件」標籤
   - 拖拽文件或點擊「選擇文件」
   - 填寫文件信息：
     - 文件名稱（必填）
     - 文件描述（可選）
     - 文件分類（必選）
     - 是否公開
   - 點擊「開始上傳」

4. **查看上傳結果**
   - 上傳成功後自動切換到「文件列表」
   - 可以看到剛上傳的文件

### 管理現有文件

1. **查看文件列表**
   - 選擇「文件列表」標籤
   - 可以看到所有已上傳的文件

2. **搜索文件**
   - 在搜索框輸入文件名稱
   - 自動篩選結果

3. **按分類篩選**
   - 選擇分類下拉菜單
   - 選擇要查看的分類

4. **文件操作**
   - 📋 複製 URL：複製文件訪問地址
   - 🔗 查看文件：在新標籤頁打開文件
   - 🗑️ 刪除文件：刪除文件（需確認）

---

## 🔧 技術細節

### API 端點

```bash
# 上傳文件
POST /api/v1/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

# 獲取文件列表
GET /api/v1/upload?page=1&limit=20&category=documents
Authorization: Bearer <token>

# 同步 R2 文件
POST /api/v1/sync-files
Authorization: Bearer <token>

# 刪除文件
DELETE /api/v1/upload/:id
Authorization: Bearer <token>
```

### 數據庫表結構

使用 `documents` 表：
```sql
- id: 文件 ID
- title: 文件標題
- description: 文件描述
- file_url: 文件 URL
- file_type: 文件類型
- file_size: 文件大小
- category: 文件分類
- original_name: 原始文件名
- file_path: R2 存儲路徑
- uploaded_by: 上傳者 ID
- created_at: 創建時間
```

### R2 存儲結構

```
ttqs/
├── uploads/
│   ├── general/
│   ├── course_materials/
│   ├── documents/
│   ├── images/
│   ├── videos/
│   └── ttqs/
```

---

## ⚠️ 注意事項

1. **權限要求**
   - 只有管理員可以上傳和管理文件
   - 普通用戶只能查看公開文件

2. **文件限制**
   - 最大文件大小：50MB
   - 支持的文件類型有限制
   - 文件名會自動添加時間戳避免重複

3. **安全性**
   - 所有操作需要 JWT 認證
   - 文件類型會被驗證
   - 文件大小會被檢查

4. **存儲**
   - 文件存儲在 Cloudflare R2
   - 元數據存儲在 Neon PostgreSQL
   - 刪除文件時需要同時刪除 R2 和數據庫記錄

---

## 🐛 常見問題

### Q: 上傳失敗怎麼辦？
A: 檢查：
- 文件大小是否超過 50MB
- 文件類型是否支持
- 是否已登入管理員帳號
- 網絡連接是否正常

### Q: 如何獲取文件 URL？
A: 在文件列表中點擊「複製 URL」按鈕，URL 會自動複製到剪貼板。

### Q: 刪除文件後可以恢復嗎？
A: 不可以，刪除操作是永久性的，請謹慎操作。

### Q: 如何同步 R2 中的現有文件？
A: 點擊「同步 R2 文件」按鈕，系統會自動掃描 R2 存儲桶並將文件信息同步到數據庫。

---

## 📞 技術支持

如有問題，請檢查：
1. 瀏覽器控制台錯誤信息
2. 網絡請求狀態
3. 認證 token 是否有效

---

*最後更新：2024-10-28*  
*版本：v1.0*
