-- 修正 jobs.company 欄位為可空，並為現有資料設置預設值

-- 設置現有資料的預設值
UPDATE jobs SET company = '未提供公司名稱' WHERE company IS NULL;

-- 將欄位改為允許 NULL
ALTER TABLE jobs ALTER COLUMN company DROP NOT NULL;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary);

