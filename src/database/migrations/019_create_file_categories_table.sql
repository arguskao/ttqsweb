-- 創建文件分類管理表
-- Create File Categories Management Table

-- 創建分類表
CREATE TABLE IF NOT EXISTS file_categories (
    id SERIAL PRIMARY KEY,
    category_key VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_file_categories_key ON file_categories(category_key);
CREATE INDEX IF NOT EXISTS idx_file_categories_active ON file_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_file_categories_order ON file_categories(display_order);

-- 插入預設分類
INSERT INTO file_categories (category_key, category_name, description, display_order) VALUES
    ('general', '一般文件', '一般性文件和資料', 1),
    ('course', '課程資料', '課程相關的教材和資料', 2),
    ('documents', '文檔', '正式文檔和表單', 3),
    ('images', '圖片', '圖片和圖像文件', 4),
    ('reference', '參考資料', '參考文獻和資料', 5),
    ('ttqs', 'TTQS文件', 'TTQS相關文件', 6)
ON CONFLICT (category_key) DO NOTHING;

-- 移除 documents 表的分類約束（如果存在）
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_category_values;

-- 添加外鍵約束（可選，如果想要嚴格控制）
-- ALTER TABLE documents ADD CONSTRAINT fk_documents_category 
-- FOREIGN KEY (category) REFERENCES file_categories(category_key) ON DELETE SET NULL;

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_file_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_file_categories_updated_at
    BEFORE UPDATE ON file_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_file_categories_updated_at();

-- 添加註釋
COMMENT ON TABLE file_categories IS '文件分類管理表 - 可動態新增和管理分類';
COMMENT ON COLUMN file_categories.category_key IS '分類鍵值（英文，用於存儲）';
COMMENT ON COLUMN file_categories.category_name IS '分類名稱（中文，用於顯示）';
COMMENT ON COLUMN file_categories.description IS '分類描述';
COMMENT ON COLUMN file_categories.display_order IS '顯示順序';
COMMENT ON COLUMN file_categories.is_active IS '是否啟用';

-- 記錄遷移
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '019_create_file_categories_table', 
    CURRENT_TIMESTAMP, 
    '創建文件分類管理表 - 支援動態新增分類'
) ON CONFLICT (migration_name) DO NOTHING;

-- 顯示當前分類
DO $$
DECLARE
    category_record RECORD;
BEGIN
    RAISE NOTICE '=== 當前文件分類 ===';
    FOR category_record IN 
        SELECT category_key, category_name, display_order 
        FROM file_categories 
        WHERE is_active = true 
        ORDER BY display_order
    LOOP
        RAISE NOTICE '% - %', category_record.category_key, category_record.category_name;
    END LOOP;
    RAISE NOTICE '===================';
    RAISE NOTICE '提示：可以直接在 file_categories 表中新增分類';
END $$;
