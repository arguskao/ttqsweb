-- 清理未使用索引的SQL腳本
-- Cleanup Unused Indexes SQL Script

-- ⚠️ 警告：請在非高峰期執行，並確保有完整備份
-- WARNING: Execute during off-peak hours with full backup

BEGIN;

-- 記錄清理開始
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    'index_cleanup_unused', 
    CURRENT_TIMESTAMP, 
    '開始清理未使用的索引以優化數據庫性能'
);

-- 1. 刪除完全未使用的索引 (idx_scan = 0)
DROP INDEX IF EXISTS idx_experience_shares_author;
DROP INDEX IF EXISTS job_applications_job_id_applicant_id_key;
DROP INDEX IF EXISTS idx_applications_job;
DROP INDEX IF EXISTS idx_applications_applicant;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_applications_date;
DROP INDEX IF EXISTS idx_applications_applicant_status;
DROP INDEX IF EXISTS idx_training_plans_status;
DROP INDEX IF EXISTS idx_training_executions_plan;
DROP INDEX IF EXISTS idx_improvement_actions_plan;
DROP INDEX IF EXISTS group_members_group_id_user_id_key;
DROP INDEX IF EXISTS idx_group_members_user;
DROP INDEX IF EXISTS idx_forum_topics_author;
DROP INDEX IF EXISTS idx_venue_bookings_user;
DROP INDEX IF EXISTS idx_venue_bookings_venue;
DROP INDEX IF EXISTS idx_venue_bookings_date;
DROP INDEX IF EXISTS idx_retraining_recommendations_user;
DROP INDEX IF EXISTS idx_instructor_applications_rating;
DROP INDEX IF EXISTS idx_instructor_applications_active;
DROP INDEX IF EXISTS idx_instructor_applications_approved_active;
DROP INDEX IF EXISTS idx_file_categories_key;
DROP INDEX IF EXISTS idx_file_categories_active;
DROP INDEX IF EXISTS idx_file_categories_order;
DROP INDEX IF EXISTS course_enrollments_user_id_course_id_key;
DROP INDEX IF EXISTS idx_enrollments_user;
DROP INDEX IF EXISTS idx_enrollments_status;
DROP INDEX IF EXISTS idx_enrollments_enrollment_date;
DROP INDEX IF EXISTS idx_enrollments_completion_date;
DROP INDEX IF EXISTS idx_enrollments_user_course;

-- 2. 檢查並記錄清理結果
DO $$
DECLARE
    remaining_unused_indexes INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_unused_indexes
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0;
    
    INSERT INTO migration_log (migration_name, executed_at, description) 
    VALUES (
        'index_cleanup_completed', 
        CURRENT_TIMESTAMP, 
        FORMAT('索引清理完成，剩餘未使用索引: %s 個', remaining_unused_indexes)
    );
    
    RAISE NOTICE '索引清理完成，剩餘未使用索引: % 個', remaining_unused_indexes;
END $$;

-- 3. 更新統計信息
ANALYZE;

COMMIT;

-- 顯示清理摘要
SELECT 
    'Index Cleanup Summary' as action,
    COUNT(*) as remaining_indexes,
    SUM(CASE WHEN idx_scan = 0 THEN 1 ELSE 0 END) as unused_indexes,
    SUM(CASE WHEN idx_scan > 0 THEN 1 ELSE 0 END) as used_indexes
FROM pg_stat_user_indexes;