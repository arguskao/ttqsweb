# 資料庫冗餘分析報告
Database Redundancy Analysis Report

## 📊 概述 Overview

本報告分析目前資料庫中存在的冗餘表結構，並提供優化建議。透過整合重複功能的表格，可以簡化資料庫架構、提升維護效率並減少數據不一致的風險。

**分析日期：** `${new Date().toISOString().split('T')[0]}`  
**分析範圍：** 所有 migration 文件 (001-013)  
**總表數：** 25+ 個資料表

---

## 🔍 發現的冗餘問題

### 1. 文件管理系統冗餘 📁

#### 問題描述
發現三個功能重疊的文件管理表：

| 表名 | Migration | 用途 | 問題 |
|------|-----------|------|------|
| `documents` | 006 | 一般文件管理 | 功能與 uploaded_files 重疊 |
| `uploaded_files` | 013 | 文件上傳記錄 | 最完整的文件管理方案 |
| `ttqs_documents` | 008 | TTQS專用文件 | 可用 category 區分 |

#### 重疊欄位分析
```sql
-- documents 表
title, description, file_url, file_type, file_size, category, uploaded_by

-- uploaded_files 表  
original_name, file_name, file_url, file_size, file_type, category, uploaded_by

-- ttqs_documents 表
title, file_url, file_size, document_type, uploaded_by
```

### 2. 講師管理系統部分冗餘 👨‍🏫

#### 已解決的冗餘
✅ **`instructors` vs `instructor_applications`** - 已在 migration 012 正確重構

#### 仍存在的問題
⚠️ **`instructor_development` vs `instructor_applications`**

| 表名 | 用途 | 重疊欄位 |
|------|------|----------|
| `instructor_applications` | 講師申請和基本資訊 | `user_id`, `status`, `created_at` |
| `instructor_development` | 講師發展路徑追蹤 | `user_id`, `application_status` |

### 3. 評分系統複雜度 ⭐

#### 多重評分表結構
- `instructor_ratings` - 講師評分（簡單評分）
- `reaction_evaluations` - TTQS 反應評估
- `learning_evaluations` - TTQS 學習評估  
- `behavior_evaluations` - TTQS 行為評估
- `result_evaluations` - TTQS 結果評估

**分析：** TTQS 評估是專業要求，應保留。但 `instructor_ratings` 可考慮整合。

---

## 🎯 優化建議

### 高優先級 🔴

#### 1. 統一文件管理系統
**建議動作：** 移除 `documents` 和 `ttqs_documents`，統一使用 `uploaded_files`

**實施方案：**
```sql
-- 數據遷移策略
INSERT INTO uploaded_files (original_name, file_name, file_url, file_size, file_type, category, uploaded_by, created_at)
SELECT 
    title as original_name,
    CONCAT('doc_', id, '_', REPLACE(title, ' ', '_')) as file_name,
    file_url,
    file_size,
    file_type,
    COALESCE(category, 'general') as category,
    uploaded_by,
    created_at
FROM documents;

-- TTQS 文件遷移
INSERT INTO uploaded_files (original_name, file_name, file_url, file_size, file_type, category, uploaded_by, created_at)
SELECT 
    title as original_name,
    CONCAT('ttqs_', id, '_', REPLACE(title, ' ', '_')) as file_name,
    file_url,
    file_size,
    'application/pdf' as file_type,
    'ttqs' as category,
    uploaded_by,
    created_at
FROM ttqs_documents;
```

**節省效益：**
- 減少 2 個資料表
- 統一文件管理邏輯
- 簡化 API 開發

### 中優先級 🟡

#### 2. 整合講師發展路徑
**建議動作：** 將 `instructor_development` 的欄位整合到 `instructor_applications`

**實施方案：**
```sql
-- 擴展 instructor_applications 表
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50);
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS teaching_hours INTEGER DEFAULT 0;
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS student_rating DECIMAL(3,2);
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS certifications TEXT[];
```

### 低優先級 🟢

#### 3. 評分系統優化
**建議動作：** 保持 TTQS 評估系統，優化 `instructor_ratings` 整合

---

## 📈 預期效益

### 直接效益
- **減少表數：** 從 25+ 降至 22-23 個
- **簡化關聯：** 減少複雜的 JOIN 查詢
- **統一邏輯：** 文件管理統一化

### 間接效益
- **維護成本降低：** 減少重複代碼
- **數據一致性提升：** 避免多表同步問題
- **開發效率提升：** 統一的 API 接口

---

## 🚀 實施計劃

### Phase 1: 文件系統統一 (1-2 週)
1. ✅ 創建數據遷移腳本
2. ✅ 更新相關 API 和服務
3. ✅ 測試文件操作功能
4. ✅ 部署並移除舊表

### Phase 2: 講師系統整合 (1 週)
1. ✅ 擴展 instructor_applications 表結構
2. ✅ 遷移 instructor_development 數據
3. ✅ 更新相關業務邏輯
4. ✅ 測試講師管理功能

### Phase 3: 性能優化 (1 週)
1. ✅ 重新評估索引策略
2. ✅ 優化查詢語句
3. ✅ 性能測試和調優

---

## ⚠️ 風險評估

### 高風險
- **數據遷移失敗：** 可能導致文件丟失
  - **緩解策略：** 完整備份 + 分階段遷移

### 中風險  
- **API 兼容性問題：** 前端可能需要調整
  - **緩解策略：** 漸進式重構 + API 版本控制

### 低風險
- **性能暫時下降：** 重建索引期間
  - **緩解策略：** 非業務高峰期執行

---

## 📋 檢查清單

### 遷移前檢查
- [ ] 完整數據庫備份
- [ ] 確認所有相關 API 端點
- [ ] 測試環境驗證
- [ ] 回滾計劃準備

### 遷移後驗證
- [ ] 數據完整性檢查
- [ ] 功能測試通過
- [ ] 性能基準測試
- [ ] 用戶驗收測試

---

## 📞 聯絡資訊

如有任何問題或需要進一步說明，請聯絡：
- **技術負責人：** [待填入]
- **數據庫管理員：** [待填入]
- **項目經理：** [待填入]

---

*最後更新：${new Date().toISOString().split('T')[0]}*