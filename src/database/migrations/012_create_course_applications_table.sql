-- 創建課程申請表
-- 用於存儲講師申請開課的相關資訊

CREATE TABLE IF NOT EXISTS course_applications (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES instructor_applications(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    target_audience VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    delivery_methods TEXT, -- 存儲授課方式，用逗號分隔
    syllabus TEXT NOT NULL,
    teaching_experience TEXT NOT NULL,
    materials TEXT,
    special_requirements TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_course_applications_instructor_id ON course_applications(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_status ON course_applications(status);
CREATE INDEX IF NOT EXISTS idx_course_applications_submitted_at ON course_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_course_applications_category ON course_applications(category);

-- 添加註釋
COMMENT ON TABLE course_applications IS '課程申請表，存儲講師申請開課的相關資訊';
COMMENT ON COLUMN course_applications.instructor_id IS '講師ID，關聯到instructor_applications表';
COMMENT ON COLUMN course_applications.course_name IS '課程名稱';
COMMENT ON COLUMN course_applications.description IS '課程簡介';
COMMENT ON COLUMN course_applications.category IS '課程分類';
COMMENT ON COLUMN course_applications.target_audience IS '目標族群';
COMMENT ON COLUMN course_applications.duration IS '課程時數（小時）';
COMMENT ON COLUMN course_applications.price IS '課程費用';
COMMENT ON COLUMN course_applications.delivery_methods IS '授課方式，用逗號分隔';
COMMENT ON COLUMN course_applications.syllabus IS '課程大綱';
COMMENT ON COLUMN course_applications.teaching_experience IS '教學經驗';
COMMENT ON COLUMN course_applications.materials IS '課程材料';
COMMENT ON COLUMN course_applications.special_requirements IS '特殊需求';
COMMENT ON COLUMN course_applications.status IS '申請狀態：pending, approved, rejected';
COMMENT ON COLUMN course_applications.submitted_at IS '提交時間';
COMMENT ON COLUMN course_applications.reviewed_at IS '審核時間';
COMMENT ON COLUMN course_applications.reviewed_by IS '審核人員ID';
COMMENT ON COLUMN course_applications.review_notes IS '審核備註';
