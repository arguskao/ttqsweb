# 用戶角色系統遷移指南

本指南將幫助你將現有的雙角色系統（雇主/求職者）升級為四層角色系統（管理員/講師/雇主/求職者）。

## 🚀 快速開始

### 1. 檢查環境配置

首先確保你的環境變數配置正確：

```bash
npm run check:env
```

如果有錯誤，請按照提示修正 `.env` 檔案。

### 2. 執行角色系統遷移

```bash
npm run migrate:roles
```

這個命令會：

- 更新資料庫結構以支援新角色
- 創建默認管理員帳號
- 顯示遷移結果和用戶統計

### 3. 登入管理員帳號

遷移完成後，使用以下帳號登入：

- **帳號**: `admin@ttqs.com`
- **密碼**: `admin123`

⚠️ **重要**: 請立即修改默認密碼！

## 📋 詳細步驟

### 步驟 1: 備份資料庫（建議）

在執行遷移前，建議備份你的資料庫：

```bash
# 如果使用 PostgreSQL
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步驟 2: 檢查現有用戶

查看目前的用戶分佈：

```bash
npm run test:db
```

### 步驟 3: 執行遷移

```bash
# 檢查環境
npm run check:env

# 執行遷移
npm run migrate:roles
```

### 步驟 4: 驗證遷移結果

遷移完成後，你應該看到類似的輸出：

```
📊 當前用戶統計:
   管理員: 1/1 (活躍/總數)
   講師: 0/0 (活躍/總數)
   雇主: X/X (活躍/總數)
   求職者: Y/Y (活躍/總數)
```

## 🔧 新功能

### 四層角色系統

1. **管理員 (admin)**
   - 系統全域管理
   - 用戶角色分配
   - 數據分析和報表
   - 所有功能完整存取

2. **講師 (instructor)**
   - 課程管理和教學
   - 學員進度追蹤
   - 教學資源管理
   - TTQS 文檔管理

3. **雇主 (employer)**
   - 職缺發布和管理
   - 應徵者篩選
   - 公司資料管理
   - 招聘數據查看

4. **求職者 (job_seeker)**
   - 個人資料管理
   - 課程學習
   - 工作申請
   - 學習記錄查看

### 權限管理

新系統包含細緻的權限控制：

- 系統管理權限
- TTQS 管理權限
- 課程管理權限
- 工作管理權限
- 數據分析權限

## 🎯 遷移後的任務

### 1. 角色分配

登入管理員帳號後：

1. 進入用戶管理界面
2. 為現有用戶分配適當角色
3. 根據需要創建講師帳號

### 2. 權限測試

測試各角色的權限：

- 管理員：所有功能
- 講師：課程和 TTQS 管理
- 雇主：工作發布
- 求職者：學習和求職

### 3. 安全設置

- 修改默認管理員密碼
- 檢查用戶帳號狀態
- 設置適當的角色權限

## 🔍 故障排除

### 常見問題

**Q: 遷移失敗，提示資料庫連接錯誤**
A: 檢查 `DATABASE_URL` 環境變數是否正確設置

**Q: 無法創建管理員帳號**
A: 檢查是否已存在相同 email 的用戶

**Q: 角色約束錯誤**
A: 可能是資料庫中有無效的 user_type 值，需要手動清理

### 手動修復

如果自動遷移失敗，可以手動執行 SQL：

```sql
-- 更新用戶類型約束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
CHECK (user_type IN ('admin', 'instructor', 'employer', 'job_seeker'));

-- 創建管理員帳號（替換密碼哈希）
INSERT INTO users (email, password_hash, user_type, first_name, last_name)
VALUES ('admin@ttqs.com', '$2b$10$...', 'admin', '系統', '管理員');
```

## 📞 支援

如果遇到問題：

1. 檢查遷移日誌
2. 確認環境變數配置
3. 查看資料庫連接狀態
4. 聯繫技術支援

## 🔄 回滾

如果需要回滾到舊系統：

```sql
-- 恢復舊的用戶類型約束
ALTER TABLE users DROP CONSTRAINT users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
CHECK (user_type IN ('employer', 'job_seeker'));

-- 刪除管理員和講師帳號（謹慎操作）
DELETE FROM users WHERE user_type IN ('admin', 'instructor');
```

⚠️ **警告**: 回滾會刪除所有管理員和講師帳號，請謹慎操作！
