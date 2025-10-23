/**
 * 最終用戶角色系統遷移腳本
 * 簡化版本，避免複雜的動態 SQL
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
      WHERE id = 'roles_migration_final'
    `

    if (existingMigrations.length > 0) {
      console.log('✅ 遷移已經執行過，檢查當前狀態...')
    } else {
      console.log('🔄 執行角色系統遷移...')

      // 3. 刪除現有約束（如果存在）
      try {
        await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check`
        console.log('   ✅ 刪除舊約束')
      } catch (error) {
        console.log('   ℹ️  沒有找到舊約束')
      }

      // 4. 修正無效的用戶類型
      const invalidUsers = await sql`
        SELECT id, email, user_type 
        FROM users 
        WHERE user_type NOT IN ('admin', 'instructor', 'employer', 'job_seeker')
      `

      if (invalidUsers.length > 0) {
        console.log(`   🔧 修正 ${invalidUsers.length} 個無效用戶類型...`)

        for (const user of invalidUsers) {
          console.log(`      ${user.email}: ${user.user_type} -> job_seeker`)
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
      console.log('   ✅ 添加新的用戶類型約束')

      // 記錄遷移
      await sql`
        INSERT INTO migrations (id, filename) 
        VALUES ('roles_migration_final', 'roles_migration_final.sql')
      `
    }

    // 6. 檢查並創建管理員帳號
    console.log('👤 檢查管理員帳號...')

    const adminCheck = await sql`
      SELECT COUNT(*) as count FROM users WHERE user_type = 'admin'
    `

    const adminCount = parseInt(adminCheck[0]?.count ?? '0')

    if (adminCount === 0) {
      console.log('   創建默認管理員帳號...')

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
        console.log('   ✅ 現有用戶已更新為管理員')
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

        console.log('   ✅ 默認管理員帳號創建完成')
        console.log('   📧 管理員帳號: admin@ttqs.com')
        console.log('   🔑 默認密碼: admin123')
        console.log('   ⚠️  請登入後立即修改密碼！')
      }
    } else {
      console.log('   ✅ 已存在管理員帳號')
    }

    // 7. 顯示當前用戶統計
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

    // 8. 顯示管理員帳號
    const admins = await sql`
      SELECT email, first_name, last_name, is_active 
      FROM users 
      WHERE user_type = 'admin'
      ORDER BY created_at
    `

    if (admins.length > 0) {
      console.log('\n👑 管理員帳號:')
      admins.forEach(admin => {
        const status = admin.is_active ? '✅ 活躍' : '❌ 停用'
        console.log(`   ${admin.email} (${admin.first_name} ${admin.last_name}) - ${status}`)
      })
    }

    console.log('\n🎉 用戶角色系統遷移完成！')
    console.log('\n📝 接下來你可以:')
    console.log('   1. 使用管理員帳號登入系統')
    console.log('   2. 在管理員界面中管理用戶角色')
    console.log('   3. 為現有用戶分配適當的角色')
    console.log('   4. 修改默認管理員密碼')
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
