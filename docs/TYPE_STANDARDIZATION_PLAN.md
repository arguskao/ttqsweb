# 型別定義標準化計劃

## 📌 問題：camelCase 和 snake_case 混用

目前專案中同時使用兩種命名規範，造成混淆和維護困難。

---

## 🔍 問題範例

### 用戶型別重複

```typescript
// ❌ 問題：同一個物件有兩套屬性
req.user = {
  id: userId,
  email: payload.email,
  userType: payload.userType,      // camelCase
  firstName: payload.firstName,    // camelCase
  lastName: payload.lastName,      // camelCase
  
  // 同時還有 snake_case（為了兼容）
  user_type: payload.userType,     // snake_case
  first_name: payload.firstName,   // snake_case
  last_name: payload.lastName,     // snake_case
}
```

### 資料庫欄位 vs TypeScript 屬性

```typescript
// 資料庫使用 snake_case
SELECT user_type, first_name, last_name FROM users

// TypeScript 使用 camelCase
interface User {
  userType: string
  firstName: string
  lastName: string
}

// 需要手動轉換
const user = {
  userType: row.user_type,
  firstName: row.first_name,
  lastName: row.last_name
}
```

---

## 🎯 標準化方案

### 選項 A：完全使用 camelCase（推薦）✅

**優點**：
- 符合 TypeScript/JavaScript 慣例
- 前端程式碼更一致
- 更好的開發體驗

**缺點**：
- 需要在資料庫查詢時轉換
- 需要更新所有型別定義

### 選項 B：完全使用 snake_case

**優點**：
- 與資料庫欄位一致
- 減少轉換

**缺點**：
- 不符合 TypeScript 慣例
- 前端程式碼看起來不自然

### 選項 C：保持現狀（不推薦）

**優點**：
- 不需要改動

**缺點**：
- 持續混淆
- 維護困難
- 容易出錯

---

## ✅ 推薦方案：統一使用 camelCase

### 1. 統一型別定義

創建標準的型別定義檔案：

```typescript
// src/types/common.ts

/**
 * 用戶型別
 * 統一使用 camelCase
 */
export interface User {
  id: number
  email: string
  userType: 'admin' | 'instructor' | 'employer' | 'job_seeker'
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * JWT Payload
 * Token 中只包含基本資訊
 */
export interface JwtPayload {
  userId: number
  email: string
  userType: string
  iat: number
  exp: number
}

/**
 * 請求中的用戶資訊
 * 從 JWT token 解析而來
 */
export interface RequestUser {
  id: number
  email: string
  userType: string
}
```

### 2. 資料庫查詢轉換

使用 helper 函數統一轉換：

```typescript
// functions/utils/db-helpers.ts

/**
 * 將資料庫 row 轉換為 User 物件
 */
export function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    userType: row.user_type,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * 將 User 物件轉換為資料庫欄位
 */
export function userToRow(user: Partial<User>): Record<string, any> {
  const row: Record<string, any> = {}
  
  if (user.email !== undefined) row.email = user.email
  if (user.userType !== undefined) row.user_type = user.userType
  if (user.firstName !== undefined) row.first_name = user.firstName
  if (user.lastName !== undefined) row.last_name = user.lastName
  if (user.phone !== undefined) row.phone = user.phone
  if (user.isActive !== undefined) row.is_active = user.isActive
  
  return row
}
```

### 3. 使用範例

```typescript
// 查詢用戶
const result = await sql`
  SELECT id, email, user_type, first_name, last_name, phone, 
         is_active, created_at, updated_at
  FROM users
  WHERE id = ${userId}
`

// 轉換為 camelCase
const user = rowToUser(result[0])

// 現在可以使用 camelCase
console.log(user.firstName)  // ✅
console.log(user.userType)   // ✅
```

---

## 📝 實施步驟

### Phase 1: 創建標準型別定義 ✅

1. 創建 `src/types/common.ts`
2. 定義所有標準型別（camelCase）
3. 移除重複的型別定義

### Phase 2: 創建轉換工具 ✅

1. 創建 `functions/utils/db-helpers.ts`
2. 實作 `rowToUser`, `rowToCourse` 等轉換函數
3. 實作反向轉換函數

### Phase 3: 更新現有程式碼 ⏳

1. 更新所有資料庫查詢使用轉換函數
2. 移除 req.user 中的 snake_case 屬性
3. 更新前端型別定義

### Phase 4: 測試和驗證 ⏳

1. 執行型別檢查
2. 測試所有 API 端點
3. 確保前後端一致

---

## 🔧 快速修復方案（最小改動）

如果不想大規模重構，可以先做這些：

### 1. 移除 req.user 中的重複屬性

```typescript
// functions/utils/error-handler.ts 或 auth middleware

// ❌ 移除這些
req.user = {
  id: userId,
  email: payload.email,
  userType: payload.userType,
  // 移除重複的 snake_case 屬性
  // user_type: payload.userType,
  // first_name: '',
  // last_name: '',
}
```

### 2. 統一使用 camelCase

```typescript
// ✅ 只保留 camelCase
req.user = {
  id: userId,
  email: payload.email,
  userType: payload.userType
}
```

### 3. 在需要時才查詢完整資訊

```typescript
// 如果需要姓名等資訊，從資料庫查詢
const result = await sql`
  SELECT first_name, last_name FROM users WHERE id = ${userId}
`

const user = {
  ...req.user,
  firstName: result[0].first_name,
  lastName: result[0].last_name
}
```

---

## 📊 影響範圍

### 需要更新的檔案

1. **型別定義**
   - `src/types/index.ts`
   - `src/types/api.ts`

2. **Middleware**
   - ~~`src/api/auth-middleware.ts`~~ (已移到 backup)

3. **前端服務**
   - `src/services/auth.ts`
   - `src/services/auth-service.ts`

4. **前端元件**
   - 所有使用 `user.user_type` 的地方改為 `user.userType`

---

## ✅ 建議的最小改動方案

### 立即執行

1. **移除 req.user 中的 snake_case 屬性**
   - 這些屬性已經不再使用
   - 減少混淆

2. **統一前端使用 camelCase**
   - 前端已經主要使用 camelCase
   - 只需要清理少數 snake_case 殘留

3. **文檔化命名規範**
   - 在 steering 中明確規定使用 camelCase
   - 新程式碼必須遵循

### 未來優化

1. **創建轉換工具**
   - 統一資料庫查詢的轉換邏輯

2. **逐步重構**
   - 在修改相關程式碼時順便統一命名

3. **自動化檢查**
   - 添加 ESLint 規則檢查命名規範

---

## 🎯 當前狀況

### 已經正確的部分 ✅

- JWT token 只包含 `userId`, `email`, `userType`（camelCase）
- 大部分前端程式碼使用 camelCase
- 新創建的 functions 使用 camelCase

### 需要清理的部分 ⚠️

- ~~`src/api/auth-middleware.ts` 中的重複屬性~~ (已移到 backup)
- 部分前端程式碼可能還有 snake_case 殘留
- 型別定義中的兼容層

---

## 📚 參考資料

### 命名規範
- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### 專案文件
- `.kiro/steering/routing-guide.md`
- `src/types/index.ts`

---

## ✅ 總結

### 問題
camelCase 和 snake_case 混用，造成混淆

### 建議方案
統一使用 camelCase（TypeScript 慣例）

### 最小改動
1. 移除 req.user 中的 snake_case 屬性
2. 文檔化命名規範
3. 逐步重構

### 長期方案
1. 創建轉換工具
2. 統一型別定義
3. 自動化檢查

---

**最後更新**: 2025-11-18
