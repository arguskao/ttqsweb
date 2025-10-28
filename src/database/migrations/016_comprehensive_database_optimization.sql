-- 綜合資料庫優化 - 處理所有冗餘問題
-- Comprehensive Database Optimization - Handle All Redundancy Issues

-- ============================================================================
-- Phase 1: 文件管理系統統一 (高優先級)
-- Phase 1: Unify File Management System (High Priority)
-- ============================================================================

-- 1.1 將 ttqs_documents 數據遷移到 documents 表
INSERT INTO documents (
    title, 
    description, 
    file_url, 
    file_type, 
    file_size, 
    category, 
    uploaded_by, 
    created_at
)
SELECT 
    title,
    CONCAT('TTQS文件 - ', COALESCE(description, title)) as description,
    file_url,
    COALESCE(document_type, 'application/pdf') as file_type,
    COALESCE(file_size, 0) as file_size,
    'ttqs' as category,
    uploaded_by,
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM ttqs_documents
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ttqs_documents')
AND NOT EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.file_url = ttqs_documents.file_url
);

-- 1.2 擴展 documents 表以支持更多功能（如果欄位不存在）
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 1.3 更新現有記錄的新欄位
UPDATE documents 
SET 
    original_name = title,
    file_path = CONCAT('legacy/', category, '/', id, '_', REPLACE(title, ' ', '_')),
    is_active = COALESCE(is_public, true)
WHERE original_name IS NULL;

-- 1.4 創建 documents 表的更新觸發器
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- ============================================================================
-- Phase 2: 講師管理系統整合 (中優先級)
-- Phase 2: Integrate Instructor Management System (Medium Priority)
-- ============================================================================

-- 2.1 擴展 instructor_applications 表以整合 instructor_development 功能
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) DEFAULT 'application';
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS teaching_hours INTEGER DEFAULT 0;
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS student_rating DECIMAL(3,2);
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS development_notes TEXT;
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS last_evaluation_date TIMESTAMP;
ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS next_milestone VARCHAR(255);

-- 2.2 遷移 instructor_development 數據到 instructor_applications
UPDATE instructor_applications 
SET 
    current_stage = COALESCE(id.current_stage, 'application'),
    teaching_hours = COALESCE(id.teaching_hours, 0),
    student_rating = id.average_rating,
    development_notes = id.notes,
    last_evaluation_date = id.last_updated,
    next_milestone = id.next_milestone
FROM instructor_development id
WHERE instructor_applications.user_id = id.user_id
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructor_development');

-- ============================================================================
-- Phase 3: 評分系統優化 (低優先級)
-- Phase 3: Optimize Rating System (Low Priority)
-- ============================================================================

-- 3.1 創建統一評分視圖
CREATE OR REPLACE VIEW instructor_ratings_unified AS
SELECT 
    ia.user_id,
    ia.user_id as instructor_id,
    COALESCE(ia.student_rating, ir.rating) as overall_rating,
    ir.comment,
    ir.rated_by,
    COALESCE(ir.created_at, ia.updated_at) as rating_date,
    'general' as rating_type
FROM instructor_applications ia
LEFT JOIN instructor_ratings ir ON ia.user_id = ir.instructor_id
WHERE ia.status = 'approved'

UNION ALL

SELECT 
    tp.instructor_id as user_id,
    tp.instructor_id,
    (re.satisfaction_score + le.knowledge_gain + be.skill_improvement + res.goal_achievement) / 4.0 as overall_rating,
    CONCAT('TTQS評估 - ', tp.title) as comment,
    tp.created_by as rated_by,
    GREATEST(re.created_at, le.created_at, be.created_at, res.created_at) as rating_date,
    'ttqs' as rating_type
FROM training_plans tp
LEFT JOIN reaction_evaluations re ON tp.id = re.plan_id
LEFT JOIN learning_evaluations le ON tp.id = le.plan_id
LEFT JOIN behavior_evaluations be ON tp.id = be.plan_id
LEFT JOIN result_evaluations res ON tp.id = res.plan_id
WHERE tp.instructor_id IS NOT NULL
AND (re.id IS NOT NULL OR le.id IS NOT NULL OR be.id IS NOT NULL OR res.id IS NOT NULL);

-- ============================================================================
-- Phase 4: 索引優化
-- Phase 4: Index Optimization
-- ============================================================================

-- 4.1 為新增欄位創建索引
CREATE INDEX IF NOT EXISTS idx_documents_original_name ON documents(original_name);
CREATE INDEX IF NOT EXISTS idx_documents_file_path ON documents(file_path);
CREATE INDEX IF NOT EXISTS idx_documents_is_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);

CREATE INDEX IF NOT EXISTS idx_instructor_applications_current_stage ON instructor_applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_teaching_hours ON instructor_applications(teaching_hours);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_student_rating ON instructor_applications(student_rating);

-- 4.2 優化現有索引
DROP INDEX IF EXISTS idx_documents_public_category;
CREATE INDEX IF NOT EXISTS idx_documents_active_category ON documents(is_active, category) WHERE is_active = true;

-- ============================================================================
-- Phase 5: 數據完整性檢查
-- Phase 5: Data Integrity Checks
-- ============================================================================

-- 5.1 添加約束
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_documents_category;
ALTER TABLE documents ADD CONSTRAINT check_documents_category 
CHECK (category IN ('general', 'course_materials', 'user_avatars', 'documents', 'images', 'videos', 'ttqs'));

ALTER TABLE instructor_applications DROP CONSTRAINT IF EXISTS check_current_stage;
ALTER TABLE instructor_applications ADD CONSTRAINT check_current_stage 
CHECK (current_stage IN ('application', 'review', 'interview', 'training', 'probation', 'certified', 'advanced'));

ALTER TABLE instructor_applications DROP CONSTRAINT IF EXISTS check_student_rating_range;
ALTER TABLE instructor_applications ADD CONSTRAINT check_student_rating_range 
CHECK (student_rating IS NULL OR (student_rating >= 0 AND student_rating <= 5));

-- ============================================================================
-- Phase 6: 創建向後兼容視圖
-- Phase 6: Create Backward Compatibility Views
-- ============================================================================

-- 6.1 為 ttqs_documents 創建視圖
CREATE OR REPLACE VIEW ttqs_documents_legacy AS
SELECT 
    id,
    title,
    description,
    file_url,
    file_size,
    file_type as document_type,
    uploaded_by,
    created_at
FROM documents
WHERE category = 'ttqs';

-- 6.2 為 instructor_development 創建視圖
CREATE OR REPLACE VIEW instructor_development_legacy AS
SELECT 
    user_id,
    current_stage,
    teaching_hours,
    student_rating as average_rating,
    development_notes as notes,
    last_evaluation_date as last_updated,
    next_milestone,
    updated_at as created_at
FROM instructor_applications
WHERE current_stage IS NOT NULL;

-- ============================================================================
-- Phase 7: 清理準備
-- Phase 7: Cleanup Preparation
-- ============================================================================

-- 7.1 創建備份表
CREATE TABLE IF NOT EXISTS ttqs_documents_backup_20241028 AS 
SELECT *, CURRENT_TIMESTAMP as backup_created_at 
FROM ttqs_documents
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ttqs_documents');

CREATE TABLE IF NOT EXISTS instructor_development_backup_20241028 AS 
SELECT *, CURRENT_TIMESTAMP as backup_created_at 
FROM instructor_development
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructor_development');

CREATE TABLE IF NOT EXISTS instructor_ratings_backup_20241028 AS 
SELECT *, CURRENT_TIMESTAMP as backup_created_at 
FROM instructor_ratings
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructor_ratings');

-- ============================================================================
-- Phase 8: 記錄和註釋
-- Phase 8: Logging and Comments
-- ============================================================================

-- 8.1 更新表註釋
COMMENT ON TABLE documents IS '統一文件管理表 - 整合了 ttqs_documents 功能 (2024-10-28)';
COMMENT ON COLUMN documents.original_name IS '原始文件名';
COMMENT ON COLUMN documents.file_path IS '文件存儲路徑';
COMMENT ON COLUMN documents.is_active IS '是否啟用（替代 is_public）';

COMMENT ON TABLE instructor_applications IS '講師申請和發展管理表 - 整合了 instructor_development 功能 (2024-10-28)';
COMMENT ON COLUMN instructor_applications.current_stage IS '當前發展階段';
COMMENT ON COLUMN instructor_applications.teaching_hours IS '累計教學時數';
COMMENT ON COLUMN instructor_applications.student_rating IS '學生評分平均';
COMMENT ON COLUMN instructor_applications.certifications IS '獲得的認證';
COMMENT ON COLUMN instructor_applications.development_notes IS '發展記錄';

-- 8.2 記錄遷移日誌
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '016_comprehensive_optimization', 
    CURRENT_TIMESTAMP, 
    '綜合資料庫優化：統一文件管理、整合講師系統、優化評分系統'
) ON CONFLICT (migration_name) DO NOTHING;

-- 8.3 統計信息
DO $$
DECLARE
    documents_count INTEGER;
    instructor_apps_count INTEGER;
    ttqs_migrated INTEGER;
    instructor_dev_migrated INTEGER;
BEGIN
    SELECT COUNT(*) INTO documents_count FROM documents;
    SELECT COUNT(*) INTO instructor_apps_count FROM instructor_applications;
    SELECT COUNT(*) INTO ttqs_migrated FROM documents WHERE category = 'ttqs';
    SELECT COUNT(*) INTO instructor_dev_migrated FROM instructor_applications WHERE current_stage IS NOT NULL;
    
    INSERT INTO migration_log (migration_name, executed_at, description) 
    VALUES (
        '016_optimization_stats', 
        CURRENT_TIMESTAMP, 
        FORMAT('優化統計 - documents: %s, instructor_applications: %s, ttqs_migrated: %s, instructor_dev_migrated: %s', 
               documents_count, instructor_apps_count, ttqs_migrated, instructor_dev_migrated)
    );
    
    RAISE NOTICE '=== 資料庫優化完成 ===';
    RAISE NOTICE 'documents 表記錄數: %', documents_count;
    RAISE NOTICE 'instructor_applications 表記錄數: %', instructor_apps_count;
    RAISE NOTICE 'TTQS 文件遷移數: %', ttqs_migrated;
    RAISE NOTICE '講師發展記錄遷移數: %', instructor_dev_migrated;
END $$;