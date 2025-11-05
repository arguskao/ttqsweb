-- 恢復講師評價表
-- Restore instructor ratings table

-- 重新建立 instructor_ratings 表
CREATE TABLE IF NOT EXISTS instructor_ratings (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 確保每個學生對每個講師的每個課程只能評價一次
    UNIQUE(instructor_id, student_id, course_id)
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_instructor ON instructor_ratings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_student ON instructor_ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_course ON instructor_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_rating ON instructor_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_created_at ON instructor_ratings(created_at DESC);

-- 建立複合索引
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_instructor_rating ON instructor_ratings(instructor_id, rating);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_student_course ON instructor_ratings(student_id, course_id);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_instructor_ratings_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_instructor_ratings_updated_at
    BEFORE UPDATE ON instructor_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_instructor_ratings_updated_at();

-- 建立觸發器函數來自動更新講師的平均評分
CREATE OR REPLACE FUNCTION update_instructor_average_rating()
RETURNS TRIGGER AS $
DECLARE
    instructor_id_to_update INTEGER;
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    -- 確定要更新的講師 ID
    IF TG_OP = 'DELETE' THEN
        instructor_id_to_update := OLD.instructor_id;
    ELSE
        instructor_id_to_update := NEW.instructor_id;
    END IF;
    
    -- 計算新的平均評分和總數
    SELECT 
        COALESCE(AVG(rating), 0)::DECIMAL(3,2),
        COUNT(*)
    INTO avg_rating, total_count
    FROM instructor_ratings 
    WHERE instructor_id = instructor_id_to_update;
    
    -- 更新講師表中的統計資料
    UPDATE instructors 
    SET 
        average_rating = avg_rating,
        total_ratings = total_count,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = instructor_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$ language 'plpgsql';

-- 建立觸發器
CREATE TRIGGER trigger_update_instructor_average_rating
    AFTER INSERT OR UPDATE OR DELETE ON instructor_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_instructor_average_rating();

-- 添加表註釋
COMMENT ON TABLE instructor_ratings IS '講師評價表 - 學員對講師的評分和評論 (恢復於 2024-11-05)';
COMMENT ON COLUMN instructor_ratings.instructor_id IS '講師 ID，關聯到 instructors 表';
COMMENT ON COLUMN instructor_ratings.student_id IS '學員 ID，關聯到 users 表';
COMMENT ON COLUMN instructor_ratings.course_id IS '課程 ID，關聯到 courses 表（可選）';
COMMENT ON COLUMN instructor_ratings.rating IS '評分，1-5 分';
COMMENT ON COLUMN instructor_ratings.comment IS '評價留言';
COMMENT ON COLUMN instructor_ratings.created_at IS '評價建立時間';
COMMENT ON COLUMN instructor_ratings.updated_at IS '評價更新時間';

-- 記錄恢復日誌
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '029_restore_instructor_ratings', 
    CURRENT_TIMESTAMP, 
    '恢復講師評價表 - 重新建立 instructor_ratings 表及相關觸發器和索引'
) ON CONFLICT (migration_name) DO NOTHING;

-- 顯示恢復摘要
RAISE NOTICE '=== 講師評價表恢復完成 ===';
RAISE NOTICE '已重新建立 instructor_ratings 表';
RAISE NOTICE '已建立相關索引和觸發器';
RAISE NOTICE '評價功能現在可以正常使用';