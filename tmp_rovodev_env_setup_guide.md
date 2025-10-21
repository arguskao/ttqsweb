# 🔧 Cloudflare Pages 環境變量設置指南

## 🚨 問題發現

通過檢查發現 Cloudflare Pages 項目 `pharmacy-assistant-academy` 沒有配置任何 secrets，這就是 API 返回 500 錯誤的根本原因！

## 📋 需要設置的環境變量

根據 `.env.production` 文件，需要設置以下關鍵變量：

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. JWT_SECRET
```
production-jwt-secret-key-here
```

### 3. PASSWORD_SALT  
```
production-password-salt-here
```

## 🛠️ 設置命令

### 方法 1: 使用 Wrangler CLI
```bash
# 設置數據庫 URL
npx wrangler pages secret put DATABASE_URL --project-name pharmacy-assistant-academy

# 設置 JWT Secret
npx wrangler pages secret put JWT_SECRET --project-name pharmacy-assistant-academy

# 設置密碼鹽值
npx wrangler pages secret put PASSWORD_SALT --project-name pharmacy-assistant-academy
```

### 方法 2: 通過 Cloudflare Dashboard
1. 訪問 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 進入 Pages → pharmacy-assistant-academy → Settings → Environment variables
3. 在 Production 環境中添加變量

## 🎯 設置優先級

**高優先級（立即需要）：**
1. ✅ DATABASE_URL - 數據庫連接
2. ✅ JWT_SECRET - 用戶認證

**中優先級：**
3. PASSWORD_SALT - 密碼加密
4. MAX_FILE_SIZE - 文件上傳限制
5. ALLOWED_FILE_TYPES - 允許的文件類型

**低優先級：**
6. VITE_GA_TRACKING_ID - Google Analytics

## 📝 預期結果

設置完成後，API 應該：
- ✅ 返回正常的 JSON 響應而不是 500 錯誤
- ✅ 能夠連接到數據庫
- ✅ 文件下載、課程、工作等功能恢復正常