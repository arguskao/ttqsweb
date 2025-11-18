---
inclusion: always
---

# 命名規範

## 📌 統一使用 camelCase

本專案統一使用 **camelCase** 命名規範（TypeScript/JavaScript 慣例）。

---

## 🎯 命名規則

### TypeScript/JavaScript 程式碼

```typescript
// ✅ 正確：使用 camelCase
interface User {
  id: number
  email: string
  userType: string
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: string
}

// ❌ 錯誤：不要使用 snake_case
interface User {
  user_type: string      // ❌
  first_name: string     // ❌
  is_active: boolean     // ❌
}
```

### 變數和函數

```typescript
// ✅ 正確
const userId = 123
const firstName = 'John'
function getUserProfile() { }
async function fetchUserData() { }

// ❌ 錯誤
const user_id = 123           // ❌
const first_name = 'John'     // ❌
function get_user_profile() { } // ❌
```

### 常數

```typescript
// ✅ 正確：使用 UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'
const DEFAULT_PAGE_SIZE = 20

// ❌ 錯誤
const maxRetryCount = 3       // ❌ 應該用大寫
const ApiBaseUrl = 'https://...' // ❌
```

### 類別和介面

```typescript
// ✅ 正確：使用 PascalCase
class UserService { }
interface ApiResponse { }
type UserType = 'admin' | 'user'

// ❌ 錯誤
class userService { }         // ❌
interface apiResponse { }     // ❌
```

---

## 🗄️ 資料庫欄位

### 資料庫使用 snake_case

PostgreSQL 資料庫欄位使用 `snake_case`（資料庫慣例）：

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  user_type VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 查詢時轉換為 camelCase

使用轉換工具將資料庫結果轉換為 camelCase：

```typescript
import { rowToUser } from '../utils/db-helpers'

// 查詢資料庫（snake_case）
const result = await sql`
  SELECT id, email, user_type, first_name, last_name, 
         is_active, created_at, updated_at
  FROM users
  WHERE id = ${userId}
`

// 轉換為 camelCase
const user = rowToUser(result[0])

// 使用 camelCase 屬性
console.log(user.firstName)  // ✅
console.log(user.userType)   // ✅
console.log(user.isActive)   // ✅
```

---

## 🔄 轉換工具

### 使用 db-helpers

```typescript
import { 
  rowToUser, 
  rowToInstructor, 
  rowToCourse,
  rowToJob,
  rowsToUsers  // 批量轉換
} from '../utils/db-helpers'

// 單個轉換
const user = rowToUser(dbRow)

// 批量轉換
const users = rowsToUsers(dbRows)
```

### 可用的轉換函數

| 函數 | 用途 |
|------|------|
| `rowToUser(row)` | 轉換用戶 |
| `rowToInstructor(row)` | 轉換講師 |
| `rowToCourse(row)` | 轉換課程 |
| `rowToJob(row)` | 轉換工作 |
| `rowsToUsers(rows)` | 批量轉換用戶 |
| `rowsToInstructors(rows)` | 批量轉換講師 |
| `rowsToCourses(rows)` | 批量轉換課程 |
| `rowsToJobs(rows)` | 批量轉換工作 |

---

## 📝 API 回應格式

### 統一使用 camelCase

```typescript
// ✅ 正確
return createSuccessResponse({
  id: 1,
  email: 'user@example.com',
  userType: 'admin',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  createdAt: '2025-11-18T...'
})

// ❌ 錯誤：不要混用
return createSuccessResponse({
  id: 1,
  email: 'user@example.com',
  user_type: 'admin',      // ❌ snake_case
  firstName: 'John',       // ✅ camelCase
  last_name: 'Doe',        // ❌ snake_case
})
```

---

## 🚫 避免的模式

### 1. 不要重複定義屬性

```typescript
// ❌ 錯誤：同時定義兩種命名
const user = {
  userType: 'admin',
  user_type: 'admin',  // ❌ 重複
  firstName: 'John',
  first_name: 'John'   // ❌ 重複
}

// ✅ 正確：只使用 camelCase
const user = {
  userType: 'admin',
  firstName: 'John'
}
```

### 2. 不要在 TypeScript 中使用 snake_case

```typescript
// ❌ 錯誤
interface User {
  user_type: string
  first_name: string
}

// ✅ 正確
interface User {
  userType: string
  firstName: string
}
```

### 3. 不要在變數名中使用 snake_case

```typescript
// ❌ 錯誤
const user_id = 123
const first_name = 'John'

// ✅ 正確
const userId = 123
const firstName = 'John'
```

---

## 📊 命名規範總覽

| 類型 | 規範 | 範例 |
|------|------|------|
| **變數** | camelCase | `userId`, `firstName` |
| **函數** | camelCase | `getUserProfile()` |
| **常數** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| **類別** | PascalCase | `UserService` |
| **介面** | PascalCase | `ApiResponse` |
| **型別** | PascalCase | `UserType` |
| **資料庫欄位** | snake_case | `user_type`, `first_name` |
| **API 回應** | camelCase | `{ userId: 1 }` |

---

## 🔧 實施指南

### 新程式碼

所有新程式碼必須遵循 camelCase 規範：

```typescript
// ✅ 正確的新程式碼
async function handleGet(context: Context): Promise<Response> {
  const { env } = context
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  const result = await sql`
    SELECT id, user_type, first_name FROM users
  `
  
  // 使用轉換工具
  const users = rowsToUsers(result)
  
  return createSuccessResponse(users)
}
```

### 舊程式碼

逐步重構舊程式碼：

1. 在修改相關程式碼時順便統一命名
2. 使用轉換工具處理資料庫查詢
3. 移除重複的 snake_case 屬性

---

## ✅ 檢查清單

在提交程式碼前檢查：

- [ ] 所有變數使用 camelCase
- [ ] 所有函數使用 camelCase
- [ ] 所有介面使用 PascalCase
- [ ] 常數使用 UPPER_SNAKE_CASE
- [ ] 資料庫查詢結果已轉換為 camelCase
- [ ] API 回應使用 camelCase
- [ ] 無重複的 snake_case 屬性
- [ ] 型別定義一致

---

## 📚 參考資料

### 官方指南
- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### 專案文件
- `functions/utils/db-helpers.ts` - 轉換工具
- `.kiro/steering/routing-guide.md` - 路由指南
- `TYPE_STANDARDIZATION_PLAN.md` - 標準化計劃

---

## 💡 提示

### 為什麼使用 camelCase？

1. **TypeScript/JavaScript 慣例** - 符合生態系統標準
2. **更好的開發體驗** - IDE 自動完成更準確
3. **一致性** - 前後端使用相同命名
4. **可讀性** - 更符合自然語言習慣

### 為什麼資料庫用 snake_case？

1. **PostgreSQL 慣例** - 資料庫標準做法
2. **SQL 關鍵字** - 避免與 SQL 關鍵字衝突
3. **跨語言** - 不同語言都能理解

### 如何處理轉換？

使用 `db-helpers.ts` 中的轉換工具，自動處理命名轉換。

---

**最後更新**: 2025-11-18
