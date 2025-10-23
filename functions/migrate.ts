/**
 * Cloudflare Pages Function - 資料庫遷移
 * 在線上環境執行用戶角色系統遷移
 */

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async context => {
  const { request, env } = context

  try {
    // 簡單的安全檢查
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${env.JWT_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const sql = neon(env.DATABASE_URL)

    console.log('🚀 開始執行線上環境用戶角色系統遷移...')

    // 1. 檢查並創建 migrations 表
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    // 2. 檢查是否已經執行過遷移
    const existingMigrations = await sql`
      SELECT id FROM migrations 
      WHERE id = 'roles_migration_production'
    `

    let migrationResult = {
      alreadyMigrated: false,
      adminCreated: false,
      userStats: null as any
    }

    if (existingMigrations.length > 0) {
      migrationResult.alreadyMigrated = true
    } else {
      // 3. 刪除現有約束（如果存在）
      try {
        await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check`
      } catch (error) {
        // 忽略錯誤
      }

      // 4. 修正無效的用戶類型
      const invalidUsers = await sql`
        SELECT id, email, user_type 
        FROM users 
        WHERE user_type NOT IN ('admin', 'instructor', 'employer', 'job_seeker')
      `

      if (invalidUsers.length > 0) {
        for (const user of invalidUsers) {
          await sql`
            UPDATE users 
            SET user_type = 'job_seeker' 
            WHERE id = ${user.id}
          `
        }
      }

      // 5. 添加新約束
      await sql`
        ALTER TABLE users 
        ADD CONSTRAINT users_user_type_check 
        CHECK (user_type IN ('admin', 'instructor', 'employer', 'job_seeker'))
      `

      // 記錄遷移
      await sql`
        INSERT INTO migrations (id, filename) 
        VALUES ('roles_migration_production', 'roles_migration_production.sql')
      `
    }

    // 6. 檢查並創建管理員帳號
    const adminCheck = await sql`
      SELECT COUNT(*) as count FROM users WHERE user_type = 'admin'
    `

    const adminCount = parseInt(adminCheck[0]?.count || '0')

    if (adminCount === 0) {
      // 檢查是否已有相同 email 的用戶
      const existingUser = await sql`
        SELECT id FROM users WHERE email = 'admin@ttqs.com'
      `

      if (existingUser.length > 0) {
        // 更新現有用戶為管理員
        await sql`
          UPDATE users 
          SET user_type = 'admin', 
              first_name = '系統', 
              last_name = '管理員',
              updated_at = CURRENT_TIMESTAMP
          WHERE email = 'admin@ttqs.com'
        `
        migrationResult.adminCreated = true
      } else {
        // 創建新的管理員帳號
        const defaultPassword = 'admin123'
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)

        await sql`
          INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
          VALUES (
            'admin@ttqs.com',
            ${hashedPassword},
            'admin',
            '系統',
            '管理員',
            '0900000000'
          )
        `
        migrationResult.adminCreated = true
      }
    }

    // 7. 獲取用戶統計
    const userStats = await sql`
      SELECT 
        user_type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users 
      GROUP BY user_type
      ORDER BY 
        CASE user_type 
          WHEN 'admin' THEN 1 
          WHEN 'instructor' THEN 2 
          WHEN 'employer' THEN 3 
          WHEN 'job_seeker' THEN 4 
          ELSE 5 
        END
    `

    migrationResult.userStats = userStats

    return Response.json({
      success: true,
      message: '用戶角色系統遷移完成',
      data: migrationResult
    })
  } catch (error) {
    console.error('遷移失敗:', error)
    return Response.json(
      {
        success: false,
        message: '遷移失敗',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
