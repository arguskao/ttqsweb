-- 添加 employer_id 欄位到 jobs 表
-- 讓工作需求可以正確追蹤發布者

-- 添加 employer_id 欄位
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employer_id INTEGER;

-- 添加外鍵約束（參考 users 表）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_jobs_employer'
    ) THEN
        ALTER TABLE jobs
        ADD CONSTRAINT fk_jobs_employer 
        FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);

-- 為現有資料設置預設值（使用 ID 為 1 的用戶作為預設雇主）
UPDATE jobs
SET employer_id = 1
WHERE employer_id IS NULL;

-- 將欄位設為 NOT NULL（在設置完預設值之後）
DO $$
BEGIN
    ALTER TABLE jobs ALTER COLUMN employer_id SET NOT NULL;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '無法設置 NOT NULL: %', SQLERRM;
END $$;

-- 添加註釋
COMMENT ON COLUMN jobs.employer_id IS '工作發布者的用戶ID';

