# Cloudflare 部署指南

## 概述

這個專案使用 Cloudflare 生態系統進行部署：
- **Cloudflare Pages** - Vue.js 前端
- **Cloudflare Workers** - API 後端
- **Neon PostgreSQL** - 資料庫

## 前置準備

1. **Cloudflare 帳號** - 註冊 [Cloudflare](https://cloudflare.com)
2. **Neon 資料庫** - 你已經有了！
3. **Wrangler CLI** - 已安裝在專案中

## 部署步驟

### 1. 設定 Wrangler

```bash
# 登入 Cloudflare
npx wrangler login

# 驗證登入狀態
npx wrangler whoami
```

### 2. 設定環境變數

```bash
# 設定資料庫連接字串
npx wrangler secret put DATABASE_URL

# 當提示時，輸入你的 Neon 連接字串：
# postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# 設定 JWT 密鑰
npx wrangler secret put JWT_SECRET
# 輸入一個安全的隨機字串
```

### 3. 部署 API (Cloudflare Workers)

```bash
# 開發模式測試
npm run dev:worker

# 部署到生產環境
npm run deploy:worker
```

### 4. 執行資料庫遷移

```bash
# 使用本地腳本執行遷移
npm run migrate up
```

### 5. 部署前端 (Cloudflare Pages)

```bash
# 建置前端
npm run build

# 部署到 Cloudflare Pages
npm run deploy:pages
```

## 自動部署設定

### GitHub 整合

1. 在 Cloudflare Dashboard 中：
   - 進入 **Pages**
   - 點擊 **Create a project**
   - 連接你的 GitHub 儲存庫
   - 設定建置命令：`npm run build`
   - 設定輸出目錄：`dist`

2. 環境變數設定：
   - `VITE_API_BASE_URL`: `https://your-worker.your-subdomain.workers.dev/api/v1`

### Workers 自動部署

在 `.github/workflows/deploy.yml` 中設定 GitHub Actions：

```yaml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run deploy:worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 本地開發

### 1. 啟動 API 開發伺服器

```bash
# 使用 Wrangler 本地開發
npm run dev:worker

# 或使用 Node.js 開發伺服器
npm run api:dev
```

### 2. 啟動前端開發伺服器

```bash
npm run dev
```

## 環境配置

### 生產環境

- **API URL**: `https://your-worker.your-subdomain.workers.dev`
- **前端 URL**: `https://your-pages.pages.dev`

### 自訂域名

1. 在 Cloudflare Dashboard 中設定：
   - **Workers**: 設定 Custom Domain
   - **Pages**: 設定 Custom Domain

2. 更新 `wrangler.toml` 中的路由設定

## 監控與除錯

### Workers 日誌

```bash
# 即時查看 Workers 日誌
npx wrangler tail
```

### Pages 建置日誌

在 Cloudflare Dashboard > Pages > 你的專案 > 查看建置歷史

## 成本估算

### Cloudflare Workers
- **免費額度**: 100,000 請求/天
- **付費方案**: $5/月 + $0.50/百萬請求

### Cloudflare Pages
- **免費額度**: 無限靜態請求
- **建置**: 500 建置/月 (免費)

### Neon PostgreSQL
- **免費額度**: 0.5GB 儲存空間
- **付費方案**: 從 $19/月開始

## 故障排除

### 常見問題

1. **資料庫連接失敗**
   - 檢查 `DATABASE_URL` 環境變數
   - 確認 Neon 資料庫狀態

2. **CORS 錯誤**
   - 檢查 `_headers` 檔案設定
   - 確認 API 回應包含正確的 CORS 標頭

3. **建置失敗**
   - 檢查 Node.js 版本相容性
   - 確認所有依賴項目已安裝

### 除錯工具

```bash
# 檢查 Workers 狀態
npx wrangler status

# 測試本地 Workers
curl http://localhost:8787/api/v1/health

# 檢查環境變數
npx wrangler secret list
```