# Bug 修復：課程報名狀態判斷錯誤

## 🐛 問題描述

### 問題 1: 未報名顯示「已註冊」
- **現象**：新註冊的學員進入課程詳情頁，顯示「✅ 您已註冊此課程」
- **實際**：學員並未報名該課程

### 問題 2: 未報名可查看訊息
- **現象**：點擊「查看課程訊息」後，顯示「目前沒有訊息」
- **實際**：應該提示「您尚未報名此課程」

## 🔍 問題原因

### 原因 1: 前端狀態判斷錯誤

**原始代碼：**
```typescript
const checkEnrollmentStatus = async (courseId: number) => {
  try {
    const progress = await courseService.getCourseProgress(courseId)
    isEnrolled.value = true  // ❌ 直接設為 true
    enrollmentStatus.value = 'enrolled'
  } catch (err) {
    isEnrolled.value = false
    enrollmentStatus.value = 'not_enrolled'
  }
}
```

**問題：**
- API 在用戶未報名時返回 `status: 'not_enrolled'`
- 但前端只要 API 成功返回（200），就認為已報名
- 沒有檢查返回的 `status` 欄位

### 原因 2: 訊息頁面缺少權限檢查

**原始代碼：**
```typescript
const loadMessages = async () => {
  const response = await api.get(`/courses/${courseId}/messages`)
  // 直接載入訊息，沒有檢查是否已報名
}
```

**問題：**
- 沒有檢查用戶是否已報名課程
- 未報名用戶也能進入訊息頁面
- 只是看到空列表，體驗不佳

## ✅ 修復方案

### 修復 1: 正確判斷報名狀態

**修復後代碼：**
```typescript
const checkEnrollmentStatus = async (courseId: number) => {
  try {
    const progress = await courseService.getCourseProgress(courseId)
    // ✅ 檢查 status 欄位
    if (progress && progress.status && progress.status !== 'not_enrolled') {
      isEnrolled.value = true
      enrollmentStatus.value = 'enrolled'
    } else {
      isEnrolled.value = false
      enrollmentStatus.value = 'not_enrolled'
    }
  } catch (err) {
    isEnrolled.value = false
    enrollmentStatus.value = 'not_enrolled'
  }
}
```

**改進：**
- ✅ 檢查 `progress.status` 欄位
- ✅ 只有 status 不是 `not_enrolled` 才算已報名
- ✅ 正確處理未報名狀態

### 修復 2: 訊息頁面添加權限檢查

**修復後代碼：**
```typescript
const loadMessages = async () => {
  try {
    // ✅ 先檢查是否已報名
    const enrollmentResponse = await api.get(`/courses/${courseId}/progress`)
    const enrollment = enrollmentResponse.data?.data
    
    if (!enrollment || enrollment.status === 'not_enrolled') {
      errorMessage.value = '您尚未報名此課程，無法查看訊息'
      isLoading.value = false
      return
    }

    // 已報名，載入訊息
    const response = await api.get(`/courses/${courseId}/messages`)
    // ...
  }
}
```

**改進：**
- ✅ 先檢查報名狀態
- ✅ 未報名顯示明確的錯誤訊息
- ✅ 避免不必要的 API 請求

## 📊 修復效果

### 修復前
```
用戶進入課程詳情頁
    ↓
顯示「✅ 您已註冊此課程」 ❌ 錯誤
    ↓
點擊「查看課程訊息」
    ↓
顯示「目前沒有訊息」 ❌ 誤導
```

### 修復後
```
用戶進入課程詳情頁
    ↓
正確顯示「立即報名」按鈕 ✅
    ↓
點擊報名後
    ↓
顯示「✅ 您已註冊此課程」 ✅
    ↓
點擊「查看課程訊息」
    ↓
正確顯示訊息或「目前沒有訊息」 ✅
```

### 未報名嘗試查看訊息
```
用戶直接訪問訊息頁面
    ↓
檢查報名狀態
    ↓
顯示「您尚未報名此課程，無法查看訊息」 ✅
```

## 🧪 測試驗證

### 測試案例 1: 未報名用戶
1. ✅ 使用新註冊的學員帳號登入
2. ✅ 進入課程詳情頁
3. ✅ 確認顯示「立即報名」按鈕
4. ✅ 確認不顯示「查看課程訊息」按鈕

### 測試案例 2: 已報名用戶
1. ✅ 點擊「立即報名」
2. ✅ 確認顯示「✅ 您已註冊此課程」
3. ✅ 確認顯示「查看學習進度」按鈕
4. ✅ 確認顯示「查看課程訊息」按鈕

### 測試案例 3: 訊息權限
1. ✅ 已報名用戶可以查看訊息
2. ✅ 未報名用戶看到錯誤提示
3. ✅ 訊息列表正確顯示

## 📝 相關檔案

### 修改的檔案
- `src/views/courses/CourseDetailView.vue` - 修復報名狀態判斷
- `src/views/courses/CourseMessagesView.vue` - 添加權限檢查

### 相關 API
- `GET /api/v1/courses/:id/progress` - 查詢報名狀態
- `GET /api/v1/courses/:courseId/messages` - 查詢訊息

## 🚀 部署狀態

- ✅ 代碼已提交
- ✅ 已推送到 main 分支
- ⏳ 等待 Cloudflare Pages 部署

## 📋 後續建議

### 短期改進
1. 添加更友善的錯誤提示
2. 在訊息頁面添加「立即報名」按鈕
3. 改進載入狀態的顯示

### 長期改進
1. 統一報名狀態的檢查邏輯
2. 添加報名狀態的快取機制
3. 改進錯誤處理和用戶體驗

## ✅ 檢查清單

部署後請驗證：

- [ ] 未報名用戶看到「立即報名」按鈕
- [ ] 已報名用戶看到「已註冊」提示
- [ ] 未報名用戶無法查看訊息
- [ ] 已報名用戶可以正常查看訊息
- [ ] 錯誤訊息清晰明確
- [ ] 沒有控制台錯誤

---

**修復時間：** 2024-11-13  
**修復版本：** commit 4329976  
**影響範圍：** 課程報名和訊息功能
