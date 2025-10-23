-- 更新已批准講師的用戶類型
UPDATE users 
SET user_type = 'instructor'
WHERE id IN (
  SELECT ia.user_id 
  FROM instructor_applications ia 
  WHERE ia.status = 'approved'
);
