# 環境變數使用指南

## 📌 問題：環境變數設置方式

在 Cloudflare Workers 中，環境變數的處理方式與傳統 Node.js 不同。

---

## ❌ 錯誤方式：設置 process.env

### 問題程式碼（已移除）

在舊的 `[[path]].ts` 中：

```typescript
// ❌ 錯誤：在 Cloudflare Workers 中設置 process.env
export const onRequest = async (context: PagesContext) => {
  // 設置環境變量
  if (context.env.DATABASE_URL) {
    process.env.DATABASE_URL = context.env.DATABASE_URL  // ⚠️ 不可靠
  }
  if (context.env.JWT_SECRET) {
    process.env.JWT_SECRET = context.env.JWT_SECRET      // ⚠️ 不可靠
  }
  
  // 然後其他程式碼嘗試讀取 process.env...
}
```

### 為什麼不能這樣做？

1. **Edge Runtime 限制**：Cloudflare Workers 不是完整的 Node.js 環境
2. **隔離性問題**：不同請求可能共享同一個 Worker 實例
3. **競態條件**：多個請求同時設置 `process.env` 會互相干擾
4. **不可靠**：設置的值可能不會生效或被覆蓋

### 潛在問題

```typescript
// 請求 A 設置
process.env.DATABASE_URL = "database_A"

// 請求 B 同時設置（覆蓋了 A）
process.env.DATABASE_URL = "database_B"

// 請求 A 讀取時，可能得到 database_B！
const url = process.env.DATABASE_URL  // ⚠️ 可能是錯的
```

---

## ✅ 正確方式：直接使用 context.env

### 標準模式

在 Cloudflare Pages Functions 中：

```typescript
interface Context {
  request: Request
  env: { 
    DATABASE_URL?: string
    JWT_SECRET?: string 
  }
  params?: Record<string, string>
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context
  
  // ✅ 正確：直接從 context.env 讀取
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const jwtSecret = env.JWT_SECRET
  
  // 使用環境變數
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  // ...
}
```

### 為什麼這樣是對的？

1. **請求隔離**：每個請求的 `context.env` 是獨立的
2. **類型安全**：TypeScript 可以檢查環境變數
3. **可靠**：Cloudflare 保證 `context.env` 的正確性
4. **效能好**：不需要額外的設置步驟

---

## 📊 對比表格

| 特性 | process.env | context.env |
|------|-------------|-------------|
| **設置方式** | `process.env.X = value` | Cloudflare 自動注入 |
| **讀取方式** | `process.env.X` | `context.env.X` |
| **隔離性** | ❌ 不隔離 | ✅ 每個請求獨立 |
| **可靠性** | ❌ 不可靠 | ✅ 可靠 |
| **Cloudflare Workers** | ⚠️ 不推薦 | ✅ 推薦 |
| **類型安全** | ❌ 需要手動定義 | ✅ 自動推導 |

---

## 🔍 你的專案狀況

### ✅ 已修復！

經過檢查，你的專案現在**完全使用正確的方式**：

```bash
# 檢查結果
✓ 無設置 process.env 的程式碼
✓ 所有 functions 都使用 context.env
✓ [[path]].ts 已刪除（舊的錯誤方式）
✓ 77 個路由檔案都使用正確方式
```

### 標準模式（你的專案）

所有路由檔案都遵循這個模式：

```typescript
// 1. 定義 Context 介面
interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params?: { id: string }  // 如果有動態參數
}

// 2. 從 context 中解構
async function handleGet(context: Context): Promise<Response> {
  const { request, env, params } = context
  
  // 3. 直接使用 env
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  // 4. 如果需要 JWT secret
  if (env.JWT_SECRET) {
    const jwt = await import('jsonwebtoken')
    const token = jwt.sign(payload, env.JWT_SECRET)
  }
  
  // ...
}

// 5. 導出處理函數
export const onRequestGet = withErrorHandler(handleGet, 'Handler Name')
```

---

## 📝 最佳實踐

### 1. 永遠從 context.env 讀取

```typescript
// ✅ 正確
const databaseUrl = env.DATABASE_URL

// ❌ 錯誤
const databaseUrl = process.env.DATABASE_URL
```

### 2. 驗證環境變數

```typescript
// ✅ 使用 helper 函數驗證
const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)

// 這會在環境變數缺失時拋出清晰的錯誤
```

### 3. 定義 Context 介面

```typescript
// ✅ 明確定義需要的環境變數
interface Context {
  request: Request
  env: { 
    DATABASE_URL?: string
    JWT_SECRET?: string
    ENVIRONMENT?: string
  }
}
```

### 4. 不要設置 process.env

```typescript
// ❌ 永遠不要這樣做
process.env.DATABASE_URL = context.env.DATABASE_URL

// ✅ 直接使用
const url = context.env.DATABASE_URL
```

---

## 🎯 環境變數配置

### wrangler.pages.toml

```toml
name = "pharmacy-assistant-academy"
pages_build_output_dir = "dist"

[vars]
ENVIRONMENT = "preview"
DATABASE_URL = "postgresql://..."
JWT_SECRET = "your-secret"
```

### Cloudflare Dashboard

在 Cloudflare Pages 設置中：
1. 進入 Settings > Environment variables
2. 添加 Production 和 Preview 環境的變數
3. 敏感資訊（如 JWT_SECRET）使用加密變數

---

## 🔧 常見問題

### Q: 為什麼不能用 process.env？

**A**: Cloudflare Workers 是 Edge Runtime，不是完整的 Node.js。`process.env` 在多個請求間可能共享，導致資料混亂。

### Q: 如何在本地開發時使用環境變數？

**A**: 使用 `.dev.vars` 檔案（Wrangler 會自動讀取）：

```bash
# .dev.vars
DATABASE_URL=postgresql://localhost/mydb
JWT_SECRET=dev-secret
```

### Q: 可以讀取 process.env 嗎？

**A**: 可以**讀取**，但不要**設置**。某些情況下讀取是安全的：

```typescript
// ✅ 讀取是可以的（如果已經設置）
if (process.env.NODE_ENV === 'development') {
  console.log('Debug mode')
}

// ❌ 設置是不安全的
process.env.MY_VAR = 'value'
```

### Q: 如何傳遞環境變數給其他函數？

**A**: 直接傳遞 `env` 物件：

```typescript
async function helperFunction(env: Context['env']) {
  const url = validateDatabaseUrl(env.DATABASE_URL)
  // ...
}

export async function onRequestGet(context: Context) {
  await helperFunction(context.env)
}
```

---

## 📚 相關資源

### 文檔
- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)

### 專案文件
- `.kiro/steering/routing-guide.md` - 路由系統指南
- `functions/utils/error-handler.ts` - 包含 `validateDatabaseUrl`

---

## ✅ 總結

### 問題
舊的 `[[path]].ts` 設置 `process.env`，在 Cloudflare Workers 中不可靠

### 解決方案
✅ 已刪除 `[[path]].ts`  
✅ 所有路由都直接使用 `context.env`  
✅ 無任何設置 `process.env` 的程式碼  

### 結果
- ✅ 環境變數隔離正確
- ✅ 無競態條件
- ✅ 類型安全
- ✅ 完全兼容 Cloudflare Workers

### 現在的狀態
🎉 **所有環境變數都使用正確的方式！**

---

**最後更新**: 2025-11-18
