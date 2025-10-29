# 文件上傳系統使用指南

## 概述

這個文件上傳系統為藥學助理學院提供了安全的文件管理功能，只有管理員可以上傳和管理文件。

## 功能特點

### 🔒 安全性
- **權限控制**: 只有管理員（user_type = 'admin'）可以上傳文件
- **JWT 認證**: 所有操作都需要有效的認證令牌
- **文件類型限制**: 只允許安全的文件類型
- **文件大小限制**: 防止過大文件上傳（默認 50MB）
- **文件名清理**: 自動清理危險字符，防止路徑遍歷攻擊

### 📁 支持的文件類型
- **圖片**: JPG, PNG, GIF, WebP
- **文檔**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **視頻**: MP4, WebM, OGV

### 🏷️ 文件分類
- `course_materials`: 課程資料
- `user_avatars`: 用戶頭像
- `documents`: 文檔
- `images`: 圖片
- `videos`: 視頻
- `general`: 一般文件

## API 端點

### 上傳文件
```
POST /api/v1/upload
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: 要上傳的文件
- `category`: 文件分類（可選，默認 'general'）
- `description`: 文件描述（可選）

**響應:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "originalName": "document.pdf",
    "fileName": "document_1635123456_abc123.pdf",
    "fileUrl": "https://your-domain.com/uploads/documents/document_1635123456_abc123.pdf",
    "fileSize": 1024000,
    "fileType": "application/pdf",
    "category": "documents",
    "description": "重要文檔",
    "uploadedAt": "2023-10-25T10:30:45.123Z"
  }
}
```

### 獲取文件列表
```
GET /api/v1/upload?page=1&limit=20&category=documents
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**響應:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "original_name": "document.pdf",
      "file_name": "document_1635123456_abc123.pdf",
      "file_url": "https://your-domain.com/uploads/documents/document_1635123456_abc123.pdf",
      "file_size": 1024000,
      "file_type": "application/pdf",
      "category": "documents",
      "description": "重要文檔",
      "created_at": "2023-10-25T10:30:45.123Z",
      "first_name": "管理員",
      "last_name": "用戶"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

## 前端組件使用

### FileUpload 組件
```tsx
import FileUpload from '../components/FileUpload'

<FileUpload
  onUploadSuccess={(file) => console.log('上傳成功:', file)}
  onUploadError={(error) => console.error('上傳失敗:', error)}
  category="course_materials"
  acceptedTypes={['image/*', 'application/pdf']}
  maxSize={10} // 10MB
/>
```

### FileManager 頁面
管理員可以通過 `/admin/files` 頁面管理所有上傳的文件。

## 配置要求

### 環境變量
```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret
R2_BUCKET=your_cloudflare_r2_bucket_name
```

### Cloudflare R2 設置
1. 在 Cloudflare Dashboard 中創建 R2 存儲桶
2. 配置自定義域名（可選）
3. 在 `wrangler.toml` 中綁定 R2 存儲桶

### 數據庫遷移
運行遷移腳本創建 `uploaded_files` 表：
```sql
-- 見 src/database/migrations/013_create_uploaded_files_table.sql
```

## 安全建議

1. **定期清理**: 定期清理未使用的文件
2. **監控存儲**: 監控存儲使用量，防止濫用
3. **備份**: 定期備份重要文件
4. **訪問日誌**: 記錄文件訪問日誌
5. **病毒掃描**: 考慮集成病毒掃描服務

## 故障排除

### 常見錯誤

1. **"需要認證"**: 檢查 JWT 令牌是否有效
2. **"只有管理員可以上傳文件"**: 檢查用戶類型是否為 'admin'
3. **"文件大小不能超過 50MB"**: 減小文件大小或調整限制
4. **"不支持的文件類型"**: 檢查文件類型是否在允許列表中
5. **"文件存儲未配置"**: 檢查 R2 存儲桶配置

### 調試技巧
- 檢查瀏覽器開發者工具的網絡標籤
- 查看 Cloudflare Workers 日誌
- 檢查數據庫連接和表結構

## 未來改進

- [ ] 文件預覽功能
- [ ] 批量上傳
- [ ] 文件版本控制
- [ ] 圖片自動壓縮
- [ ] CDN 集成
- [ ] 文件搜索功能
- [ ] 文件標籤系統