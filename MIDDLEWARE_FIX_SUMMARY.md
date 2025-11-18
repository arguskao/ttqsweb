# Middleware 修復摘要

## 修復日期
2025-11-18

## 問題描述

`src/api/auth-middleware.ts` 中存在以下問題：

1. **錯誤假設 token 包含姓名欄位**
   - Middleware 嘗試從 JWT payload 讀取 `firstName` 和 `lastName`
   - 但實際 token 只包含 `userId`, `email`, `userType`
   - 導致這些欄位永遠是空字串

2. **optionalAuthMiddleware 使用 connection pool**
   - 調用 `getUserById()` 從資料庫查詢用戶資訊
   - 使用了 PostgreSQL connection pool
   - 在 Cloudflare Workers 環境中不支援

## 修復內容

### 1. authMiddleware
```typescript
// ✅ 修復後：只從 token 讀取實際存在的欄位
req.user = {
  id: userId,
  email: payload.email || '',
  userType: payload.userType || 'job_seeker',
  firstName: '',  // Token 中不包含姓名，避免中文編碼問題
  lastName: '',
  phone: undefined,
  isActive: true,
  // 兼容舊的屬性名稱
  user_type: payload.userType || 'job_seeker',
  first_name: '',
  last_name: '',
  is_active: true
}
```

### 2. optionalAuthMiddleware
```typescript
// ✅ 修復後：移除資料庫查詢，只使用 token 資訊
if (userId) {
  req.user = {
    id: userId,
    email: payload.email || '',
    userType: payload.userType || 'job_seeker',
    firstName: '',  // Token 中不包含姓名
    lastName: '',
    phone: undefined,
    isActive: true,
    // 兼容舊的屬性名稱
    user_type: payload.userType || 'job_seeker',
    first_name: '',
    last_name: '',
    is_active: true
  }
}
```

### 3. requireRole middleware
```typescript
// ✅ 修復後：同樣的邏輯，只使用 token 資訊
req.user = {
  id: userId,
  email: payload.email || '',
  userType: payload.userType || 'job_seeker',
  firstName: '',
  lastName: '',
  phone: undefined,
  isActive: true,
  user_type: payload.userType || 'job_seeker',
  first_name: '',
  last_name: '',
  is_active: true
}
```

### 4. 移除不必要的 import
```typescript
// ❌ 移除
import { getUserById } from '../services/auth'
```

## 影響範圍

### 正面影響
- ✅ 完全兼容 Cloudflare Workers edge runtime
- ✅ 避免不必要的資料庫查詢，提升性能
- ✅ 防止未來誤加入中文欄位導致前端 `atob()` 崩潰
- ✅ 符合 JWT 最佳實踐（最小權限原則）

### 需要注意
- ⚠️ `req.user` 中的 `firstName`, `lastName`, `phone` 欄位將為空
- ⚠️ 需要這些資訊時，應該調用 `/api/v1/auth/profile` API
- ⚠️ 或在特定 handler 中從資料庫查詢（使用 Neon serverless driver）

## 測試建議

1. **登入測試**
   ```bash
   curl -X POST https://your-domain/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

2. **認證測試**
   ```bash
   curl -X GET https://your-domain/api/v1/auth/profile \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **講師資料測試**
   ```bash
   curl -X GET https://your-domain/api/v1/instructors/profile \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 相關文件

- `.kiro/steering/common-mistakes.md` - 已更新常見錯誤記錄
- `.kiro/steering/tech-stack.md` - Cloudflare Workers 技術棧規範

## 後續建議

1. 考慮統一使用 camelCase 命名，移除 snake_case 兼容層
2. 評估是否需要在其他 handler 中查詢完整用戶資訊
3. 考慮使用 TypeScript 嚴格模式，避免類似問題
