-- 講師表重構方案 - 完整版
-- 統一使用 instructor_applications 表，移除 instructors 表的依賴

-- 1. 添加缺失的字段到 instructor_applications 表
ALTER TABLE instructor_applications 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. 如果 instructors 表存在，遷移數據
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instructors') THEN
        -- 更新 instructor_applications 表中的評分數據
        UPDATE instructor_applications ia
        SET 
            average_rating = COALESCE(i.average_rating, 0),
            total_ratings = COALESCE(i.total_ratings, 0),
            is_active = COALESCE(i.is_active, true)
        FROM instructors i
        WHERE ia.user_id = i.user_id AND ia.status = 'approved';
        
        RAISE NOTICE '數據遷移完成：instructor_applications 表已更新';
    END IF;
END $$;

-- 3. 更新 instructor_ratings 表結構（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instructor_ratings') THEN
        -- 添加新的外鍵字段
        ALTER TABLE instructor_ratings 
        ADD COLUMN IF NOT EXISTS instructor_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        
        -- 遷移數據：將 instructor_id 轉換為 user_id
        UPDATE instructor_ratings ir
        SET instructor_user_id = i.user_id
        FROM instructors i
        WHERE ir.instructor_id = i.id AND ir.instructor_user_id IS NULL;
        
        -- 創建新索引
        CREATE INDEX IF NOT EXISTS idx_instructor_ratings_instructor_user ON instructor_ratings(instructor_user_id);
        
        RAISE NOTICE 'instructor_ratings 表結構已更新';
    ELSE
        -- 如果不存在，創建新的評分表
        CREATE TABLE instructor_ratings (
            id SERIAL PRIMARY KEY,
            instructor_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(instructor_user_id, student_id, course_id)
        );
        
        CREATE INDEX idx_instructor_ratings_instructor_user ON instructor_ratings(instructor_user_id);
        CREATE INDEX idx_instructor_ratings_student ON instructor_ratings(student_id);
        
        RAISE NOTICE 'instructor_ratings 表已創建';
    END IF;
END $$;

-- 4. 創建新的索引
CREATE INDEX IF NOT EXISTS idx_instructor_applications_rating ON instructor_applications(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_active ON instructor_applications(is_active);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_approved_active ON instructor_applications(status, is_active) WHERE status = 'approved';

-- 5. 創建視圖以保持向後兼容
CREATE OR REPLACE VIEW instructors AS
SELECT 
    id,
    user_id,
    bio,
    qualifications,
    specialization,
    years_of_experience,
    status as application_status,
    reviewed_at as approval_date,
    reviewed_by as approved_by,
    average_rating,
    total_ratings,
    is_active,
    created_at,
    updated_at
FROM instructor_applications
WHERE status = 'approved';

-- 6. 創建更新評分的函數
CREATE OR REPLACE FUNCTION update_instructor_rating(target_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE instructor_applications 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM instructor_ratings 
            WHERE instructor_user_id = target_user_id
        ),
        total_ratings = (
            SELECT COUNT(*) 
            FROM instructor_ratings 
            WHERE instructor_user_id = target_user_id
        ),
        updated_at = NOW()
    WHERE user_id = target_user_id AND status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- 7. 創建觸發器自動更新評分
CREATE OR REPLACE FUNCTION trigger_update_instructor_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- 當插入、更新或刪除評分時，自動更新講師的平均評分
    IF TG_OP = 'DELETE' THEN
        PERFORM update_instructor_rating(OLD.instructor_user_id);
        RETURN OLD;
    ELSE
        PERFORM update_instructor_rating(NEW.instructor_user_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS trigger_instructor_rating_update ON instructor_ratings;
CREATE TRIGGER trigger_instructor_rating_update
    AFTER INSERT OR UPDATE OR DELETE ON instructor_ratings
    FOR EACH ROW EXECUTE FUNCTION trigger_update_instructor_rating();

-- 8. 更新現有已批准申請的狀態
UPDATE instructor_applications 
SET 
    is_active = COALESCE(is_active, true),
    average_rating = COALESCE(average_rating, 0),
    total_ratings = COALESCE(total_ratings, 0)
WHERE status = 'approved';

-- 9. 添加註釋
COMMENT ON TABLE instructor_applications IS '講師申請表 - 統一管理講師申請和講師信息';
COMMENT ON COLUMN instructor_applications.average_rating IS '平均評分 (0.00-5.00)';
COMMENT ON COLUMN instructor_applications.total_ratings IS '總評分數量';
COMMENT ON COLUMN instructor_applications.is_active IS '講師是否啟用';
COMMENT ON VIEW instructors IS '講師視圖 - 向後兼容，顯示已批准的講師';
COMMENT ON FUNCTION update_instructor_rating IS '更新講師評分統計';

-- 10. 顯示重構結果
DO $$
DECLARE
    approved_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO approved_count FROM instructor_applications WHERE status = 'approved';
    SELECT COUNT(*) INTO total_count FROM instructor_applications;
    
    RAISE NOTICE '=== 講師表重構完成 ===';
    RAISE NOTICE '總申請數: %', total_count;
    RAISE NOTICE '已批准講師數: %', approved_count;
    RAISE NOTICE '重構成功！現在所有講師數據都統一在 instructor_applications 表中。';
END $$;