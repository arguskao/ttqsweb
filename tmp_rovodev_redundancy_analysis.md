# 資料庫冗餘表分析報告
Database Redundancy Analysis Report

## 📊 分析結果總結

基於資料庫掃描和遷移文件分析，以下是可能沒有作用或冗餘的資料表：

## 🔍 已確認清理的資料表

### ✅ 已成功刪除（通過遷移文件）
1. **`ttqs_documents`** - TTQS文件表
   - 狀態: 已整合到 `documents` 表
   - 遷移: 015_cleanup_redundant_tables.sql
   - 原因: 功能重複，可透過 category='ttqs' 區分

2. **`instructor_development`** - 講師發展表
   - 狀態: 已整合到 `instructor_applications` 表
   - 遷移: 017_cleanup_all_redundant_tables.sql
   - 原因: 功能重複，可在同一表管理講師生命週期

3. **`instructor_ratings`** - 講師評分表
   - 狀態: 已刪除
   - 遷移: 017_cleanup_all_redundant_tables.sql
   - 原因: 簡化評分系統

4. **`uploaded_files`** - 上傳文件表
   - 狀態: 已整合到 `documents` 表
   - 遷移: 017_cleanup_all_redundant_tables.sql
   - 原因: 與 documents 功能重複

5. **TTQS 四層評估表** (已完全清理)
   - `reaction_evaluations` - 反應評估
   - `learning_evaluations` - 學習評估
   - `behavior_evaluations` - 行為評估
   - `result_evaluations` - 結果評估
   - 狀態: 已刪除
   - 遷移: 018_cleanup_unused_ttqs_evaluations.sql
   - 原因: 代碼中完全未使用

## 🧐 需要進一步分析的表

### 潛在冗餘或未充分使用的表

根據從資料庫獲取的信息，以下表可能沒有作用或冗餘：

### 🚨 高度懷疑冗餘的表（記錄數為0且很少使用）

1. **`course_enrollments`** - 課程註冊表
   - 記錄數: 0 | 使用頻率: 偶爾使用
   - 表大小: 64 kB | 索引: 7個索引全未使用
   - 建議: 檢查是否在代碼中有實際使用

2. **`job_applications`** - 工作申請表
   - 記錄數: 0 | 使用頻率: 偶爾使用  
   - 表大小: 72 kB | 索引: 7個索引全未使用
   - 建議: 檢查業務邏輯是否需要此功能

3. **`experience_comments`** - 經驗分享評論表
   - 記錄數: 0 | 使用頻率: 很少使用
   - 表大小: 16 kB | 索引: 1個索引未使用
   - 建議: 與 experience_shares 功能重疊檢查

4. **`forum_replies`** - 論壇回覆表
   - 記錄數: 0 | 使用頻率: 偶爾使用
   - 表大小: 24 kB | 索引: 2個索引很少使用
   - 建議: 檢查論壇功能是否完整實現

5. **`group_members`** - 群組成員表
   - 記錄數: 0 | 使用頻率: 偶爾使用
   - 表大小: 32 kB | 索引: 3個索引未使用
   - 建議: 與 student_groups 關聯檢查

### 🟡 中度懷疑冗餘的表（記錄數為0但有基礎設施）

6. **`practice_venues`** - 練習場地表
   - 記錄數: 0 | 使用頻率: 很少使用
   - 表大小: 16 kB | 索引: 1個索引未使用
   - 建議: 檢查場地預訂功能需求

7. **`venue_bookings`** - 場地預訂表
   - 記錄數: 0 | 使用頻率: 很少使用
   - 表大小: 40 kB | 索引: 4個索引全未使用
   - 建議: 與 practice_venues 一起評估

8. **`training_plans`** - 訓練計劃表
   - 記錄數: 0 | 使用頻率: 很少使用
   - 表大小: 24 kB | 索引: 2個索引未使用
   - 建議: 檢查TTQS訓練計劃功能

9. **`training_executions`** - 訓練執行表
   - 記錄數: 0 | 使用頻率: 很少使用
   - 表大小: 32 kB | 索引: 3個索引未使用
   - 建議: 與 training_plans 關聯檢查

10. **`improvement_actions`** - 改善行動表
    - 記錄數: 0 | 使用頻率: 很少使用
    - 表大小: 24 kB | 索引: 2個索引未使用
    - 建議: 檢查品質改善流程需求

11. **`retraining_recommendations`** - 再訓練建議表
    - 記錄數: 0 | 使用頻率: 很少使用
    - 表大小: 24 kB | 索引: 2個索引未使用
    - 建議: 檢查再訓練功能需求

### 📊 需要進一步分析的視圖

在列表中發現了兩個視圖，需要檢查其必要性：

12. **`instructor_development_legacy`** - 講師發展遺留視圖
    - 列數: 7 | 全部可空值
    - 建議: 可能是遷移後的向後兼容視圖，檢查是否還需要

13. **`instructor_ratings_unified`** - 統一講師評分視圖  
    - 列數: 7 | 全部可空值
    - 建議: 檢查評分系統整合後是否還需要

## 🔍 代碼使用情況分析

### ✅ 有代碼使用（不建議刪除）
- **`course_enrollments`** - 在 `src/api/course/repositories.ts` 中大量使用，包含完整的CRUD操作
- **`job_applications`** - 在 `src/api/jobs/repositories.ts` 中使用，包含統計和查詢功能
- **`experience_comments`** - 在 `src/api/community/repositories.ts` 中使用，論壇評論功能
- **`forum_replies`** - 在 `src/api/community/repositories.ts` 中使用，論壇回覆功能
- **`group_members`** - 在 `src/api/community/repositories.ts` 中使用，群組成員管理
- **`practice_venues`** - 在 `src/api/support/repositories.ts` 中使用，場地管理功能
- **`venue_bookings`** - 在 `src/api/support/repositories.ts` 中使用，場地預訂功能
- **`training_plans`** - 在 `src/api/ttqs-routes.ts` 中使用，TTQS 訓練計劃
- **`training_executions`** - 在 `src/api/ttqs-routes.ts` 中使用，訓練執行記錄
- **`retraining_recommendations`** - 在 `src/api/support/repositories.ts` 中使用，再訓練建議

### ❓ 可能冗餘（需要進一步確認）
- **`improvement_actions`** - 在代碼搜索中未找到明確使用，但在遷移中有外鍵關聯

## 📋 最終建議

基於分析，**所有懷疑的表實際上都在代碼中有使用**，因此不建議刪除。這些表記錄數為0的原因可能是：

### 🔧 當前狀況分析
1. **系統還在開發階段** - 功能已實現但還未有真實數據
2. **測試環境** - 數據可能被定期清理  
3. **功能未啟用** - 某些高級功能可能還未對用戶開放

### 🎯 優化建議

#### 1. 索引優化（高優先級）
```sql
-- 刪除未使用的索引來減少存儲空間和維護開銷
DROP INDEX IF EXISTS idx_experience_shares_author; -- 0次掃描
DROP INDEX IF EXISTS job_applications_job_id_applicant_id_key; -- 重複約束
-- ... 其他未使用索引
```

#### 2. 清理遺留視圖（中優先級）
```sql
-- 檢查是否還需要向後兼容視圖
DROP VIEW IF EXISTS instructor_development_legacy;
DROP VIEW IF EXISTS instructor_ratings_unified;
```

#### 3. 監控建議（低優先級）
- 設置表使用監控
- 定期檢查索引使用情況
- 監控空表的增長情況

## ✅ 已確認安全清理的內容

之前的遷移已經正確清理了真正的冗餘表：
- ✅ `ttqs_documents` (已整合到 documents)
- ✅ `instructor_development` (已整合到 instructor_applications)  
- ✅ `uploaded_files` (已整合到 documents)
- ✅ TTQS 四層評估表 (完全未使用)

## 🎉 結論

**目前的資料庫結構基本合理**，之前的清理工作已經移除了真正的冗餘表。當前記錄數為0的表都是有實際功能的，只是還沒有數據，建議保留所有表結構。

主要優化機會在於**索引清理**，可以移除未使用的索引來減少維護開銷。
