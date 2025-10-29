
/**
 * 用戶角色系統遷移腳本 (Neon Serverless 版本)
 * 執行資料庫遷移以支援新的四層用戶角色系統
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL 環境變數未設置')
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🚀 開始執行用戶角色系統遷移...')

    // 1. 檢查並創建 migrations 表
    console.log('📋 檢查 migrations 表...')
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
      WHERE id IN ('001_update_user_roles', '002_create_default_admin')
    `

    const executedMigrations = new Set(existingMigrations.map(row => row.id))

    // 3. 更新用戶表以支援新角色
    if (!executedMigrations.has('001_update_user_roles')) {
      console.log('🔄 更新用戶表結構...')

      try {
        // 檢查當前的 user_type 約束
        const constraintCheck = await sql`
          SELECT constraint_name 
          FROM information_schema.check_constraints 
          WHERE table_name = 'users' 
          AND constraint_name LIKE '%user_type%'
        `

        // 如果存在舊的約束，先刪除它
        if (constraintCheck.length > 0) {
          const constraintName = constraintCheck[0]?.constraint_name
          if (constraintName) {
            await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS ${sql(constraintName)}`
          }
        }

        // 添加新的約束
        await sql`
          ALTER TABLE users 
          ADD CONSTRAINT users_user_type_check 
          CHECK (user_type IN ('admin', 'instructor', 'employer', 'job_seeker'))
        `

        console.log('✅ 用戶表結構更新完成')

        // 記錄遷移
        await sql`
          INSERT INTO migrations (id, filename) 
          VALUES ('001_update_user_roles', '001_update_user_roles.sql')
        `
      } catch (error) {
        console.log('ℹ️  用戶表可能已經是最新結構，跳過更新')
        console.log('   錯誤詳情:', error.message)

        // 仍然記錄遷移以避免重複執行
        try {
          await sql`
            INSERT INTO migrations (id, filename) 
            VALUES ('001_update_user_roles', '001_update_user_roles.sql')
            ON CONFLICT (id) DO NOTHING
          `
        } catch (insertError) {
          // 忽略插入錯誤
        }
      }
    } else {
      console.log('✅ 用戶表結構已是最新版本')
    }

    // 4. 創建默認管理員帳號
    if (!executedMigrations.has('002_create_default_admin')) {
      console.log('👤 創建默認管理員帳號...')

      // 檢查是否已有管理員
      const adminCheck = await sql`
        SELECT COUNT(*) as count FROM users WHERE user_type = 'admin'
      `

      const adminCount = parseInt(adminCheck[0]?.count || '0')

      if (adminCount === 0) {
        // 創建默認管理員帳號
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

        console.log('✅ 默認管理員帳號創建完成')
        console.log('📧 管理員帳號: admin@ttqs.com')
        console.log('🔑 默認密碼: admin123')
        console.log('⚠️  請登入後立即修改密碼！')
      } else {
        console.log('✅ 已存在管理員帳號，跳過創建')
      }

      // 記錄遷移
      await sql`
        INSERT INTO migrations (id, filename) 
        VALUES ('002_create_default_admin', '002_create_default_admin.sql')
      `
    } else {
      console.log('✅ 默認管理員帳號已存在')
    }

    // 5. 顯示當前用戶統計
    console.log('\n📊 當前用戶統計:')
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

    const roleNames = {
      admin: '管理員',
      instructor: '講師',
      employer: '雇主',
      job_seeker: '求職者'
    }

    userStats.forEach(row => {
      const roleName = roleNames[row.user_type as keyof typeof roleNames] || row.user_type
      console.log(`   ${roleName}: ${row.active_count}/${row.count} (活躍/總數)`)
    })

    console.log('\n🎉 用戶角色系統遷移完成！')
    console.log('\n📝 接下來你可以:')
    console.log('   1. 使用 admin@ttqs.com / admin123 登入管理員帳號')
    console.log('   2. 在管理員界面中管理用戶角色')
    console.log('   3. 為現有用戶分配適當的角色')
  } catch (error) {
    console.error('❌ 遷移失敗:', error)
    throw error
  }
}

// 執行遷移
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(error => {
    console.error('遷移執行失敗:', error)
    process.exit(1)
  })
}

export { runMigration }
