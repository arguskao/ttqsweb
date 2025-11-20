# 開發指南

## 🚀 本地開發環境設置

### 前提條件

- Node.js >= 20.19.0
- npm 或 yarn
- Git

---

## 📦 安裝依賴

```bash
npm install
```

---

## 🔧 開發模式

本專案使用 **Cloudflare Pages Functions** 作為後端 API，有兩種開發方式：

### 方式 1：只開發前端（推薦用於 UI 開發）

如果你只需要開發前端 UI，不需要測試 API 功能：

```bash
npm run dev
```

**注意**：
- 前端會在 `http://localhost:5173` 運行
- API 請求會失敗（404），但不影響前端開發
- 錯誤會被靜默處理，不會影響頁面顯示

### 方式 2：前後端同時開發（完整功能）

如果需要測試 API 功能，需要同時運行前端和後端：

#### 步驟 1: 建置專案

```bash
npm run build
```

#### 步驟 2: 啟動 Wrangler Dev Server（Terminal 1）

```bash
npx wrangler pages dev dist --port 8788
```

這會啟動 Cloudflare Pages Functions 模擬環境，處理 API 請求。

#### 步驟 3: 啟動 Vite Dev Server（Terminal 2）

```bash
npm run dev
```

#### 步驟 4: 訪問應用

打開瀏覽器訪問：`http://localhost:5173`

**工作原理**：
- Vite dev server (port 5173) 處理前端
- Wrangler dev server (port 8788) 處理 API
- Vite 的 proxy 會將 `/api/*` 請求轉發到 port 8788

---

## 🔑 環境變數

### 開發環境

創建 `.dev.vars` 檔案（Wrangler 會自動讀取）：

```bash
DATABASE_URL=postgresql://your-database-url
JWT_SECRET=your-jwt-secret
```

### 前端環境變數（可選）

創建 `.env.local` 檔案：

```bash
# 如果需要指定 API URL（通常不需要）
VITE_API_BASE_URL=/api/v1
```

---

## 🧪 測試

### 型別檢查

```bash
npm run type-check
```

### 單元測試

```bash
npm run test
```

### 測試 API 端點

```bash
# 測試本地
npm run test:api

# 測試 Preview 環境
npm run test:api https://your-preview-url.pages.dev
```

---

## 📝 程式碼規範

### Linting

```bash
# 檢查
npm run lint:check

# 自動修復
npm run lint
```

### 格式化

```bash
# 檢查
npm run format:check

# 自動格式化
npm run format
```

---

## 🚢 部署

### 部署到 Preview 環境

```bash
npm run deploy:pages:preview
```

### 部署到 Production 環境

```bash
npm run deploy:pages:production
```

---

## 🐛 常見問題

### Q: 前端顯示 API 404 錯誤

**A**: 這是正常的，如果你只運行了 `npm run dev` 而沒有啟動 Wrangler dev server。

**解決方案**：
1. 如果只開發前端 UI，可以忽略這些錯誤
2. 如果需要測試 API，按照「方式 2」啟動完整開發環境

### Q: Wrangler dev server 啟動失敗

**A**: 確保：
1. 已經執行 `npm run build`
2. `.dev.vars` 檔案已正確配置
3. Port 8788 沒有被其他程式佔用

### Q: 型別檢查失敗

**A**: 執行：
```bash
npm run type-check
```
查看具體錯誤並修復。

### Q: 如何清除快取？

**A**: 
```bash
# 清除 node_modules
rm -rf node_modules package-lock.json
npm install

# 清除 Vite 快取
rm -rf node_modules/.vite
```

---

## 📚 相關文檔

- [路由系統指南](.kiro/steering/routing-guide.md)
- [命名規範](.kiro/steering/naming-conventions.md)
- [技術棧規範](.kiro/steering/tech-stack.md)
- [常見錯誤](.kiro/steering/common-mistakes.md)
- [測試清單](TESTING_CHECKLIST.md)

---

## 🔗 有用的連結

- [Cloudflare Pages 文檔](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
- [Vue 3 文檔](https://vuejs.org/)
- [Vite 文檔](https://vitejs.dev/)

---

## 💡 開發技巧

### 快速重新載入

修改前端程式碼時，Vite 會自動熱重載（HMR）。

### 查看 API 日誌

Wrangler dev server 會在 Terminal 中顯示所有 API 請求的日誌。

### 使用 Vue DevTools

安裝 [Vue DevTools](https://devtools.vuejs.org/) 瀏覽器擴充功能來調試 Vue 應用。

---

**最後更新**: 2025-11-18
