-- 清理冗餘表 - 在確認數據遷移成功後執行
-- Cleanup Redundant Tables - Execute after confirming successful data migration

-- ⚠️ 警告：此腳本會刪除舊表，請確保數據已成功遷移並經過測試
-- WARNING: This script will drop old tables, ensure data migration is successful and tested

-- 第一步：驗證數據遷移完整性
-- Step 1: Verify data migration integrity

DO $$
DECLARE
    documents_count INTEGER;
    ttqs_documents_count INTEGER;
    uploaded_files_count INTEGER;
    migration_success BOOLEAN := true;
BEGIN
    -- 檢查原始表的記錄數
    SELECT COUNT(*) INTO documents_count FROM documents;
    
    -- 檢查 ttqs_documents 是否存在
    SELECT COUNT(*) INTO ttqs_documents_count 
    FROM ttqs_documents 
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ttqs_documents');
    
    -- 檢查遷移後的記錄數
    SELECT COUNT(*) INTO uploaded_files_count FROM uploaded_files;
    
    -- 記錄驗證結果
    INSERT INTO migration_log (migration_name, executed_at, description) 
    VALUES (
        '015_cleanup_verification', 
        CURRENT_TIMESTAMP, 
        FORMAT('遷移驗證 - documents: %s, ttqs_documents: %s, uploaded_files: %s', 
               documents_count, ttqs_documents_count, uploaded_files_count)
    );
    
    -- 如果記錄數不匹配，記錄警告
    IF uploaded_files_count < documents_count THEN
        INSERT INTO migration_log (migration_name, executed_at, description) 
        VALUES (
            '015_cleanup_warning', 
            CURRENT_TIMESTAMP, 
            '警告：uploaded_files 記錄數少於原始 documents 表，請檢查遷移'
        );
        migration_success := false;
    END IF;
    
    RAISE NOTICE '數據驗證完成 - documents: %, ttqs_documents: %, uploaded_files: %', 
                 documents_count, ttqs_documents_count, uploaded_files_count;
END $$;

-- 第二步：創建備份表（安全措施）
-- Step 2: Create backup tables (safety measure)

-- 備份 documents 表
CREATE TABLE IF NOT EXISTS documents_backup_20241028 AS 
SELECT *, CURRENT_TIMESTAMP as backup_created_at FROM documents;

-- 備份 ttqs_documents 表（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ttqs_documents') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS ttqs_documents_backup_20241028 AS 
                 SELECT *, CURRENT_TIMESTAMP as backup_created_at FROM ttqs_documents';
    END IF;
END $$;

-- 第三步：移除外鍵約束（如果存在）
-- Step 3: Remove foreign key constraints (if any)

-- 查找並移除指向 documents 表的外鍵
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT 
            tc.constraint_name,
            tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'documents'
    LOOP
        EXECUTE FORMAT('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        
        INSERT INTO migration_log (migration_name, executed_at, description) 
        VALUES (
            '015_cleanup_fk_removal', 
            CURRENT_TIMESTAMP, 
            FORMAT('移除外鍵約束: %s.%s', 
                   constraint_record.table_name, 
                   constraint_record.constraint_name)
        );
    END LOOP;
END $$;

-- 第四步：刪除視圖（如果存在）
-- Step 4: Drop views (if any)

DROP VIEW IF EXISTS documents_view CASCADE;
DROP VIEW IF EXISTS ttqs_documents_view CASCADE;

-- 第五步：刪除舊表
-- Step 5: Drop old tables

-- 刪除 documents 表
DROP TABLE IF EXISTS documents CASCADE;

-- 刪除 ttqs_documents 表（如果存在）
DROP TABLE IF EXISTS ttqs_documents CASCADE;

-- 第六步：清理相關索引和觸發器
-- Step 6: Cleanup related indexes and triggers

-- 這些應該已經隨著表一起被刪除，但為了確保：
DROP INDEX IF EXISTS idx_documents_category;
DROP INDEX IF EXISTS idx_documents_public;
DROP INDEX IF EXISTS idx_documents_uploaded_by;
DROP INDEX IF EXISTS idx_documents_created_at;
DROP INDEX IF EXISTS idx_documents_file_type;
DROP INDEX IF EXISTS idx_documents_public_category;

-- 第七步：更新統計信息
-- Step 7: Update statistics

ANALYZE uploaded_files;

-- 第八步：記錄清理完成
-- Step 8: Log cleanup completion

INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '015_cleanup_completed', 
    CURRENT_TIMESTAMP, 
    '文件管理系統整合完成 - 已刪除 documents 和 ttqs_documents 表，統一使用 uploaded_files'
);

-- 第九步：顯示清理摘要
-- Step 9: Display cleanup summary

DO $$
DECLARE
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM uploaded_files;
    
    RAISE NOTICE '=== 文件管理系統整合完成 ===';
    RAISE NOTICE '統一文件表記錄數: %', final_count;
    RAISE NOTICE '備份表已創建: documents_backup_20241028, ttqs_documents_backup_20241028';
    RAISE NOTICE '舊表已刪除: documents, ttqs_documents';
    RAISE NOTICE '請測試文件上傳和管理功能';
END $$;

-- 添加表註釋更新
COMMENT ON TABLE uploaded_files IS '統一文件管理表 - 已整合 documents 和 ttqs_documents 功能 (2024-10-28)';

-- 創建新的分類枚舉約束
ALTER TABLE uploaded_files DROP CONSTRAINT IF EXISTS check_category_values;
ALTER TABLE uploaded_files ADD CONSTRAINT check_category_values 
CHECK (category IN ('general', 'course_materials', 'user_avatars', 'documents', 'images', 'videos', 'ttqs'));

COMMENT ON CONSTRAINT check_category_values ON uploaded_files IS '文件分類約束：general(一般), course_materials(課程資料), user_avatars(用戶頭像), documents(文檔), images(圖片), videos(視頻), ttqs(TTQS文件)';