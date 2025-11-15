# 錯誤處理系統使用指南

## 📋 概述

本項目實施了一套完整的錯誤處理系統，包括：
- 統一的錯誤處理器
- Toast 通知組件
- 錯誤日誌記錄
- 全局錯誤捕獲

## 🎯 核心組件

### 1. Toast 通知系統

#### 基本使用

```typescript
import { toast } from '@/utils/toast'

// 成功通知
toast.success('操作成功！')
toast.success('課程已創建', '成功')

// 錯誤通知
toast.error('操作失敗，請重試')
toast.error('無法連接到服務器', '錯誤')

// 警告通知
toast.warning('請先完成必填項')
toast.warning('文件大小超過限制', '警告')

// 信息通知
toast.info('系統將在 5 分鐘後維護')
toast.info('有新的消息', '提示')
```

#### 在 Vue 組件中使用

```vue
<script setup lang="ts">
import { toast } from '@/utils/toast'

const handleSubmit = async () => {
  try {
    await api.post('/courses', data)
    toast.success('課程創建成功！')
  } catch (error) {
    // 錯誤會自動被處理並顯示 Toast
    console.error(error)
  }
}
</script>
```

#### 自定義配置

```typescript
// 自定義持續時間
toast.success('操作成功', undefined, 5000) // 5 秒

// 使用 show 方法進行完全自定義
toast.show({
  message: '自定義消息',
  title: '自定義標題',
  type: 'info',
  duration: 3000,
  closable: true
})
```

### 2. 錯誤日誌系統

#### 基本使用

```typescript
import { errorLogger, ErrorLevel, ErrorCategory } from '@/utils/error-logger'

// 記錄不同級別的日誌
errorLogger.debug(ErrorCategory.API, '調試信息', { data: '...' })
errorLogger.info(ErrorCategory.API, 'API 請求成功')
errorLogger.warning(ErrorCategory.VALIDATION, '數據驗證警告')
errorLogger.error(ErrorCategory.NETWORK, '網絡請求失敗')
errorLogger.critical(ErrorCategory.RUNTIME, '嚴重錯誤')
```

#### 錯誤類別

```typescript
enum ErrorCategory {
  NETWORK = 'network',      // 網絡錯誤
  API = 'api',             // API 錯誤
  AUTH = 'auth',           // 認證錯誤
  VALIDATION = 'validation', // 驗證錯誤
  RUNTIME = 'runtime',     // 運行時錯誤
  UNKNOWN = 'unknown'      // 未知錯誤
}
```

#### 查看和管理日誌

```typescript
// 獲取所有日誌
const allLogs = errorLogger.getLogs()

// 獲取特定級別的日誌
const errors = errorLogger.getLogsByLevel(ErrorLevel.ERROR)

// 獲取特定類別的日誌
const apiErrors = errorLogger.getLogsByCategory(ErrorCategory.API)

// 導出日誌（用於調試）
const logsJson = errorLogger.exportLogs()
console.log(logsJson)

// 清除日誌
errorLogger.clearLogs()
```

### 3. API 錯誤處理

API 錯誤會自動被處理，無需手動處理：

```typescript
import { apiService } from '@/services/api'

// 錯誤會自動被捕獲、記錄並顯示 Toast
const fetchCourses = async () => {
  try {
    const response = await apiService.get('/courses')
    return response.data
  } catch (error) {
    // 錯誤已經被處理，這裡可以做額外的處理
    console.error('獲取課程失敗:', error)
  }
}
```

#### 自動處理的錯誤類型

| 狀態碼 | 錯誤信息 | 處理方式 |
|--------|---------|---------|
| 400 | 請求參數錯誤 | Toast 警告 |
| 401 | 登入已過期 | Toast 警告 + 清除認證 |
| 403 | 沒有權限 | Toast 警告 |
| 404 | 資源不存在 | Toast 警告 |
| 409 | 數據衝突 | Toast 警告 |
| 422 | 數據驗證失敗 | Toast 警告 |
| 429 | 請求過於頻繁 | Toast 警告 |
| 500 | 服務器錯誤 | Toast 錯誤 |
| 502/503/504 | 服務不可用 | Toast 錯誤 |
| 網絡錯誤 | 網絡連接失敗 | Toast 錯誤 |

### 4. 全局錯誤捕獲

系統會自動捕獲以下錯誤：

#### 未處理的 Promise 拒絕

```typescript
// 這個錯誤會被自動捕獲並記錄
Promise.reject('某個錯誤')
```

#### 運行時錯誤

```typescript
// 這個錯誤會被自動捕獲並記錄
throw new Error('運行時錯誤')
```

## 🎨 最佳實踐

### 1. 在表單提交中使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { toast } from '@/utils/toast'
import { apiService } from '@/services/api'

const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    await apiService.post('/courses', formData)
    toast.success('課程創建成功！')
    // 重定向或其他操作
  } catch (error) {
    // 錯誤已自動處理，這裡可以做額外處理
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

### 2. 在數據加載中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from '@/utils/toast'
import { errorLogger, ErrorCategory } from '@/utils/error-logger'

const isLoading = ref(false)
const data = ref([])

const loadData = async () => {
  isLoading.value = true
  
  try {
    const response = await apiService.get('/courses')
    data.value = response.data
    errorLogger.info(ErrorCategory.API, '課程數據加載成功')
  } catch (error) {
    // 錯誤已自動處理
    errorLogger.error(ErrorCategory.API, '課程數據加載失敗')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
```

### 3. 自定義錯誤處理

```typescript
import { toast } from '@/utils/toast'
import { errorLogger, ErrorCategory } from '@/utils/error-logger'

const handleCustomError = (error: any) => {
  // 記錄錯誤
  errorLogger.error(ErrorCategory.VALIDATION, '自定義錯誤', {
    error: error.message,
    context: '...'
  })
  
  // 顯示自定義 Toast
  toast.error('發生了一個特殊錯誤', '錯誤')
}
```

## 🔧 配置

### Toast 配置

Toast 組件的默認配置：

```typescript
{
  duration: 3000,      // 成功/信息: 3秒
  duration: 4000,      // 警告: 4秒
  duration: 5000,      // 錯誤: 5秒
  closable: true       // 可手動關閉
}
```

### 錯誤日誌配置

錯誤日誌的配置：

```typescript
{
  maxLogs: 100,        // 最多保存 100 條日誌
  sendToServer: true   // 生產環境發送到服務器（預留）
}
```

## 📊 監控和調試

### 開發環境

在開發環境中，所有錯誤都會在控制台顯示詳細信息：

```javascript
// 打開瀏覽器控制台查看
console.log('API 錯誤詳情')
console.log('錯誤日誌')
```

### 生產環境

在生產環境中：
- 錯誤會被記錄但不會顯示詳細堆棧
- 嚴重錯誤會被準備發送到監控服務（預留接口）
- 用戶只會看到友好的錯誤提示

## 🚀 測試

### 運行測試頁面

```bash
npm run dev
```

然後訪問: `http://localhost:5173/scripts/test-error-handling.html`

### 手動測試

在瀏覽器控制台中：

```javascript
// 測試 Toast
toast.success('測試成功')
toast.error('測試錯誤')

// 測試錯誤日誌
errorLogger.error(ErrorCategory.API, '測試錯誤')
errorLogger.getLogs()

// 測試全局錯誤
throw new Error('測試錯誤')
```

## 📝 注意事項

1. **不要過度使用 Toast**：避免在短時間內顯示多個 Toast
2. **合理使用錯誤級別**：根據錯誤嚴重程度選擇合適的級別
3. **保護用戶隱私**：不要在錯誤信息中包含敏感數據
4. **提供有用的上下文**：在記錄錯誤時提供足夠的上下文信息

## 🔗 相關文檔

- [API 服務文檔](./API_SERVICE.md)
- [認證系統文檔](./AUTH_SYSTEM.md)
- [性能優化文檔](./PERFORMANCE.md)
