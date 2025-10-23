-- 檢查 instructor_applications 表中的數據
-- 這個腳本會顯示所有講師申請記錄

-- 首先檢查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'instructor_applications'
) as table_exists;

-- 如果表存在，查詢所有申請記錄
SELECT 
  id,
  user_id,
  bio,
  qualifications,
  specialization,
  years_of_experience,
  target_audiences,
  status,
  submitted_at,
  created_at
FROM instructor_applications 
ORDER BY submitted_at DESC;

-- 查詢特定用戶的申請（用戶 ID 20）
SELECT 
  id,
  user_id,
  bio,
  qualifications,
  specialization,
  years_of_experience,
  target_audiences,
  status,
  submitted_at,
  created_at
FROM instructor_applications 
WHERE user_id = 20
ORDER BY submitted_at DESC;
