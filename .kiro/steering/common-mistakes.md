---
inclusion: always
---

# 常見錯誤記錄

這個文件記錄了開發過程中常犯的錯誤，以避免重複發生。

## 1. JWT Token 不應包含中文或特殊字符

**錯誤**：在 JWT token 中包含中文姓名等資訊

```typescript
// ❌ 錯誤
const token = jwt.sign(
  {
    userId: user.id,
    firstName: '啟峰', // 中文會導致前端 atob() 解析失敗
    lastName: '高'
  },
  secret
)
```

**正確做法**：

- Token 只包含基本資訊（userId, email, userType）
- 需要詳細資訊時，通過 API 從資料庫獲取

```typescript
// ✅ 正確
const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    userType: user.userType
  },
  secret
)
```

**原因**：

- 前端使用 `atob()` 解析 token，不支援 UTF-8 編碼
- 中文字符會導致 `InvalidCharacterError`

**相關修復**：

- ✅ 已修復 `src/api/auth-middleware.ts` 中錯誤假設 token 包含 firstName/lastName 的問題
- ✅ Middleware 現在正確地只從 token 讀取 userId, email, userType
- ✅ 詳細用戶資訊應從 `/api/v1/auth/profile` 端點獲取

---

## 2. Router Middleware 順序錯誤

**錯誤**：middleware 放在 handler 之後

```typescript
// ❌ 錯誤
router.get('/api/v1/auth/profile', profileHandler, [requireAuth])
```

**正確做法**：middleware 必須在 handler 之前

```typescript
// ✅ 正確
router.get('/api/v1/auth/profile', [requireAuth], profileHandler)
// 或
router.get('/api/v1/auth/profile', requireAuth, profileHandler)
```

**原因**：

- Router 的簽名是 `(path, middleware, handler)` 或 `(path, middlewares[], handler)`
- 順序錯誤會導致 middleware 不執行，`req.user` 未設置

---

## 3. 路由匹配順序問題

**錯誤**：具體路由在參數路由之後

```typescript
// ❌ 錯誤
router.get('/api/v1/instructors/:userId', handler1)
router.get('/api/v1/instructors/profile', handler2) // 永遠不會被匹配
```

**正確做法**：具體路由必須在參數路由之前

```typescript
// ✅ 正確
router.get('/api/v1/instructors/profile', handler2) // 先註冊具體路由
router.get('/api/v1/instructors/:userId', handler1)
```

**原因**：

- Router 按順序匹配路由
- `/instructors/profile` 會被 `/instructors/:userId` 匹配，`profile` 被當作 userId

---

## 4. Cloudflare Workers 環境差異

**錯誤**：在 Cloudflare Workers 中使用 PostgreSQL connection pool

```typescript
// ❌ 錯誤（在 Cloudflare Workers 中）
const pool = getDatabasePool()
const client = await pool.connect()
```

**正確做法**：使用 Neon serverless driver

```typescript
// ✅ 正確
const { neon } = await import('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)
const result = await sql`SELECT * FROM users WHERE id = ${userId}`
```

**原因**：

- Cloudflare Workers 是 serverless 環境，不支援長連接
- 必須使用 HTTP-based 的資料庫連接

---

## 5. 不要在 Token 中包含敏感或大量資訊

**原則**：

- Token 應該輕量，只包含必要的識別資訊
- 敏感資訊應該從資料庫獲取，不要放在 token 中
- Token 會在每次請求中傳輸，過大會影響性能

**建議的 Token 內容**：

```typescript
{
  userId: number,
  email: string,
  userType: string,
  iat: number,
  exp: number
}
```

---

## 5. 雙重路由系統衝突（已解決）

**錯誤**：同時使用兩套路由系統

```typescript
// ❌ 錯誤：Catch-all 路由 + 獨立路由檔案
functions/api/v1/[[path]].ts  // 轉發到 src/api/
functions/api/v1/auth/login.ts  // 獨立處理
```

**正確做法**：只使用 Cloudflare Pages Functions 檔案路由

```typescript
// ✅ 正確：只使用檔案路由
functions/api/v1/auth/login.ts
functions/api/v1/auth/profile.ts
functions/api/v1/instructors/profile.ts
```

**原因**：

- 雙重路由系統會造成衝突和維護困難
- Cloudflare Pages Functions 的檔案路由更高效
- 減少抽象層，提升性能

**解決方案**（2025-11-18）：

- ✅ 已刪除 `functions/api/v1/[[path]].ts`
- ✅ 完全使用 Cloudflare Pages Functions 檔案路由
- ✅ 所有路由使用 Neon serverless driver
- ✅ 統一使用 `withErrorHandler` 錯誤處理

---

## 檢查清單

在修改認證相關代碼時，請檢查：

- [ ] Token 中是否只包含基本資訊（無中文、無敏感資訊）
- [ ] 是否使用 Neon serverless driver（不要用 connection pool）
- [ ] 是否使用 `withErrorHandler` 包裝 handler
- [ ] 路由檔案是否放在正確的 `functions/api/v1/` 目錄
- [ ] 修改後是否測試了登入、個人資料、講師資料等功能

---

## 測試流程

每次修改認證相關代碼後，應該測試：

1. **登入測試**

   ```bash
   curl -X POST https://[deployment].pages.dev/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

2. **個人資料測試**

   ```bash
   curl -X GET https://[deployment].pages.dev/api/v1/auth/profile \
     -H "Authorization: Bearer [token]"
   ```

3. **講師資料測試**

   ```bash
   curl -X GET https://[deployment].pages.dev/api/v1/instructors/profile \
     -H "Authorization: Bearer [token]"
   ```

4. **前端測試**
   - 清除 localStorage
   - 重新登入
   - 檢查個人資料頁面
   - 檢查講師管理頁面

---

最後更新：2025-10-30
