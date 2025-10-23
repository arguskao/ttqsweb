-- 檢查用戶 wii543@gmail.com 的講師申請狀態
SELECT 
  ia.id,
  ia.user_id,
  ia.status,
  ia.submitted_at,
  ia.reviewed_at,
  ia.review_notes,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name
FROM instructor_applications ia
JOIN users u ON ia.user_id = u.id
WHERE u.email = 'wii543@gmail.com';
