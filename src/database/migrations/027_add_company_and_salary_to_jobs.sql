-- 添加 company 和 salary 欄位到 jobs 表
-- 以支持單一薪資字串欄位和公司名稱

-- 添加 company 欄位（公司名稱）
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS company VARCHAR(255) DEFAULT '未提供公司名稱';

-- 添加 salary 欄位（薪資字串，如 "28000-35000"）
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS salary VARCHAR(100);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary);

-- 添加註釋
COMMENT ON COLUMN jobs.company IS '公司名稱';
COMMENT ON COLUMN jobs.salary IS '薪資範圍（字串格式，如 "28000-35000" 或 "180/小時"）';

-- 為現有資料遷移 company（從 users 表獲取，如果需要的話）
-- UPDATE jobs SET company = (SELECT COALESCE(u.company_name, u.first_name || ' ' || u.last_name) FROM users u WHERE u.id = jobs.employer_id) WHERE company IS NULL;

