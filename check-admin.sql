-- 檢查管理員帳號
SELECT id, email, user_type, first_name, last_name, is_active
FROM users
WHERE user_type = 'admin'
ORDER BY id;

-- 如果沒有管理員，可以將某個用戶升級為管理員
-- UPDATE users SET user_type = 'admin' WHERE email = 'your-email@example.com';
