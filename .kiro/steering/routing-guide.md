---
inclusion: always
---

# 路由系統指南

## 當前架構（2025-11-18 更新）

本專案使用 **Cloudflare Pages Functions 檔案路由系統**。

## 路由規則

### 檔案位置
所有 API 路由檔案放在：
```
functions/api/v1/
```

### 檔案命名規則

#### 1. 靜態路由
```
functions/api/v1/health.ts
→ GET /api/v1/health
```

#### 2. 動態路由（參數）
```
functions/api/v1/jobs/[id].ts
→ GET /api/v1/jobs/123
→ params.id = "123"
```

#### 3. 巢狀路由
```
functions/api/v1/jobs/location/[location].ts
→ GET /api/v1/jobs/location/台北
→ params.location = "台北"
```

#### 4. 多個 HTTP 方法
```typescript
// functions/api/v1/auth/profile.ts
export const onRequestGet = ...   // GET
export const onRequestPut = ...   // PUT
export const onRequestPost = ...  // POST
export const onRequestDelete = ... // DELETE
```

## 標準檔案結構

```typescript
/**
 * 端點描述
 * GET /api/v1/your-endpoint
 */

import {
  withErrorHandler,
  validateToken,
  parseJwtToken,
  validateDatabaseUrl,
  handleDatabaseError,
  createSuccessResponse,
  ApiError,
  ErrorCode
} from '../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
  params?: { id: string } // 如果有動態參數
}

async function handleGet(context: Context): Promise<Response> {
  const { request, env, params } = context

  // 1. 驗證 token（如果需要認證）
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 2. 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  try {
    // 3. 查詢資料庫
    const result = await sql`
      SELECT * FROM your_table
      WHERE id = ${params?.id}
    `

    // 4. 返回成功響應
    return createSuccessResponse(result)
  } catch (dbError) {
    // 5. 處理資料庫錯誤
    handleDatabaseError(dbError, 'Your Operation Name')
  }
}

// 6. 導出處理函數（自動包含錯誤處理和 CORS）
export const onRequestGet = withErrorHandler(handleGet, 'Your Endpoint Name')
```

## 認證處理

### 公開端點（不需要認證）
```typescript
async function handlePublic(context: Context): Promise<Response> {
  // 直接處理，不需要驗證 token
  return createSuccessResponse({ message: 'Public data' })
}

export const onRequestGet = withErrorHandler(handlePublic, 'Public Endpoint')
```

### 需要認證的端點
```typescript
async function handleProtected(context: Context): Promise<Response> {
  const { request } = context
  
  // 驗證 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  
  // 使用 payload.userId, payload.email, payload.userType
  return createSuccessResponse({ userId: payload.userId })
}

export const onRequestGet = withErrorHandler(handleProtected, 'Protected Endpoint')
```

### 需要特定權限的端點
```typescript
async function handleAdmin(context: Context): Promise<Response> {
  const { request } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  
  // 檢查權限
  if (payload.userType !== 'admin') {
    throw new ApiError(ErrorCode.FORBIDDEN, '需要管理員權限')
  }
  
  // 處理管理員操作
  return createSuccessResponse({ message: 'Admin operation' })
}

export const onRequestGet = withErrorHandler(handleAdmin, 'Admin Endpoint')
```

## 資料庫查詢

### ✅ 正確：使用 Neon serverless driver
```typescript
const { neon } = await import('@neondatabase/serverless')
const sql = neon(databaseUrl)

const result = await sql`
  SELECT * FROM users WHERE id = ${userId}
`
```

### ❌ 錯誤：使用 connection pool
```typescript
// ❌ 不要這樣做！在 Cloudflare Workers 中不支援
const pool = new Pool({ connectionString: databaseUrl })
const client = await pool.connect()
```

## 錯誤處理

### 使用 ApiError
```typescript
import { ApiError, ErrorCode } from '../../utils/error-handler'

// 驗證錯誤
if (!email) {
  throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '請提供電子郵件')
}

// 未授權
if (!token) {
  throw new ApiError(ErrorCode.UNAUTHORIZED, '需要登入')
}

// 權限不足
if (userType !== 'admin') {
  throw new ApiError(ErrorCode.FORBIDDEN, '需要管理員權限')
}

// 找不到資源
if (result.length === 0) {
  throw new ApiError(ErrorCode.NOT_FOUND, '找不到資料')
}
```

### 資料庫錯誤處理
```typescript
try {
  const result = await sql`SELECT * FROM users`
  return createSuccessResponse(result)
} catch (dbError) {
  handleDatabaseError(dbError, 'Operation Name')
}
```

## 查詢參數處理

```typescript
async function handleWithQuery(context: Context): Promise<Response> {
  const { request } = context
  const url = new URL(request.url)
  
  // 獲取查詢參數
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const search = url.searchParams.get('q')
  
  // 使用參數
  const offset = (page - 1) * limit
  
  // ...
}
```

## 請求體處理

```typescript
async function handleWithBody(context: Context): Promise<Response> {
  const { request } = context
  
  // 解析 JSON 請求體
  const body = await request.json() as {
    title?: string
    description?: string
  }
  
  // 驗證必填欄位
  if (!body.title) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '請提供標題')
  }
  
  // 使用請求體資料
  // ...
}
```

## 回應格式

### 成功回應
```typescript
return createSuccessResponse(
  { id: 1, name: 'Test' },  // data
  '操作成功'                 // message (optional)
)

// 輸出：
// {
//   "success": true,
//   "data": { "id": 1, "name": "Test" },
//   "message": "操作成功"
// }
```

### 分頁回應
```typescript
return createSuccessResponse({
  items: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
})
```

## 常見模式

### 1. 列表端點（支援分頁和篩選）
```typescript
async function handleList(context: Context): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)
  
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const category = url.searchParams.get('category')
  
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  try {
    const offset = (page - 1) * limit
    
    const result = await sql`
      SELECT * FROM items
      WHERE ${category ? sql`category = ${category}` : sql`true`}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    
    return createSuccessResponse({
      items: result,
      pagination: { page, limit }
    })
  } catch (dbError) {
    handleDatabaseError(dbError, 'List Items')
  }
}
```

### 2. 詳情端點
```typescript
async function handleDetail(context: Context): Promise<Response> {
  const { env, params } = context
  const id = parseInt(params!.id)
  
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  try {
    const result = await sql`
      SELECT * FROM items WHERE id = ${id}
    `
    
    if (result.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '找不到資料')
    }
    
    return createSuccessResponse(result[0])
  } catch (dbError) {
    handleDatabaseError(dbError, 'Get Item Detail')
  }
}
```

### 3. 創建端點
```typescript
async function handleCreate(context: Context): Promise<Response> {
  const { request, env } = context
  
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  
  const body = await request.json() as {
    title: string
    description?: string
  }
  
  if (!body.title) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '請提供標題')
  }
  
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  try {
    const result = await sql`
      INSERT INTO items (title, description, user_id, created_at)
      VALUES (${body.title}, ${body.description}, ${payload.userId}, NOW())
      RETURNING *
    `
    
    return createSuccessResponse(result[0], '創建成功')
  } catch (dbError) {
    handleDatabaseError(dbError, 'Create Item')
  }
}

export const onRequestPost = withErrorHandler(handleCreate, 'Create Item')
```

## 注意事項

1. **永遠使用 `withErrorHandler` 包裝 handler**
2. **永遠使用 Neon serverless driver**
3. **不要在 token 中包含中文或敏感資訊**
4. **使用 `try-catch` 處理資料庫錯誤**
5. **驗證所有用戶輸入**
6. **使用參數化查詢防止 SQL injection**
7. **適當的錯誤訊息（中文）**

## 參考資料

- `functions/utils/error-handler.ts` - 錯誤處理工具
- `TESTING_CHECKLIST.md` - 測試清單
- `.kiro/steering/common-mistakes.md` - 常見錯誤
- `.kiro/steering/tech-stack.md` - 技術棧規範
