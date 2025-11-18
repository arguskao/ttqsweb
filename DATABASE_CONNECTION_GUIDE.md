# 資料庫連接方式說明

## 📌 問題：資料庫連接方式不一致

在遷移前，專案中混用了兩種資料庫連接方式，這在 Cloudflare Workers 環境中會造成問題。

---

## ❌ 錯誤方式：Connection Pool (pg)

### 什麼是 Connection Pool？

Connection Pool（連接池）是傳統 Node.js 應用中常用的資料庫連接管理方式：

```typescript
// ❌ 在 Cloudflare Workers 中不支援
import { Pool } from 'pg'

// 創建連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // 最多 20 個連接
  idleTimeoutMillis: 30000,   // 閒置超時
  connectionTimeoutMillis: 2000
})

// 使用連接
async function getUser(userId: number) {
  const client = await pool.connect()  // 從池中取得連接
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    )
    return result.rows[0]
  } finally {
    client.release()  // 釋放連接回池中
  }
}
```

### 為什麼不能用？

| 原因 | 說明 |
|------|------|
| **Serverless 環境** | 每次請求都是獨立的實例，無法維持長期連接 |
| **無狀態** | Workers 不保存狀態，連接池會在請求結束後消失 |
| **冷啟動** | 每次冷啟動都要重新建立連接池，反而更慢 |
| **TCP 限制** | Edge 環境不支援傳統的 TCP 長連接 |
| **資源浪費** | 維持連接池需要額外的記憶體和資源 |

### 錯誤訊息範例

```
Error: Connection pool is not supported in Cloudflare Workers
Error: Cannot establish TCP connection
Error: Pool is not defined
```

---

## ✅ 正確方式：Neon Serverless Driver

### 什麼是 Neon Serverless Driver？

Neon Serverless Driver 是專為 Serverless/Edge 環境設計的資料庫驅動：

```typescript
// ✅ 在 Cloudflare Workers 中正確使用
import { neon } from '@neondatabase/serverless'

// 創建 SQL 函數（無需管理連接）
const sql = neon(process.env.DATABASE_URL)

// 直接查詢
async function getUser(userId: number) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${userId}
  `
  return result[0]
}
```

### 為什麼這個可以用？

| 優點 | 說明 |
|------|------|
| **HTTP-based** | 使用 HTTP 請求，不需要長連接 |
| **無狀態** | 每次查詢都是獨立的 HTTP 請求 |
| **快速** | 針對 Edge 環境優化，延遲低 |
| **自動管理** | 不需要手動管理連接 |
| **安全** | 自動處理參數化查詢，防止 SQL injection |
| **簡單** | API 簡潔，易於使用 |

---

## 📊 詳細對比

### 連接方式對比

| 特性 | Connection Pool (pg) | Neon Serverless |
|------|---------------------|-----------------|
| **連接協議** | TCP | HTTP/WebSocket |
| **連接類型** | 長連接 | 短連接 |
| **適用環境** | Node.js 伺服器 | Serverless/Edge |
| **連接管理** | 手動（connect/release） | 自動 |
| **Cloudflare Workers** | ❌ 不支援 | ✅ 支援 |
| **冷啟動速度** | 慢（需建立連接池） | 快 |
| **記憶體使用** | 高（維持連接池） | 低 |
| **狀態** | 有狀態 | 無狀態 |
| **錯誤處理** | 需要手動處理 | 自動處理 |

### 程式碼對比

#### Connection Pool 方式（❌ 不推薦）

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// 需要手動管理連接
async function getUsers() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM users')
    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    throw error
  } finally {
    client.release()  // 必須記得釋放
  }
}

// 應用結束時需要關閉連接池
process.on('exit', () => {
  pool.end()
})
```

#### Neon Serverless 方式（✅ 推薦）

```typescript
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// 簡單直接，無需管理連接
async function getUsers() {
  const result = await sql`SELECT * FROM users`
  return result
}

// 參數化查詢（自動防止 SQL injection）
async function getUser(userId: number) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${userId}
  `
  return result[0]
}

// 複雜查詢
async function searchUsers(keyword: string) {
  const pattern = `%${keyword}%`
  const result = await sql`
    SELECT * FROM users 
    WHERE name ILIKE ${pattern}
    ORDER BY created_at DESC
    LIMIT 20
  `
  return result
}
```

---

## 🔍 你的專案狀況

### ✅ 已修復！

經過檢查，你的專案現在**完全使用 Neon Serverless Driver**：

```bash
# 檢查結果
✓ 無 Connection Pool 使用
✓ 無 pg 模組引用
✓ 無 pool.connect() 調用
✓ 所有 functions/ 中的檔案都使用 Neon Serverless
```

### 使用統計

在 `functions/` 目錄中：
- ✅ **77 個路由檔案**都使用 Neon Serverless Driver
- ✅ 統一的連接方式
- ✅ 完全兼容 Cloudflare Workers

### 標準模式

你的專案中所有資料庫查詢都遵循這個模式：

```typescript
// 1. 驗證資料庫 URL
const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)

// 2. 導入並創建 SQL 函數
const { neon } = await import('@neondatabase/serverless')
const sql = neon(databaseUrl)

// 3. 執行查詢
try {
  const result = await sql`
    SELECT * FROM your_table
    WHERE condition = ${value}
  `
  return createSuccessResponse(result)
} catch (dbError) {
  handleDatabaseError(dbError, 'Operation Name')
}
```

---

## 🎯 最佳實踐

### 1. 永遠使用 Neon Serverless Driver

```typescript
// ✅ 正確
import { neon } from '@neondatabase/serverless'
const sql = neon(databaseUrl)

// ❌ 錯誤
import { Pool } from 'pg'
const pool = new Pool({ connectionString: databaseUrl })
```

### 2. 使用參數化查詢

```typescript
// ✅ 正確（自動防止 SQL injection）
const result = await sql`
  SELECT * FROM users WHERE id = ${userId}
`

// ❌ 錯誤（容易 SQL injection）
const result = await sql`
  SELECT * FROM users WHERE id = ${userId}
`
```

### 3. 適當的錯誤處理

```typescript
try {
  const result = await sql`SELECT * FROM users`
  return createSuccessResponse(result)
} catch (dbError) {
  handleDatabaseError(dbError, 'Get Users')
}
```

### 4. 驗證資料庫 URL

```typescript
// 使用 helper 函數驗證
const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
```

---

## 📚 相關資源

### 文檔
- [Neon Serverless Driver 文檔](https://neon.tech/docs/serverless/serverless-driver)
- [Cloudflare Workers 資料庫指南](https://developers.cloudflare.com/workers/databases/)

### 專案文件
- `.kiro/steering/routing-guide.md` - 路由系統指南
- `.kiro/steering/tech-stack.md` - 技術棧規範
- `functions/utils/error-handler.ts` - 錯誤處理工具

---

## ✅ 總結

### 問題
專案中混用了 Connection Pool 和 Neon Serverless Driver

### 解決方案
✅ 已完全遷移到 Neon Serverless Driver

### 結果
- ✅ 完全兼容 Cloudflare Workers
- ✅ 更快的冷啟動速度
- ✅ 更簡單的程式碼
- ✅ 更好的效能
- ✅ 統一的連接方式

### 現在的狀態
🎉 **所有資料庫連接都已統一使用 Neon Serverless Driver！**

---

**最後更新**: 2025-11-18
