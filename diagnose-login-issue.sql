-- 診斷登入問題
-- 在 Neon 資料庫中執行這個查詢

-- 1. 檢查所有用戶的密碼狀態
SELECT 
    id,
    email,
    user_type,
    is_active,
    created_at,
    -- 檢查密碼 hash
    CASE 
        WHEN password_hash IS NULL THEN '❌ 密碼為空'
        WHEN LENGTH(password_hash) < 20 THEN '❌ 密碼太短（可能損壞）'
        WHEN password_hash LIKE '$2a$%' THEN '✅ bcrypt 2a'
        WHEN password_hash LIKE '$2b$%' THEN '✅ bcrypt 2b'
        WHEN password_hash LIKE '$2y$%' THEN '✅ bcrypt 2y'
        WHEN password_hash LIKE '$1$%' THEN '⚠️ MD5 (不支援)'
        WHEN password_hash LIKE '$5$%' THEN '⚠️ SHA-256 (不支援)'
        WHEN password_hash LIKE '$6$%' THEN '⚠️ SHA-512 (不支援)'
        ELSE '❌ 未知格式'
    END as password_format,
    LENGTH(password_hash) as hash_length,
    LEFT(password_hash, 15) as hash_sample
FROM users
ORDER BY 
    CASE 
        WHEN password_hash LIKE '$2%' THEN 1  -- bcrypt 格式排前面
        ELSE 2
    END,
    id;

-- 2. 統計密碼格式
SELECT 
    CASE 
        WHEN password_hash IS NULL THEN '空密碼'
        WHEN password_hash LIKE '$2%' THEN 'bcrypt (正確)'
        ELSE '其他格式 (錯誤)'
    END as format_type,
    COUNT(*) as count,
    STRING_AGG(email, ', ' ORDER BY id) as users
FROM users
GROUP BY 
    CASE 
        WHEN password_hash IS NULL THEN '空密碼'
        WHEN password_hash LIKE '$2%' THEN 'bcrypt (正確)'
        ELSE '其他格式 (錯誤)'
    END;

-- 3. 找出可以登入的用戶（is_active = true 且有 bcrypt 密碼）
SELECT 
    id,
    email,
    user_type,
    '✅ 可以登入' as status
FROM users
WHERE is_active = true 
  AND password_hash LIKE '$2%'
ORDER BY id;

-- 4. 找出不能登入的用戶
SELECT 
    id,
    email,
    user_type,
    CASE 
        WHEN NOT is_active THEN '❌ 帳號未啟用'
        WHEN password_hash IS NULL THEN '❌ 沒有密碼'
        WHEN NOT password_hash LIKE '$2%' THEN '❌ 密碼格式錯誤'
        ELSE '❓ 未知原因'
    END as reason
FROM users
WHERE NOT (is_active = true AND password_hash LIKE '$2%')
ORDER BY id;
