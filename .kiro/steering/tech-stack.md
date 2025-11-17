# 技術棧規範

本專案使用以下技術棧，所有程式碼建議和範例都應遵循此架構。

## 後端架構

### 部署環境
- **平台**：Cloudflare Workers / Cloudflare Pages Functions
- **Runtime**：Edge runtime（非 Node.js）

### Web 框架
- **框架**：Hono
- **特性**：
  - 輕量、高效能
  - 原生支援 Cloudflare Workers
  - 類 Express 語法

### 資料庫
- **ORM**：Drizzle ORM
- **資料庫**：PostgreSQL (Neon serverless)
- **連接方式**：HTTP-based (@neondatabase/serverless)

### 重要限制
- ❌ 不使用 connection pool（edge 環境不支援）
- ❌ 不使用 Node.js 專屬 API
- ✅ 使用 Neon serverless driver
- ✅ 使用 Drizzle ORM 進行型別安全的查詢

## 程式碼範例

### 正確的資料庫查詢方式

```typescript
// ✅ 使用 Drizzle ORM
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import { users } from './schema'

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

// Type-safe query
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1)
```

### 錯誤的方式

```typescript
// ❌ 不要使用 connection pool
import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ❌ 不要使用 raw SQL（除非必要）
const result = await sql`SELECT * FROM users WHERE id = ${userId}`
```

## Hono 路由規範

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const app = new Hono()

// Middleware 必須在 handler 之前
app.get('/api/profile', 
  jwt({ secret: process.env.JWT_SECRET }), // middleware first
  async (c) => {
    const payload = c.get('jwtPayload')
    // handler logic
  }
)
```

## 前端架構

- **框架**：Vue 3 + TypeScript
- **路由**：Vue Router
- **狀態管理**：Pinia（如需要）
- **API 呼叫**：使用 fetch 或 axios

## 開發原則

1. **型別安全優先**：充分利用 TypeScript 和 Drizzle 的型別推導
2. **Edge-first**：所有程式碼都要能在 edge runtime 執行
3. **效能考量**：避免 N+1 查詢，善用 JOIN
4. **安全性**：使用參數化查詢，避免 SQL injection

## 參考文件

- 常見錯誤：參考 `common-mistakes.md`
- API 遷移：參考 `docs/API_MIGRATION_PLAN.md`
- 安全性：參考 `docs/SQL_INJECTION_PREVENTION.md`
