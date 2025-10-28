-- 創建文檔下載記錄表
CREATE TABLE IF NOT EXISTS document_downloads (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_document_downloads_document_id ON document_downloads(document_id);
CREATE INDEX IF NOT EXISTS idx_document_downloads_user_id ON document_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_document_downloads_downloaded_at ON document_downloads(downloaded_at);

-- 添加註釋
COMMENT ON TABLE document_downloads IS '文檔下載記錄表';
COMMENT ON COLUMN document_downloads.document_id IS '文檔ID';
COMMENT ON COLUMN document_downloads.user_id IS '下載用戶ID（可為空，匿名下載）';
COMMENT ON COLUMN document_downloads.ip_address IS '下載IP地址';
COMMENT ON COLUMN document_downloads.user_agent IS '用戶代理字符串';
COMMENT ON COLUMN document_downloads.downloaded_at IS '下載時間';

-- 檢查表是否創建成功
SELECT 'document_downloads 表創建成功' as message;