-- 創建文件上傳表
CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_type ON uploaded_files(file_type);

-- 添加更新時間觸發器
CREATE OR REPLACE FUNCTION update_uploaded_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_uploaded_files_updated_at
    BEFORE UPDATE ON uploaded_files
    FOR EACH ROW
    EXECUTE FUNCTION update_uploaded_files_updated_at();

-- 添加註釋
COMMENT ON TABLE uploaded_files IS '上傳文件記錄表';
COMMENT ON COLUMN uploaded_files.original_name IS '原始文件名';
COMMENT ON COLUMN uploaded_files.file_name IS '存儲文件名（唯一）';
COMMENT ON COLUMN uploaded_files.file_path IS '文件存儲路徑';
COMMENT ON COLUMN uploaded_files.file_url IS '文件訪問URL';
COMMENT ON COLUMN uploaded_files.file_size IS '文件大小（字節）';
COMMENT ON COLUMN uploaded_files.file_type IS 'MIME類型';
COMMENT ON COLUMN uploaded_files.category IS '文件分類（如：course_materials, user_avatars, documents等）';
COMMENT ON COLUMN uploaded_files.description IS '文件描述';
COMMENT ON COLUMN uploaded_files.uploaded_by IS '上傳者用戶ID';