# 藥助Next學院 API 文檔

## 概述

藥助Next學院 API 提供完整的藥局助理轉職教育與就業媒合服務。

## 快速開始

### 環境設置

1. 複製環境變數檔案：
```bash
cp .env.example .env
```

2. 設定資料庫連接：
```bash
# 在 .env 檔案中設定 Neon PostgreSQL 連接字串
DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/pharmacy_academy?sslmode=require
JWT_SECRET=your-jwt-secret-key-here
```

3. 執行資料庫遷移：
```bash
npm run migrate up
```

4. 啟動開發伺服器：
```bash
npm run api:dev
```

API 伺服器將在 `http://localhost:3000` 啟動。

### 基本端點

- **健康檢查**: `GET /api/v1/health`
- **API 資訊**: `GET /api/v1/info`

## API 結構

### 認證端點 (計劃中)
- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/register` - 用戶註冊
- `POST /api/v1/auth/logout` - 用戶登出
- `GET /api/v1/auth/profile` - 獲取用戶資料

### 課程端點 (計劃中)
- `GET /api/v1/courses` - 獲取課程列表
- `GET /api/v1/courses/:id` - 獲取課程詳情
- `POST /api/v1/courses/:id/enroll` - 註冊課程
- `GET /api/v1/courses/:id/progress` - 獲取學習進度

### 就業媒合端點 (計劃中)
- `GET /api/v1/jobs` - 獲取職缺列表
- `POST /api/v1/jobs` - 發布職缺 (雇主)
- `GET /api/v1/jobs/:id` - 獲取職缺詳情
- `POST /api/v1/jobs/:id/apply` - 申請職缺

### 用戶端點 (計劃中)
- `GET /api/v1/users/profile` - 獲取個人資料
- `PUT /api/v1/users/profile` - 更新個人資料
- `GET /api/v1/users/dashboard` - 獲取用戶儀表板

### 文件端點 (計劃中)
- `GET /api/v1/files` - 獲取文件列表
- `GET /api/v1/files/:id/download` - 下載文件
- `POST /api/v1/files/upload` - 上傳文件

### 管理端點 (計劃中)
- `GET /api/v1/admin/stats` - 獲取統計數據
- `GET /api/v1/admin/users` - 獲取用戶列表
- `GET /api/v1/admin/reports` - 獲取報告

## 資料庫管理

### 遷移命令

```bash
# 執行待處理的遷移
npm run migrate up

# 查看遷移狀態
npm run migrate status

# 重置資料庫 (⚠️ 會刪除所有資料)
npm run migrate reset
```

### 資料表結構

- **users** - 用戶資料 (求職者/雇主)
- **courses** - 課程資料
- **course_enrollments** - 課程註冊記錄
- **jobs** - 職缺資料
- **job_applications** - 求職申請記錄
- **documents** - 文件資料

## 錯誤處理

API 使用統一的錯誤響應格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息",
    "details": {
      "field": "詳細錯誤說明"
    },
    "statusCode": 400
  }
}
```

### 常見錯誤代碼

- `VALIDATION_ERROR` (400) - 輸入驗證錯誤
- `AUTHENTICATION_ERROR` (401) - 認證失敗
- `AUTHORIZATION_ERROR` (403) - 權限不足
- `NOT_FOUND` (404) - 資源不存在
- `CONFLICT_ERROR` (409) - 資源衝突
- `DATABASE_ERROR` (500) - 資料庫錯誤
- `INTERNAL_ERROR` (500) - 內部伺服器錯誤

## 認證

API 使用 JWT (JSON Web Token) 進行認證。在請求標頭中包含：

```
Authorization: Bearer <your-jwt-token>
```

## 分頁

支援分頁的端點使用以下查詢參數：

- `page` - 頁碼 (預設: 1)
- `limit` - 每頁項目數 (預設: 10)
- `sortBy` - 排序欄位 (預設: id)
- `sortOrder` - 排序順序 ASC/DESC (預設: DESC)

響應格式：

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 開發工具

### 中介軟體

- **CORS** - 跨域資源共享
- **日誌記錄** - 請求/響應日誌
- **錯誤處理** - 統一錯誤處理
- **認證** - JWT 令牌驗證
- **速率限制** - API 請求頻率限制
- **請求驗證** - 輸入資料驗證

### 資料庫工具

- **BaseRepository** - 基礎 CRUD 操作
- **遷移系統** - 資料庫版本管理
- **連接池** - 資料庫連接管理
- **事務支援** - 資料庫事務處理

## 部署

### Cloudflare Workers + Pages (推薦)

API 專為 Cloudflare 生態系統設計：

- **前端**: Cloudflare Pages (Vue.js)
- **API**: Cloudflare Workers (無伺服器)
- **資料庫**: Neon PostgreSQL (已配置)

詳細部署指南請參考 [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

### 快速部署

```bash
# 1. 設定環境變數
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET

# 2. 部署 API
npm run deploy:worker

# 3. 執行遷移
npm run migrate up

# 4. 部署前端
npm run build && npm run deploy:pages
```

## 貢獻

請參考專案的貢獻指南來參與開發。