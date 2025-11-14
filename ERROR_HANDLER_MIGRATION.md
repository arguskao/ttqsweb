# 🔄 錯誤處理工具遷移進度

> **開始時間：** 2024-11-14  
> **狀態：** 🚧 進行中

## 📊 遷移進度總覽

### 已完成 ✅ (9/50+)

| API 端點 | 狀態 | 代碼減少 | 備註 |
|---------|------|---------|------|
| `auth/login.ts` | ✅ | ~45% | 使用統一錯誤處理 |
| `auth/register.ts` | ✅ | ~50% | 簡化驗證邏輯 |
| `courses.ts` | ✅ | ~45% | 統一分頁和搜尋邏輯 |
| `courses/[id].ts` | ✅ | ~40% | 統一資料庫處理 |
| `courses/[id]/enroll.ts` | ✅ | ~55% | 簡化 token 驗證 |
| `courses/[id]/progress.ts` | ✅ | ~50% | 統一進度查詢 |
| `courses/[courseId]/students.ts` | ✅ | ~51% | 簡化權限檢查 |
| `users/enrollments.ts` | ✅ | ~52% | 統一 token 驗證 |
| `upload.ts` | ✅ | ~40% | 統一檔案上傳處理 |

### 進行中 🚧

- 無

### 待遷移 📋

#### 高優先級（核心功能）
- [x] `auth/register.ts` - 用戶註冊 ✅
- [x] `courses/[id].ts` - 課程詳情 ✅
- [x] `courses/[id]/enroll.ts` - 課程報名 ✅
- [ ] `instructors/[instructorId]/courses.ts` - 講師課程列表
- [ ] `upload.ts` - 檔案上傳

#### 中優先級（常用功能）
- [ ] `courses.ts` - 課程列表
- [ ] `experiences.ts` - 經驗分享
- [ ] `groups.ts` - 群組管理
- [ ] `forum/topics.ts` - 論壇主題
- [ ] `jobs/[id]/favorite.ts` - 職缺收藏

#### 低優先級（管理功能）
- [ ] `admin/experiences.ts` - 管理員經驗分享
- [ ] `ttqs/plans.ts` - TTQS 計劃
- [ ] 其他管理 API

---

## 📈 效益統計

### 代碼質量改善

| 指標 | 遷移前 | 遷移後 | 改善 |
|------|--------|--------|------|
| 平均代碼行數 | ~150 行 | ~70 行 | ⬇️ 53% |
| 錯誤處理代碼 | ~60 行 | ~5 行 | ⬇️ 92% |
| Token 驗證代碼 | ~20 行 | 1 行 | ⬇️ 95% |
| CORS 處理代碼 | ~10 行 | 0 行 | ⬇️ 100% |

### 實際案例對比

#### auth/login.ts
- **遷移前：** 220 行
- **遷移後：** 120 行
- **減少：** 100 行 (45%)

**主要改善：**
- ✅ 移除重複的錯誤回應代碼
- ✅ 統一的資料庫錯誤處理
- ✅ 自動 CORS 處理
- ✅ 標準化的成功回應格式

#### courses/[courseId]/students.ts
- **遷移前：** 195 行
- **遷移後：** 95 行
- **減少：** 100 行 (51%)

**主要改善：**
- ✅ 簡化 token 驗證（20 行 → 2 行）
- ✅ 統一權限檢查
- ✅ 自動錯誤處理和日誌

#### users/enrollments.ts
- **遷移前：** 145 行
- **遷移後：** 70 行
- **減少：** 75 行 (52%)

**主要改善：**
- ✅ 移除重複的 token 解析代碼
- ✅ 統一資料庫連接處理
- ✅ 標準化回應格式

---

## 🎯 遷移模式

### 標準遷移步驟

1. **導入錯誤處理工具**
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

2. **定義類型**
```typescript
interface Env {
  DATABASE_URL: string
  JWT_SECRET?: string
}

interface Context {
  request: Request
  env: Env
  params?: Record<string, string>
}
```

3. **創建處理函數**
```typescript
async function handleRequest(context: Context): Promise<Response> {
  const { request, env, params } = context
  
  // 驗證 token（如需要）
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  
  // 驗證資料庫
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  
  try {
    // 業務邏輯
    const result = await sql`SELECT ...`
    
    return createSuccessResponse(result)
  } catch (dbError) {
    handleDatabaseError(dbError, 'Context Name')
  }
}
```

4. **導出包裝後的處理函數**
```typescript
export const onRequestGet = withErrorHandler(handleRequest, 'API Name')
```

### 常見模式替換

#### 模式 1: Token 驗證
**舊代碼：**
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

**新代碼：**
```typescript
const token = validateToken(request.headers.get('Authorization'))
const payload = parseJwtToken(token)
const userId = payload.userId
```

#### 模式 2: 資料庫連接
**舊代碼：**
```typescript
const { neon } = await import('@neondatabase/serverless')
const databaseUrl = env.DATABASE_URL
if (!databaseUrl) {
  return new Response(
    JSON.stringify({ success: false, message: 'Database URL not configured' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
const sql = neon(databaseUrl)
```

**新代碼：**
```typescript
const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
const { neon } = await import('@neondatabase/serverless')
const sql = neon(databaseUrl)
```

#### 模式 3: 錯誤回應
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

#### 模式 4: 成功回應
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

---

## 🔍 遷移檢查清單

每個 API 遷移後，請確認：

### 功能檢查
- [ ] Token 驗證正常工作
- [ ] 權限檢查正確執行
- [ ] 資料庫查詢成功
- [ ] 錯誤處理符合預期
- [ ] CORS 標頭正確設置

### 代碼質量檢查
- [ ] 移除所有重複的錯誤處理代碼
- [ ] 使用統一的錯誤類型
- [ ] 日誌訊息包含上下文
- [ ] 類型定義完整
- [ ] 沒有 TypeScript 錯誤

### 測試檢查
- [ ] 正常請求測試通過
- [ ] 錯誤情況測試通過
- [ ] 權限檢查測試通過
- [ ] CORS 預檢請求正常

---

## 📝 遷移日誌

### 2024-11-14

#### ✅ 完成遷移（第一批）
1. **auth/login.ts**
   - 減少 100 行代碼 (45%)
   - 統一密碼驗證邏輯
   - 改善錯誤訊息

2. **courses/[courseId]/students.ts**
   - 減少 100 行代碼 (51%)
   - 簡化權限檢查
   - 統一 token 驗證

3. **users/enrollments.ts**
   - 減少 75 行代碼 (52%)
   - 移除重複代碼
   - 標準化回應格式

#### ✅ 完成遷移（第二批）
4. **auth/register.ts**
   - 減少 110 行代碼 (50%)
   - 統一驗證邏輯
   - 簡化錯誤處理

5. **courses/[id].ts**
   - 減少 60 行代碼 (40%)
   - 統一資料庫處理
   - 標準化回應格式

6. **courses/[id]/enroll.ts**
   - 減少 100 行代碼 (55%)
   - 簡化 token 驗證
   - 移除重複代碼

#### 📊 今日統計
- **遷移 API 數量：** 6
- **減少代碼行數：** 545 行
- **平均減少比例：** 49%
- **發現問題：** 0
- **修復問題：** 1 (TypeScript 類型問題)

---

## 🎯 下一步計劃

### 本週目標（2024-11-14 ~ 2024-11-20）
1. 遷移 5 個高優先級 API
2. 創建自動化測試腳本
3. 更新 API 文檔

### 本月目標（2024-11）
1. 完成所有核心 API 遷移（15 個）
2. 遷移 50% 的常用 API
3. 建立遷移最佳實踐文檔

### 長期目標（2024-12）
1. 完成所有 API 遷移
2. 建立自動化測試套件
3. 性能優化和監控

---

## 💡 經驗教訓

### 成功經驗
1. **統一的錯誤處理大幅減少代碼重複**
   - Token 驗證從 20 行減少到 2 行
   - 錯誤回應從 10 行減少到 1 行

2. **類型安全提高代碼質量**
   - 使用 TypeScript 介面定義
   - 編譯時捕獲錯誤

3. **自動 CORS 處理簡化配置**
   - 不需要在每個 API 中重複設置
   - 統一的 CORS 策略

### 遇到的問題
1. **TypeScript 類型推斷**
   - 問題：`request.json()` 返回 `any` 類型
   - 解決：明確類型斷言 `as { email?: string; password?: string }`

### 改進建議
1. 創建更多輔助函數
   - 參數驗證輔助函數
   - 分頁查詢輔助函數
2. 增強錯誤訊息
   - 提供更詳細的錯誤上下文
   - 支援多語言錯誤訊息

---

## 📚 相關文檔

- [錯誤處理工具使用指南](./ERROR_HANDLER_GUIDE.md)
- [後端錯誤處理工具](./functions/utils/error-handler.ts)
- [前端錯誤處理工具](./src/utils/error-handler.ts)
- [API 服務增強版](./src/services/api-enhanced.ts)
- [常見錯誤記錄](./.kiro/steering/common-mistakes.md)

---

*最後更新：2024-11-14*
