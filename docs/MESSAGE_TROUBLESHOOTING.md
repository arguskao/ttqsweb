# 訊息功能故障排除指南

## 🔍 問題：學員收不到講師發送的訊息

### 診斷結果

根據資料庫檢查，訊息系統的後端運作正常：

✅ **資料庫狀態**
- 訊息表 `course_messages` 存在
- 訊息已正確儲存到資料庫
- SQL 查詢邏輯正確
- 用戶已報名課程

✅ **測試結果**
```
課程: 藥學入門 (ID: 1)
發送者: 啟峰 高 (wii543@gmail.com) - 講師
收件人: 育萱 高 (seo1515@gmail.com) - 學員
訊息數: 1 則
報名狀態: enrolled ✅
API 查詢: 可以正確查到訊息 ✅
```

### 問題原因

❌ **前端報名狀態檢查過於嚴格**

原始代碼：
```typescript
if (!enrollment || enrollment.status === 'not_enrolled') {
  errorMessage.value = '您尚未報名此課程，無法查看訊息'
  return
}
```

問題：
1. 如果 `enrollment` 為 `null` 或 `undefined`，會阻止訊息載入
2. 如果 API 請求失敗，會直接返回錯誤
3. 沒有給後端 API 機會來處理權限

### 修復方案

✅ **放寬前端檢查，讓後端處理權限**

修復後代碼：
```typescript
// 只有明確的 not_enrolled 才阻止
if (enrollment && enrollment.status === 'not_enrolled') {
  errorMessage.value = '您尚未報名此課程，無法查看訊息'
  return
}

// 如果檢查失敗，仍然嘗試載入訊息
catch (enrollError) {
  console.log('報名狀態檢查失敗，繼續載入訊息')
}
```

改進：
1. ✅ 只有明確的 `not_enrolled` 才阻止
2. ✅ 如果檢查失敗，仍然嘗試載入訊息
3. ✅ 添加詳細的 console.log 用於調試
4. ✅ 讓後端 API 來決定最終權限

## 🧪 診斷工具

### 1. 檢查訊息資料
```bash
npx tsx src/scripts/check-messages.ts
```

輸出：
- 訊息總數
- 最近的訊息記錄
- 按課程統計
- 群發/單獨訊息統計

### 2. 測試 API 邏輯
```bash
npx tsx src/scripts/test-message-api.ts
```

輸出：
- 模擬 API 查詢
- 檢查報名狀態
- 測試所有學員
- 診斷建議

## 📱 前端調試

### 打開瀏覽器控制台

部署後，學員訪問訊息頁面時，會看到以下 console.log：

```javascript
[CourseMessages] 報名狀態: { status: 'enrolled', ... }
[CourseMessages] 開始載入訊息，課程 ID: 1
[CourseMessages] API 回應: { success: true, data: [...] }
[CourseMessages] 載入訊息成功，數量: 1
```

### 如果看不到訊息

檢查 console.log 輸出：

1. **報名狀態是什麼？**
   - `enrolled` / `in_progress` / `completed` → 應該可以看到訊息
   - `not_enrolled` → 會被阻止
   - `null` / `undefined` → 現在會繼續嘗試載入

2. **API 回應是什麼？**
   - `success: true` → 檢查 `data` 陣列
   - `success: false` → 檢查錯誤訊息

3. **訊息數量是多少？**
   - `> 0` → 訊息應該顯示
   - `= 0` → 可能沒有訊息，或查詢條件有問題

## 🔧 常見問題

### Q1: 訊息在資料庫中，但前端看不到

**可能原因：**
1. Token 中的 userId 不正確
2. 前端請求的 courseId 不正確
3. 瀏覽器快取問題

**解決方案：**
1. 檢查瀏覽器 console.log
2. 清除瀏覽器快取
3. 重新登入
4. 檢查 Network 標籤的 API 請求

### Q2: 群發訊息學員收不到

**檢查：**
```bash
npx tsx src/scripts/check-messages.ts
```

查看：
- 群發訊息數量
- 是否為每個學員創建了記錄

**預期：**
- 群發給 N 位學員 = 資料庫中有 N 條記錄
- 每條記錄的 `is_broadcast = TRUE`

### Q3: 單獨訊息學員收不到

**檢查：**
```bash
npx tsx src/scripts/test-message-api.ts
```

查看：
- recipient_id 是否正確
- 用戶是否已報名課程
- SQL 查詢是否返回訊息

## 📊 API 端點測試

### 測試查詢訊息 API

```bash
# 替換 YOUR_DOMAIN 和 YOUR_TOKEN
curl -X GET https://YOUR_DOMAIN.pages.dev/api/v1/courses/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

預期回應：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "courseId": 1,
      "senderId": 123,
      "senderName": "講師名稱",
      "subject": "訊息主旨",
      "message": "訊息內容",
      "isBroadcast": false,
      "createdAt": "2024-11-13T14:45:20Z"
    }
  ]
}
```

### 測試發送訊息 API

```bash
# 使用講師 token
curl -X POST https://YOUR_DOMAIN.pages.dev/api/v1/courses/1/messages \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "測試訊息",
    "message": "這是測試",
    "isBroadcast": true
  }'
```

## 🎯 驗證步驟

部署後，按以下步驟驗證：

### 1. 講師端
1. ✅ 登入講師帳號
2. ✅ 進入「我的授課」→「學員管理」
3. ✅ 點擊「發送訊息給學員」
4. ✅ 填寫主旨和內容
5. ✅ 發送成功，看到確認訊息

### 2. 資料庫檢查
```bash
npx tsx src/scripts/check-messages.ts
```
6. ✅ 確認訊息已儲存到資料庫

### 3. 學員端
7. ✅ 登入學員帳號
8. ✅ 進入課程詳情頁
9. ✅ 點擊「查看課程訊息」
10. ✅ 打開瀏覽器 Console
11. ✅ 查看 console.log 輸出
12. ✅ 確認可以看到訊息

## 💡 最佳實踐

### 發送訊息
1. 確認課程有學員報名
2. 使用清晰的主旨
3. 訊息內容簡潔明確
4. 群發前先測試單獨發送

### 查看訊息
1. 確認已報名課程
2. 檢查瀏覽器 console.log
3. 清除快取後重試
4. 使用無痕模式測試

## 📞 需要幫助？

如果問題仍然存在：

1. **收集資訊**
   - 瀏覽器 console.log 輸出
   - Network 標籤的 API 請求
   - 執行診斷腳本的輸出

2. **檢查清單**
   - [ ] 訊息在資料庫中
   - [ ] 用戶已報名課程
   - [ ] API 查詢返回訊息
   - [ ] 前端 console.log 正常
   - [ ] 沒有 JavaScript 錯誤

3. **聯繫支援**
   - 提供上述資訊
   - 說明重現步驟
   - 附上截圖

---

**最後更新：** 2024-11-13  
**版本：** 1.0
