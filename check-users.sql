-- 檢查用戶狀態
-- 在 Neon 資料庫中執行這個查詢來檢查所有用戶

-- 1. 查看所有用戶的基本信息和狀態
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name,
    is_active,
    created_at,
    CASE 
        WHEN password_hash IS NULL THEN '❌ 沒有密碼'
        WHEN LENGTH(password_hash) < 20 THEN '❌ 密碼格式錯誤'
        WHEN password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%' THEN '✅ bcrypt 格式正確'
        ELSE '⚠️ 未知格式'
    END as password_status
FROM users
ORDER BY id;

-- 2. 統計各種狀態的用戶數量
SELECT 
    is_active,
    COUNT(*) as user_count,
    STRING_AGG(email, ', ') as emails
FROM users
GROUP BY is_active;

-- 3. 檢查密碼 hash 格式
SELECT 
    id,
    email,
    LEFT(password_hash, 10) as hash_prefix,
    LENGTH(password_hash) as hash_length,
    CASE 
        WHEN password_hash LIKE '$2a$%' THEN 'bcrypt (2a)'
        WHEN password_hash LIKE '$2b$%' THEN 'bcrypt (2b)'
        WHEN password_hash LIKE '$2y$%' THEN 'bcrypt (2y)'
        ELSE 'unknown'
    END as hash_type
FROM users
ORDER BY id;

-- 4. 如果要啟用所有用戶，執行以下語句（請謹慎使用）
-- UPDATE users SET is_active = true WHERE is_active = false;

-- 5. 如果要重設某個用戶的密碼為 "password123"（僅用於測試）
-- 先在本地生成 bcrypt hash，然後執行：
-- UPDATE users SET password_hash = '$2b$12$...' WHERE email = 'user@example.com';
