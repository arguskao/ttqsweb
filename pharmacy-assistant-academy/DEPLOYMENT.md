# 藥助Next學院 - 部署指南

## 概述

本文檔說明如何將藥助Next學院網站部署到 Cloudflare Pages，包括前端應用和 API Workers 的部署配置。

## 部署架構

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   用戶瀏覽器    │───▶│ Cloudflare CDN   │───▶│ Cloudflare Pages│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Cloudflare       │───▶│ Neon PostgreSQL │
                       │ Workers (API)    │    │ Database        │
                       └──────────────────┘    └─────────────────┘
```

## 環境配置

### 開發環境
- **URL**: http://localhost:5173
- **API**: http://localhost:3000
- **資料庫**: 本地開發資料庫

### 測試環境 (Staging)
- **URL**: https://staging.pharmacy-academy.com
- **API**: https://api-staging.pharmacy-academy.com
- **資料庫**: Neon PostgreSQL (staging)

### 生產環境 (Production)
- **URL**: https://pharmacy-academy.com
- **API**: https://api.pharmacy-academy.com
- **資料庫**: Neon PostgreSQL (production)

## 部署前準備

### 1. 安裝必要工具

```bash
# 安裝 Node.js (版本 20+)
# 安裝 Wrangler CLI
npm install -g wrangler

# 登入 Cloudflare
wrangler login
```

### 2. 設定環境變數

在 Cloudflare Dashboard 中設定以下環境變數：

**生產環境變數:**
```
NODE_ENV=production
VITE_API_BASE_URL=https://api.pharmacy-academy.com/api/v1
DATABASE_URL=postgresql://...
JWT_SECRET=your-production-jwt-secret
PASSWORD_SALT=your-production-salt
```

**測試環境變數:**
```
NODE_ENV=staging
VITE_API_BASE_URL=https://api-staging.pharmacy-academy.com/api/v1
DATABASE_URL=postgresql://...
JWT_SECRET=your-staging-jwt-secret
PASSWORD_SALT=your-staging-salt
```

## 部署方式

### 方式一：自動部署 (推薦)

使用 GitHub Actions 進行自動部署：

1. 推送代碼到 `main` 分支觸發生產部署
2. 推送代碼到 `develop` 分支觸發測試部署
3. 創建 Pull Request 觸發預覽部署

**必要的 GitHub Secrets:**
```
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### 方式二：手動部署

使用部署腳本：

```bash
# 部署到生產環境
./scripts/deploy.sh production

# 部署到測試環境
./scripts/deploy.sh staging

# 部署預覽版本
./scripts/deploy.sh preview
```

### 方式三：直接使用 npm 腳本

```bash
# 建置並部署到生產環境
npm run deploy:pages:production

# 建置並部署到測試環境
npm run deploy:pages:preview

# 部署 API Worker
npm run deploy:worker
```

## 自訂域名設定

### 1. 在 Cloudflare Pages 中設定自訂域名

1. 進入 Cloudflare Pages 專案設定
2. 點擊 "Custom domains"
3. 新增域名：
   - `pharmacy-academy.com`
   - `www.pharmacy-academy.com`

### 2. DNS 設定

在 Cloudflare DNS 中設定：

```
Type: CNAME
Name: pharmacy-academy.com
Target: pharmacy-assistant-academy.pages.dev

Type: CNAME  
Name: www
Target: pharmacy-academy.com
```

### 3. SSL 憑證

Cloudflare 會自動提供 SSL 憑證，確保：
- SSL/TLS 加密模式設為 "Full (strict)"
- 啟用 "Always Use HTTPS"
- 啟用 "HTTP Strict Transport Security (HSTS)"

## 效能優化設定

### 1. Cloudflare 快取設定

```
# Page Rules
pharmacy-academy.com/api/*
- Cache Level: Bypass

pharmacy-academy.com/*
- Cache Level: Standard
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours
```

### 2. 壓縮設定

在 Cloudflare 中啟用：
- Brotli 壓縮
- Gzip 壓縮
- Auto Minify (HTML, CSS, JS)

## 監控與分析

### 1. Cloudflare Analytics

- 啟用 Web Analytics
- 設定 Core Web Vitals 監控
- 配置 Security Analytics

### 2. 錯誤監控

```javascript
// 在 functions/_middleware.ts 中加入錯誤追蹤
export async function onRequestError(context) {
  // 記錄錯誤到 Cloudflare Analytics
  console.error('Application Error:', context.error);
  
  return new Response('Internal Server Error', { 
    status: 500,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
```

## 部署檢查清單

### 部署前檢查
- [ ] 所有測試通過
- [ ] 代碼已通過 lint 檢查
- [ ] 環境變數已正確設定
- [ ] 資料庫遷移已完成
- [ ] SSL 憑證已配置

### 部署後檢查
- [ ] 網站可正常訪問
- [ ] API 端點正常運作
- [ ] 用戶註冊/登入功能正常
- [ ] 課程瀏覽功能正常
- [ ] 就業媒合功能正常
- [ ] 文件下載功能正常
- [ ] 效能指標符合預期
- [ ] 安全標頭已正確設定

## 回滾程序

如果部署出現問題，可以快速回滾：

### 1. Cloudflare Pages 回滾
```bash
# 回滾到上一個版本
wrangler pages deployment list --project-name=pharmacy-assistant-academy
wrangler pages deployment rollback <deployment-id> --project-name=pharmacy-assistant-academy
```

### 2. API Worker 回滾
```bash
# 回滾 Worker
wrangler rollback
```

### 3. 資料庫回滾
```bash
# 如果有資料庫變更，執行回滾遷移
npm run migrate:rollback
```

## 故障排除

### 常見問題

**1. 建置失敗**
```bash
# 檢查 Node.js 版本
node --version  # 應該是 20+

# 清除快取並重新安裝
rm -rf node_modules package-lock.json
npm install
```

**2. API 連接失敗**
- 檢查 VITE_API_BASE_URL 環境變數
- 確認 API Worker 已正確部署
- 檢查 CORS 設定

**3. 資料庫連接問題**
- 檢查 DATABASE_URL 環境變數
- 確認 Neon PostgreSQL 連接字串正確
- 檢查資料庫防火牆設定

**4. SSL 憑證問題**
- 確認域名 DNS 指向正確
- 檢查 Cloudflare SSL 設定
- 等待憑證生成（可能需要幾分鐘）

## 聯絡支援

如果遇到部署問題，請聯絡：
- 技術支援：tech-support@pharmacy-academy.com
- 緊急聯絡：+886-xxx-xxx-xxx

## 更新記錄

- 2024-10-19: 初始部署配置
- 2024-10-19: 新增自動部署流程
- 2024-10-19: 新增監控和分析設定