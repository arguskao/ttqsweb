-- 修復所有用戶密碼
-- 將所有非 bcrypt 格式的密碼重設為統一的臨時密碼

-- 臨時密碼：TempPassword123!
-- bcrypt hash: $2b$12$rtq42CwDLf6V8kV3p6BYBuWMSqwgW.c4ukyOqfA9AjN4NxYUJIBga

-- 1. 先查看有多少用戶需要重設密碼
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN password_hash LIKE '$2%' THEN 1 END) as bcrypt_users,
    COUNT(CASE WHEN password_hash NOT LIKE '$2%' OR password_hash IS NULL THEN 1 END) as need_reset
FROM users;

-- 2. 查看需要重設密碼的用戶列表
SELECT 
    id,
    email,
    user_type,
    LEFT(password_hash, 15) as current_hash_prefix,
    LENGTH(password_hash) as hash_length
FROM users
WHERE password_hash NOT LIKE '$2%' OR password_hash IS NULL
ORDER BY id;

-- 3. 執行密碼重設（請確認後再執行）
UPDATE users 
SET password_hash = '$2b$12$rtq42CwDLf6V8kV3p6BYBuWMSqwgW.c4ukyOqfA9AjN4NxYUJIBga',
    updated_at = CURRENT_TIMESTAMP
WHERE password_hash NOT LIKE '$2%' OR password_hash IS NULL;

-- 4. 驗證結果
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN password_hash LIKE '$2%' THEN 1 END) as bcrypt_users,
    COUNT(CASE WHEN password_hash NOT LIKE '$2%' THEN 1 END) as other_format
FROM users;

-- 5. 列出所有用戶的新狀態
SELECT 
    id,
    email,
    user_type,
    is_active,
    CASE 
        WHEN password_hash LIKE '$2%' THEN '✅ bcrypt (可登入)'
        ELSE '❌ 其他格式'
    END as password_status
FROM users
ORDER BY id;

-- 重要提示：
-- 執行後，所有受影響的用戶需要使用臨時密碼登入：TempPassword123!
-- 建議通知用戶登入後立即修改密碼
