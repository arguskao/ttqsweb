-- 清理所有冗餘表 - 第二階段
-- Cleanup All Redundant Tables - Phase 2

-- ⚠️ 警告：此腳本會刪除多個舊表，請確保數據已成功遷移並經過測試
-- WARNING: This script will drop multiple old tables, ensure data migration is successful and tested

-- ============================================================================
-- 驗證階段 - Verification Phase
-- ============================================================================

DO $$
DECLARE
    documents_count INTEGER;
    ttqs_documents_count INTEGER;
    instructor_apps_count INTEGER;
    instructor_dev_count INTEGER;
    instructor_ratings_count INTEGER;
    migration_success BOOLEAN := true;
    error_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 檢查主表記錄數
    SELECT COUNT(*) INTO documents_count FROM documents;
    SELECT COUNT(*) INTO instructor_apps_count FROM instructor_applications;
    
    -- 檢查要刪除的表記錄數
    SELECT COALESCE((SELECT COUNT(*) FROM ttqs_documents WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ttqs_documents')), 0) INTO ttqs_documents_count;
    SELECT COALESCE((SELECT COUNT(*) FROM instructor_development WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructor_development')), 0) INTO instructor_dev_count;
    SELECT COALESCE((SELECT COUNT(*) FROM instructor_ratings WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructor_ratings')), 0) INTO instructor_ratings_count;
    
    -- 驗證 TTQS 文件遷移
    IF ttqs_documents_count > 0 THEN
        IF (SELECT COUNT(*) FROM documents WHERE category = 'ttqs') < ttqs_documents_count THEN
            error_messages := array_append(error_messages, 'TTQS 文件遷移不完整');
            migration_success := false;
        END IF;
    END IF;
    
    -- 驗證講師發展記錄遷移
    IF instructor_dev_count > 0 THEN
        IF (SELECT COUNT(*) FROM instructor_applications WHERE current_stage IS NOT NULL) < instructor_dev_count THEN
            error_messages := array_append(error_messages, '講師發展記錄遷移不完整');
            migration_success := false;
        END IF;
    END IF;
    
    -- 記錄驗證結果
    INSERT INTO migration_log (migration_name, executed_at, description) 
    VALUES (
        '017_cleanup_verification', 
        CURRENT_TIMESTAMP, 
        FORMAT('清理前驗證 - documents: %s, ttqs_documents: %s, instructor_apps: %s, instructor_dev: %s, instructor_ratings: %s', 
               documents_count, ttqs_documents_count, instructor_apps_count, instructor_dev_count, instructor_ratings_count)
    );
    
    -- 如果驗證失敗，記錄錯誤
    IF NOT migration_success THEN
        INSERT INTO migration_log (migration_name, executed_at, description) 
        VALUES (
            '017_cleanup_errors', 
            CURRENT_TIMESTAMP, 
            '驗證失敗: ' || array_to_string(error_messages, ', ')
        );
        RAISE EXCEPTION '數據遷移驗證失敗: %', array_to_string(error_messages, ', ');
    END IF;
    
    RAISE NOTICE '數據驗證通過 - 可以安全執行清理';
END $$;

-- ============================================================================
-- 外鍵約束處理 - Foreign Key Constraints Handling
-- ============================================================================

-- 移除指向即將刪除表的外鍵約束
DO $$
DECLARE
    constraint_record RECORD;
    tables_to_drop TEXT[] := ARRAY['ttqs_documents', 'instructor_development', 'instructor_ratings', 'uploaded_files'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables_to_drop
    LOOP
        -- 查找並移除指向該表的外鍵
        FOR constraint_record IN
            SELECT 
                tc.constraint_name,
                tc.table_name as referencing_table
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = table_name
        LOOP
            EXECUTE FORMAT('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                          constraint_record.referencing_table, 
                          constraint_record.constraint_name);
            
            INSERT INTO migration_log (migration_name, executed_at, description) 
            VALUES (
                '017_fk_removal', 
                CURRENT_TIMESTAMP, 
                FORMAT('移除外鍵約束: %s.%s -> %s', 
                       constraint_record.referencing_table, 
                       constraint_record.constraint_name,
                       table_name)
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 視圖清理 - Views Cleanup
-- ============================================================================

-- 刪除可能依賴舊表的視圖
DROP VIEW IF EXISTS ttqs_documents_view CASCADE;
DROP VIEW IF EXISTS instructor_development_view CASCADE;
DROP VIEW IF EXISTS instructor_ratings_view CASCADE;
DROP VIEW IF EXISTS uploaded_files_view CASCADE;

-- ============================================================================
-- 表清理 - Tables Cleanup
-- ============================================================================

-- 刪除 TTQS 文件表
DROP TABLE IF EXISTS ttqs_documents CASCADE;

-- 刪除講師發展表
DROP TABLE IF EXISTS instructor_development CASCADE;

-- 刪除講師評分表（簡單版本，TTQS 評分保留）
DROP TABLE IF EXISTS instructor_ratings CASCADE;

-- 刪除上傳文件表（如果存在且已遷移到 documents）
DROP TABLE IF EXISTS uploaded_files CASCADE;

-- ============================================================================
-- 索引清理 - Index Cleanup
-- ============================================================================

-- 清理可能殘留的索引
DROP INDEX IF EXISTS idx_ttqs_documents_plan_id;
DROP INDEX IF EXISTS idx_ttqs_documents_uploaded_by;
DROP INDEX IF EXISTS idx_ttqs_documents_created_at;

DROP INDEX IF EXISTS idx_instructor_development_user_id;
DROP INDEX IF EXISTS idx_instructor_development_current_stage;
DROP INDEX IF EXISTS idx_instructor_development_last_updated;

DROP INDEX IF EXISTS idx_instructor_ratings_instructor_id;
DROP INDEX IF EXISTS idx_instructor_ratings_rating;
DROP INDEX IF EXISTS idx_instructor_ratings_created_at;

DROP INDEX IF EXISTS idx_uploaded_files_category;
DROP INDEX IF EXISTS idx_uploaded_files_uploaded_by;
DROP INDEX IF EXISTS idx_uploaded_files_created_at;

-- ============================================================================
-- 函數清理 - Functions Cleanup
-- ============================================================================

-- 清理可能相關的觸發器函數
DROP FUNCTION IF EXISTS update_instructor_development_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_uploaded_files_updated_at() CASCADE;

-- ============================================================================
-- 序列清理 - Sequences Cleanup
-- ============================================================================

-- 清理相關序列（如果存在）
DROP SEQUENCE IF EXISTS ttqs_documents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS instructor_development_id_seq CASCADE;
DROP SEQUENCE IF EXISTS instructor_ratings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS uploaded_files_id_seq CASCADE;

-- ============================================================================
-- 權限清理 - Permissions Cleanup
-- ============================================================================

-- 撤銷可能的表權限（如果有特定用戶）
-- REVOKE ALL ON ttqs_documents FROM some_user;
-- REVOKE ALL ON instructor_development FROM some_user;
-- REVOKE ALL ON instructor_ratings FROM some_user;
-- REVOKE ALL ON uploaded_files FROM some_user;

-- ============================================================================
-- 統計更新 - Statistics Update
-- ============================================================================

-- 更新統計信息
ANALYZE documents;
ANALYZE instructor_applications;

-- ============================================================================
-- 最終驗證 - Final Verification
-- ============================================================================

DO $$
DECLARE
    remaining_tables TEXT[];
    final_documents_count INTEGER;
    final_instructor_apps_count INTEGER;
BEGIN
    -- 檢查是否還有殘留表
    SELECT array_agg(table_name) INTO remaining_tables
    FROM information_schema.tables 
    WHERE table_name IN ('ttqs_documents', 'instructor_development', 'instructor_ratings', 'uploaded_files')
    AND table_schema = 'public';
    
    -- 獲取最終統計
    SELECT COUNT(*) INTO final_documents_count FROM documents;
    SELECT COUNT(*) INTO final_instructor_apps_count FROM instructor_applications;
    
    -- 記錄清理結果
    INSERT INTO migration_log (migration_name, executed_at, description) 
    VALUES (
        '017_cleanup_completed', 
        CURRENT_TIMESTAMP, 
        FORMAT('清理完成 - 剩餘表: %s, documents: %s, instructor_applications: %s', 
               COALESCE(array_to_string(remaining_tables, ', '), '無'), 
               final_documents_count, 
               final_instructor_apps_count)
    );
    
    -- 顯示清理摘要
    RAISE NOTICE '=== 資料庫清理完成 ===';
    RAISE NOTICE '已刪除表: ttqs_documents, instructor_development, instructor_ratings, uploaded_files';
    RAISE NOTICE '剩餘表: %', COALESCE(array_to_string(remaining_tables, ', '), '無');
    RAISE NOTICE 'documents 表記錄數: %', final_documents_count;
    RAISE NOTICE 'instructor_applications 表記錄數: %', final_instructor_apps_count;
    RAISE NOTICE '備份表已保留，可在確認無問題後手動刪除';
END $$;

-- ============================================================================
-- 更新表註釋 - Update Table Comments
-- ============================================================================

COMMENT ON TABLE documents IS '統一文件管理表 - 已整合所有文件管理功能 (清理完成 2024-10-28)';
COMMENT ON TABLE instructor_applications IS '講師管理表 - 已整合申請、發展、評分功能 (清理完成 2024-10-28)';

-- ============================================================================
-- 創建清理後的約束 - Post-Cleanup Constraints
-- ============================================================================

-- 確保數據完整性
ALTER TABLE documents ADD CONSTRAINT IF NOT EXISTS documents_file_url_not_empty 
CHECK (file_url IS NOT NULL AND file_url != '');

ALTER TABLE instructor_applications ADD CONSTRAINT IF NOT EXISTS instructor_apps_user_id_unique 
UNIQUE (user_id);

-- ============================================================================
-- 性能優化建議 - Performance Optimization Recommendations
-- ============================================================================

-- 重建統計信息
VACUUM ANALYZE documents;
VACUUM ANALYZE instructor_applications;

-- 記錄優化建議
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '017_optimization_recommendations', 
    CURRENT_TIMESTAMP, 
    '建議：1. 監控查詢性能 2. 定期 VACUUM ANALYZE 3. 檢查索引使用情況 4. 一週後可刪除備份表'
);

RAISE NOTICE '清理完成！建議監控系統性能並在一週後刪除備份表。';