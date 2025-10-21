-- 藥助Next學院數據庫初始化腳本
-- 直接在 Neon Console 中執行此腳本

-- 1. 創建觸發函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 創建 users 表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'job_seeker',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 3. 創建 courses 表
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_type VARCHAR(50) NOT NULL DEFAULT 'basic',
    duration_hours INTEGER,
    price DECIMAL(10,2),
    instructor_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 創建 course_enrollments 表
CREATE TABLE IF NOT EXISTS course_enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    progress_percentage INTEGER DEFAULT 0,
    final_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'enrolled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 創建 jobs 表
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    job_type VARCHAR(50) DEFAULT 'full_time',
    requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 6. 創建 documents 表
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT true,
    uploaded_by INTEGER DEFAULT 1,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 創建 job_applications 表
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    cover_letter TEXT,
    resume_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 插入測試數據

-- 插入測試用戶
INSERT INTO users (email, password_hash, user_type, first_name, last_name) 
VALUES 
    ('admin@pharmacy.com', '$2b$10$example_hash', 'employer', '系統', '管理員'),
    ('instructor@pharmacy.com', '$2b$10$example_hash', 'employer', '資深', '講師'),
    ('student@pharmacy.com', '$2b$10$example_hash', 'job_seeker', '測試', '學員')
ON CONFLICT (email) DO NOTHING;

-- 插入測試課程
INSERT INTO courses (title, description, course_type, duration_hours, price, instructor_id, is_active) 
VALUES 
    ('藥局助理基礎課程', '學習藥局基本作業流程、藥品管理等基礎知識', 'basic', 40, 5000, 2, true),
    ('進階藥學知識', '深入學習藥理學、藥物交互作用等進階知識', 'advanced', 60, 8000, 2, true),
    ('實習實作課程', '實際藥局工作環境體驗與實務操作', 'internship', 80, 12000, 2, true);

-- 插入測試工作
INSERT INTO jobs (employer_id, title, description, location, salary_min, salary_max, job_type, is_active, expires_at) 
VALUES 
    (1, '藥局助理 - 台北市', '負責藥品管理、顧客服務等工作', '台北市大安區', 30000, 40000, 'full_time', true, CURRENT_TIMESTAMP + INTERVAL '30 days'),
    (1, '兼職藥局助理 - 新北市', '週末兼職，協助藥師處理日常業務', '新北市板橋區', 200, 250, 'part_time', true, CURRENT_TIMESTAMP + INTERVAL '30 days'),
    (1, '藥局實習生', '提供完整實習訓練，有機會轉正職', '桃園市中壢區', 25000, 28000, 'internship', true, CURRENT_TIMESTAMP + INTERVAL '45 days');

-- 插入測試文檔
INSERT INTO documents (title, description, file_url, file_type, file_size, category, is_public, uploaded_by, download_count) 
VALUES 
    ('藥局助理職能標準', '詳細說明藥局助理應具備的專業能力', '/documents/pharmacy-assistant-standards.pdf', 'application/pdf', 1024000, '職能標準', true, 1, 156),
    ('藥品管理SOP', '藥品進貨、存放、銷售的標準作業程序', '/documents/drug-management-sop.pdf', 'application/pdf', 2048000, '作業程序', true, 1, 89),
    ('實習申請表', '藥局助理實習計劃申請表格', '/documents/internship-application.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 512000, '申請表格', true, 1, 234);

-- 9. 創建必要的索引（提升性能）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- 完成提示
SELECT 'Database setup completed successfully!' AS status;