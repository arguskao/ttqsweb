# 🚀 錯誤處理工具快速開始指南

> 5 分鐘快速上手統一錯誤處理工具

## 📦 已完成的工作

✅ 後端錯誤處理工具 (`functions/utils/error-handler.ts`)  
✅ 前端錯誤處理工具 (`src/utils/error-handler.ts`)  
✅ 增強版 API 服務 (`src/services/api-enhanced.ts`)  
✅ 已遷移 6 個核心 API  

---

## 🎯 後端 API 開發

### 1. 基本模板

```typescript
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateToken,
  parseJwtToken,
  validateDatabaseUrl,
  handleDatabaseError
} from '../../../utils/error-handler'

interface Env {
  DATABASE_URL: string
}

interface Context {
  request: Request
  env: Env
  params?: Record<string, string>
}

async function handleRequest(context: Context): Promise<Response> {
  const { request, env, params } = context
  
  // 1. 驗證 token（如需要）
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  
  // 2. 驗證資料庫
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  try {
    // 3. 業務邏輯
    const result = await sql`SELECT * FROM table`
    
    // 4. 返回成功
    return createSuccessResponse(result)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Context Name')
  }
}

// 5. 導出（自動錯誤處理 + CORS）
export const onRequestGet = withErrorHandler(handleRequest, 'API Name')
```

### 2. 常用錯誤類型

```typescript
// 認證錯誤
throw new ApiError(ErrorCode.UNAUTHORIZED, '請先登入')

// 權限錯誤
throw new ApiError(ErrorCode.FORBIDDEN, '沒有權限')

// 驗證錯誤
throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '請提供 email')
throw new ApiError(ErrorCode.INVALID_INPUT, 'email 格式不正確')

// 資源錯誤
throw new ApiError(ErrorCode.NOT_FOUND, '課程不存在')
throw new ApiError(ErrorCode.ALREADY_EXISTS, '已經報名過')
```

### 3. 權限檢查

```typescript
import { checkPermission } from '../../../utils/error-handler'

// 檢查用戶類型
checkPermission(userType, ['admin', 'instructor'])
```

---

## 🎨 前端開發

### 1. 使用增強版 API 服務

```typescript
import { apiEnhanced } from '@/services/api-enhanced'

// GET 請求
const response = await apiEnhanced.get('/courses')

// POST 請求
const response = await apiEnhanced.post('/courses', {
  title: '新課程',
  description: '課程描述'
})

// 帶選項的請求
const response = await apiEnhanced.get('/courses', {}, {
  retry: false,        // 不重試
  showError: false     // 不自動顯示錯誤
})
```

### 2. Vue 組件中使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { apiEnhanced } from '@/services/api-enhanced'
import { handleAsyncError, showError } from '@/utils/error-handler'

const loading = ref(false)
const error = ref('')
const data = ref(null)

// 方法 1: 使用 handleAsyncError
const loadData = async () => {
  loading.value = true
  const result = await handleAsyncError(
    apiEnhanced.get('/courses'),
    (err) => {
      error.value = showError(err)
    }
  )
  if (result) {
    data.value = result.data
  }
  loading.value = false
}

// 方法 2: 傳統 try-catch
const saveData = async () => {
  try {
    loading.value = true
    await apiEnhanced.post('/courses', data.value)
    alert('儲存成功')
  } catch (err) {
    error.value = showError(err, '儲存失敗')
  } finally {
    loading.value = false
  }
}
</script>
```

### 3. 錯誤訊息顯示

```typescript
import { showError } from '@/utils/error-handler'

try {
  await apiEnhanced.post('/courses', data)
} catch (error) {
  // 自動顯示中文錯誤訊息
  const message = showError(error)
  console.error(message)
  
  // 或提供備用訊息
  const message = showError(error, '操作失敗，請稍後再試')
}
```

---

## 📝 遷移現有 API

### 步驟 1: 導入工具

```typescript
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateToken,
  parseJwtToken,
  validateDatabaseUrl,
  handleDatabaseError
} from '../../../utils/error-handler'
```

### 步驟 2: 替換 Token 驗證

**舊代碼（~20 行）：**
```typescript
const authHeader = request.headers.get('Authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ success: false, message: '未提供認證 token' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
const token = authHeader.substring(7)
let userId: number
try {
  const payload = JSON.parse(atob(token.split('.')[1]))
  userId = payload.userId || payload.user_id
  if (!userId) throw new Error('Missing user id')
} catch (error) {
  return new Response(
    JSON.stringify({ success: false, message: '無效的 token' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
```

**新代碼（2 行）：**
```typescript
const token = validateToken(request.headers.get('Authorization'))
const payload = parseJwtToken(token)
const userId = payload.userId
```

### 步驟 3: 替換錯誤回應

**舊代碼：**
```typescript
return new Response(
  JSON.stringify({ success: false, message: '課程不存在' }),
  { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
)
```

**新代碼：**
```typescript
throw new ApiError(ErrorCode.NOT_FOUND, '課程不存在')
```

### 步驟 4: 替換成功回應

**舊代碼：**
```typescript
return new Response(
  JSON.stringify({ success: true, data: result }),
  { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
)
```

**新代碼：**
```typescript
return createSuccessResponse(result)
```

### 步驟 5: 包裝處理函數

**舊代碼：**
```typescript
export async function onRequestGet(context: Context): Promise<Response> {
  try {
    // ... 業務邏輯
  } catch (error) {
    // ... 錯誤處理
  }
}
```

**新代碼：**
```typescript
async function handleRequest(context: Context): Promise<Response> {
  // ... 業務邏輯（不需要 try-catch）
}

export const onRequestGet = withErrorHandler(handleRequest, 'API Name')
```

---

## ✅ 檢查清單

遷移完成後，確認：

- [ ] 移除所有手動的錯誤回應代碼
- [ ] 使用 `ApiError` 拋出錯誤
- [ ] 使用 `createSuccessResponse` 返回成功
- [ ] 使用 `withErrorHandler` 包裝處理函數
- [ ] 移除手動的 CORS 處理（OPTIONS 除外）
- [ ] 測試正常和錯誤情況

---

## 🧪 測試

```bash
# 測試遷移後的 API
./scripts/test-migrated-apis.sh

# 或指定 URL
./scripts/test-migrated-apis.sh https://your-deployment.pages.dev
```

---

## 📚 完整文檔

- [完整使用指南](./ERROR_HANDLER_GUIDE.md)
- [遷移進度追蹤](./ERROR_HANDLER_MIGRATION.md)
- [常見錯誤記錄](./.kiro/steering/common-mistakes.md)

---

## 💡 提示

1. **開發時**：錯誤會自動記錄到控制台
2. **生產環境**：可以集成錯誤監控服務
3. **前端**：使用 `apiEnhanced` 自動處理 token 和重試
4. **後端**：使用 `withErrorHandler` 自動處理錯誤和 CORS

---

*最後更新：2024-11-14*
