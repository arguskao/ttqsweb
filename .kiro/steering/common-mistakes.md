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

## 檢查清單

在修改認證相關代碼時，請檢查：

- [ ] Token 中是否只包含基本資訊（無中文、無敏感資訊）
- [ ] Router middleware 順序是否正確（middleware 在 handler 之前）
- [ ] 具體路由是否在參數路由之前註冊
- [ ] 是否使用了適合 Cloudflare Workers 的資料庫連接方式
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
