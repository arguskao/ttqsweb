-- 添加工作審核狀態欄位
-- 允許雇主張貼工作需求，管理員審核後才能公開顯示

-- 添加審核狀態欄位
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 添加審核相關欄位
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_jobs_approval_status ON jobs(approval_status);
CREATE INDEX IF NOT EXISTS idx_jobs_reviewed_at ON jobs(reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_approval_status_created ON jobs(approval_status, created_at DESC);

-- 複合索引：用於查詢待審核的工作
CREATE INDEX IF NOT EXISTS idx_jobs_pending_approval 
ON jobs(approval_status, created_at DESC) 
WHERE approval_status = 'pending';

-- 更新現有資料：將所有現有工作設為已審核通過（避免影響現有資料）
UPDATE jobs 
SET approval_status = 'approved', reviewed_at = created_at 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- 添加註釋
COMMENT ON COLUMN jobs.approval_status IS '審核狀態：pending(待審核), approved(已通過), rejected(已拒絕)';
COMMENT ON COLUMN jobs.reviewed_at IS '審核時間';
COMMENT ON COLUMN jobs.reviewed_by IS '審核人員ID';
COMMENT ON COLUMN jobs.review_notes IS '審核備註';

