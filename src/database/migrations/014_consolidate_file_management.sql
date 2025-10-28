-- 統一文件管理系統 - 移除冗餘表
-- Consolidate File Management System - Remove Redundant Tables

-- 第一步：將 documents 表的數據遷移到 uploaded_files
-- Step 1: Migrate data from documents table to uploaded_files

-- 檢查 uploaded_files 表是否存在，如果不存在則創建
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

-- 遷移 documents 表的數據
INSERT INTO uploaded_files (
    original_name, 
    file_name, 
    file_path, 
    file_url, 
    file_size, 
    file_type, 
    category, 
    description, 
    uploaded_by, 
    is_active, 
    created_at
)
SELECT 
    title as original_name,
    CONCAT('doc_', id, '_', REPLACE(REPLACE(title, ' ', '_'), '/', '_')) as file_name,
    CONCAT('legacy/documents/', id, '_', REPLACE(REPLACE(title, ' ', '_'), '/', '_')) as file_path,
    file_url,
    COALESCE(file_size, 0) as file_size,
    COALESCE(file_type, 'application/octet-stream') as file_type,
    COALESCE(category, 'general') as category,
    description,
    uploaded_by,
    COALESCE(is_public, true) as is_active,
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM documents
WHERE NOT EXISTS (
    SELECT 1 FROM uploaded_files uf 
    WHERE uf.file_url = documents.file_url
);

-- 遷移 ttqs_documents 表的數據（如果存在）
INSERT INTO uploaded_files (
    original_name, 
    file_name, 
    file_path, 
    file_url, 
    file_size, 
    file_type, 
    category, 
    description, 
    uploaded_by, 
    is_active, 
    created_at
)
SELECT 
    title as original_name,
    CONCAT('ttqs_', id, '_', REPLACE(REPLACE(title, ' ', '_'), '/', '_')) as file_name,
    CONCAT('legacy/ttqs/', id, '_', REPLACE(REPLACE(title, ' ', '_'), '/', '_')) as file_path,
    file_url,
    COALESCE(file_size, 0) as file_size,
    COALESCE(document_type, 'application/pdf') as file_type,
    'ttqs' as category,
    CONCAT('TTQS文件 - ', COALESCE(description, title)) as description,
    uploaded_by,
    true as is_active,
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM ttqs_documents
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ttqs_documents')
AND NOT EXISTS (
    SELECT 1 FROM uploaded_files uf 
    WHERE uf.file_url = ttqs_documents.file_url
);

-- 創建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_type ON uploaded_files(file_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_is_active ON uploaded_files(is_active);

-- 創建更新時間觸發器（如果不存在）
CREATE OR REPLACE FUNCTION update_uploaded_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_uploaded_files_updated_at ON uploaded_files;
CREATE TRIGGER update_uploaded_files_updated_at
    BEFORE UPDATE ON uploaded_files
    FOR EACH ROW
    EXECUTE FUNCTION update_uploaded_files_updated_at();

-- 創建視圖以保持向後兼容性（暫時）
CREATE OR REPLACE VIEW documents_legacy AS
SELECT 
    id,
    original_name as title,
    description,
    file_url,
    file_type,
    file_size,
    category,
    is_active as is_public,
    uploaded_by,
    0 as download_count,
    created_at
FROM uploaded_files
WHERE category != 'ttqs';

CREATE OR REPLACE VIEW ttqs_documents_legacy AS
SELECT 
    id,
    original_name as title,
    description,
    file_url,
    file_size,
    file_type as document_type,
    uploaded_by,
    created_at
FROM uploaded_files
WHERE category = 'ttqs';

-- 添加註釋
COMMENT ON TABLE uploaded_files IS '統一文件管理表 - 整合了 documents 和 ttqs_documents 的功能';
COMMENT ON COLUMN uploaded_files.original_name IS '原始文件名';
COMMENT ON COLUMN uploaded_files.file_name IS '存儲文件名（唯一）';
COMMENT ON COLUMN uploaded_files.file_path IS '文件存儲路徑';
COMMENT ON COLUMN uploaded_files.file_url IS '文件訪問URL';
COMMENT ON COLUMN uploaded_files.category IS '文件分類：general, course_materials, user_avatars, documents, images, videos, ttqs';

-- 記錄遷移日誌
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '014_consolidate_file_management', 
    CURRENT_TIMESTAMP, 
    '統一文件管理系統：將 documents 和 ttqs_documents 遷移到 uploaded_files'
) ON CONFLICT (migration_name) DO NOTHING;

-- 創建 migration_log 表（如果不存在）
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

COMMENT ON TABLE migration_log IS '數據庫遷移記錄表';