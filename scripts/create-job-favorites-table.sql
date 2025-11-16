-- 創建 job_favorites 表
-- 用於存儲用戶收藏的工作

CREATE TABLE IF NOT EXISTS job_favorites (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, user_id)
);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_job_favorites_user_id ON job_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_job_favorites_job_id ON job_favorites(job_id);
CREATE INDEX IF NOT EXISTS idx_job_favorites_created_at ON job_favorites(created_at DESC);

-- 添加註釋
COMMENT ON TABLE job_favorites IS '用戶收藏的工作';
COMMENT ON COLUMN job_favorites.id IS '主鍵';
COMMENT ON COLUMN job_favorites.job_id IS '工作 ID';
COMMENT ON COLUMN job_favorites.user_id IS '用戶 ID';
COMMENT ON COLUMN job_favorites.created_at IS '創建時間';
COMMENT ON COLUMN job_favorites.updated_at IS '更新時間';
