-- 清理未使用的 TTQS 評估表
-- Cleanup Unused TTQS Evaluation Tables

-- ⚠️ 警告：此腳本會刪除 TTQS 四層評估表，這些表在代碼中未被使用
-- WARNING: This script will drop TTQS four-level evaluation tables that are not used in the codebase

-- ============================================================================
-- 驗證階段 - Verification Phase
-- ============================================================================

DO $verification$
DECLARE
    reaction_count INTEGER;
    learning_count INTEGER;
    behavior_count INTEGER;
    result_count INTEGER;
    total_records INTEGER := 0;
    tables_exist BOOLEAN := false;
BEGIN
    -- 檢查各評估表的記錄數
    SELECT COALESCE((SELECT COUNT(*) FROM reaction_evaluations WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reaction_evaluations')), 0) INTO reaction_count;
    SELECT COALESCE((SELECT COUNT(*) FROM learning_evaluations WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_evaluations')), 0) INTO learning_count;
    SELECT COALESCE((SELECT COUNT(*) FROM behavior_evaluations WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'behavior_evaluations')), 0) INTO behavior_count;
    SELECT COALESCE((SELECT COUNT(*) FROM result_evaluations WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'result_evaluations')), 0) INTO result_count;
    
    total_records := reaction_count + learning_count + behavior_count + result_count;
    
    -- 檢查表是否存在
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name IN ('reaction_evaluations', 'learning_evaluations', 'behavior_evaluations', 'result_evaluations')
        AND table_schema = 'public'
    ) INTO tables_exist;
    
    -- 記錄驗證結果
    INSERT INTO migration_log (migration_name, executed_at, description) 
    VALUES (
        '018_cleanup_verification', 
        CURRENT_TIMESTAMP, 
        FORMAT('清理前驗證 - reaction: %s, learning: %s, behavior: %s, result: %s, total: %s, tables_exist: %s', 
               reaction_count, learning_count, behavior_count, result_count, total_records, tables_exist)
    );
    
    -- 如果有數據，發出警告
    IF total_records > 0 THEN
        RAISE WARNING '警告：發現 % 條評估記錄，將在清理過程中刪除', total_records;
    END IF;
    
    -- 如果表不存在，記錄信息
    IF NOT tables_exist THEN
        RAISE NOTICE '信息：TTQS 評估表不存在，跳過清理';
    ELSE
        RAISE NOTICE '信息：開始清理 TTQS 評估表';
    END IF;
END $verification$;

-- ============================================================================
-- 備份階段 - Backup Phase (如果有數據)
-- ============================================================================

-- 創建備份表（如果原表存在且有數據）
DO $backup$
DECLARE
    table_name TEXT;
    backup_suffix TEXT := '_backup_' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD_HH24MI');
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['reaction_evaluations', 'learning_evaluations', 'behavior_evaluations', 'result_evaluations'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            EXECUTE format('CREATE TABLE IF NOT EXISTS %I AS SELECT *, CURRENT_TIMESTAMP as backup_created_at FROM %I WHERE EXISTS (SELECT 1 FROM %I LIMIT 1)', 
                          table_name || backup_suffix, table_name, table_name);
            RAISE NOTICE '已創建備份表: %', table_name || backup_suffix;
        END IF;
    END LOOP;
END $backup$;

-- ============================================================================
-- 清理階段 - Cleanup Phase
-- ============================================================================

-- 1. 刪除相關的觸發器
DROP TRIGGER IF EXISTS update_result_evaluations_updated_at ON result_evaluations;

-- 2. 刪除相關的視圖（如果存在）
DROP VIEW IF EXISTS reaction_evaluations_view CASCADE;
DROP VIEW IF EXISTS learning_evaluations_view CASCADE;
DROP VIEW IF EXISTS behavior_evaluations_view CASCADE;
DROP VIEW IF EXISTS result_evaluations_view CASCADE;
DROP VIEW IF EXISTS ttqs_evaluations_summary CASCADE;
DROP VIEW IF EXISTS instructor_ratings_unified CASCADE; -- 這個視圖引用了評估表

-- 3. 刪除相關的索引
DROP INDEX IF EXISTS idx_reaction_evaluations_execution;
DROP INDEX IF EXISTS idx_reaction_evaluations_user;
DROP INDEX IF EXISTS idx_reaction_evaluations_created_at;

DROP INDEX IF EXISTS idx_learning_evaluations_execution;
DROP INDEX IF EXISTS idx_learning_evaluations_user;
DROP INDEX IF EXISTS idx_learning_evaluations_created_at;

DROP INDEX IF EXISTS idx_behavior_evaluations_execution;
DROP INDEX IF EXISTS idx_behavior_evaluations_user;
DROP INDEX IF EXISTS idx_behavior_evaluations_evaluator;
DROP INDEX IF EXISTS idx_behavior_evaluations_created_at;

DROP INDEX IF EXISTS idx_result_evaluations_execution;
DROP INDEX IF EXISTS idx_result_evaluations_user;
DROP INDEX IF EXISTS idx_result_evaluations_employment_status;
DROP INDEX IF EXISTS idx_result_evaluations_created_at;

-- 4. 刪除評估表（按依賴順序）
DROP TABLE IF EXISTS result_evaluations CASCADE;
DROP TABLE IF EXISTS behavior_evaluations CASCADE;
DROP TABLE IF EXISTS learning_evaluations CASCADE;
DROP TABLE IF EXISTS reaction_evaluations CASCADE;

-- 5. 刪除相關的序列
DROP SEQUENCE IF EXISTS reaction_evaluations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS learning_evaluations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS behavior_evaluations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS result_evaluations_id_seq CASCADE;

-- 6. 清理相關的權限（如果有設置）
-- REVOKE ALL ON reaction_evaluations FROM some_user;
-- REVOKE ALL ON learning_evaluations FROM some_user;
-- REVOKE ALL ON behavior_evaluations FROM some_user;
-- REVOKE ALL ON result_evaluations FROM some_user;

-- ============================================================================
-- 驗證清理結果 - Verify Cleanup Results
-- ============================================================================

DO $final_verification$
DECLARE
    remaining_tables TEXT[];
    remaining_indexes TEXT[];
    remaining_sequences TEXT[];
BEGIN
    -- 檢查剩餘的評估表
    SELECT array_agg(table_name) INTO remaining_tables
    FROM information_schema.tables 
    WHERE table_name IN ('reaction_evaluations', 'learning_evaluations', 'behavior_evaluations', 'result_evaluations')
    AND table_schema = 'public';
    
    -- 檢查剩餘的相關索引
    SELECT array_agg(indexname) INTO remaining_indexes
    FROM pg_indexes 
    WHERE indexname LIKE '%evaluations%'
    AND schemaname = 'public';
    
    -- 檢查剩餘的相關序列
    SELECT array_agg(sequence_name) INTO remaining_sequences
    FROM information_schema.sequences 
    WHERE sequence_name LIKE '%evaluations%'
    AND sequence_schema = 'public';
    
    -- 記錄清理結果
    INSERT INTO migration_log (migration_name, executed_at, description) 
    VALUES (
        '018_cleanup_completed', 
        CURRENT_TIMESTAMP, 
        FORMAT('TTQS 評估表清理完成 - 剩餘表: %s, 剩餘索引: %s, 剩餘序列: %s', 
               COALESCE(array_to_string(remaining_tables, ', '), '無'),
               COALESCE(array_to_string(remaining_indexes, ', '), '無'),
               COALESCE(array_to_string(remaining_sequences, ', '), '無'))
    );
    
    -- 顯示清理摘要
    RAISE NOTICE '=== TTQS 評估表清理完成 ===';
    RAISE NOTICE '已刪除表: reaction_evaluations, learning_evaluations, behavior_evaluations, result_evaluations';
    RAISE NOTICE '已刪除相關索引和序列';
    RAISE NOTICE '剩餘表: %', COALESCE(array_to_string(remaining_tables, ', '), '無');
    RAISE NOTICE '剩餘索引: %', COALESCE(array_to_string(remaining_indexes, ', '), '無');
    RAISE NOTICE '剩餘序列: %', COALESCE(array_to_string(remaining_sequences, ', '), '無');
    
    -- 如果還有剩餘項目，發出警告
    IF remaining_tables IS NOT NULL OR remaining_indexes IS NOT NULL OR remaining_sequences IS NOT NULL THEN
        RAISE WARNING '警告：仍有相關對象未清理完成，請手動檢查';
    ELSE
        RAISE NOTICE '✅ 所有 TTQS 評估表及相關對象已成功清理';
    END IF;
END $final_verification$;

-- ============================================================================
-- 更新相關代碼提醒 - Code Update Reminders
-- ============================================================================

DO $code_cleanup_reminder$
BEGIN
    RAISE NOTICE '=== 代碼清理提醒 ===';
    RAISE NOTICE '請手動清理以下文件中的相關代碼：';
    RAISE NOTICE '1. src/api/evaluation-routes.ts - 刪除整個文件';
    RAISE NOTICE '2. src/database/migrations/016_comprehensive_database_optimization.sql - 移除 instructor_ratings_unified 視圖';
    RAISE NOTICE '3. 檢查其他可能引用這些表的代碼';
    RAISE NOTICE '4. 更新 docs/DATABASE_REDUNDANCY_ANALYSIS.md 文檔';
END $code_cleanup_reminder$;

-- 記錄遷移完成
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '018_cleanup_unused_ttqs_evaluations', 
    CURRENT_TIMESTAMP, 
    '成功清理未使用的 TTQS 四層評估表：reaction_evaluations, learning_evaluations, behavior_evaluations, result_evaluations'
);