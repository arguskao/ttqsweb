
/**
 * 檢查普通用戶的講師申請功能
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

async function checkRegularUser() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔍 檢查普通用戶的申請功能...\n')

    // 查找非講師用戶
    const regularUsers = await sql`
      SELECT id, email, user_type, first_name, last_name, created_at
      FROM users 
      WHERE user_type != 'instructor' AND user_type != 'admin'
      ORDER BY created_at DESC
      LIMIT 5
    `

    console.log(`📋 找到 ${regularUsers.length} 個普通用戶:`)
    regularUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id}, 類型: ${user.user_type})`)
    })

    if (regularUsers.length === 0) {
      console.log('❌ 沒有找到普通用戶')
      return
    }

    // 檢查第一個普通用戶的申請狀態
    const testUser = regularUsers[0]
    console.log(`\n🧪 測試用戶: ${testUser.email}`)

    const applications = await sql`
      SELECT * FROM instructor_applications 
      WHERE user_id = ${testUser.id}
      ORDER BY created_at DESC
    `

    console.log(`📝 該用戶的申請記錄: ${applications.length} 筆`)
    applications.forEach((app, index) => {
      console.log(`  ${index + 1}. 狀態: ${app.status}, 提交時間: ${app.submitted_at}`)
    })

    // 測試創建申請
    console.log('\n🧪 測試創建申請...')

    // 檢查是否有進行中的申請
    const pendingApps = applications.filter(app => app.status === 'pending' || app.status === 'approved')

    if (pendingApps.length > 0) {
      console.log('⚠️  用戶已有進行中的申請，無法創建新申請')
      console.log(`   現有申請狀態: ${pendingApps[0].status}`)
    } else {
      console.log('✅ 用戶可以創建新申請')

      // 嘗試創建測試申請
      try {
        const testApplication = await sql`
          INSERT INTO instructor_applications (
            user_id, bio, qualifications, specialization, years_of_experience, target_audiences
          ) VALUES (
            ${testUser.id},
            '測試申請 - 這是一個測試用的個人簡介',
            '測試資格 - 相關學位和證照',
            '測試專業領域',
            3,
            '測試目標學員'
          )
          RETURNING id, status, created_at
        `

        console.log('✅ 測試申請創建成功')
        console.log(`   申請 ID: ${testApplication[0].id}`)
        console.log(`   狀態: ${testApplication[0].status}`)

        // 清理測試數據
        await sql`DELETE FROM instructor_applications WHERE id = ${testApplication[0].id}`
        console.log('🧹 測試數據已清理')

      } catch (error) {
        console.error('❌ 創建測試申請失敗:', error.message)
      }
    }

    // 檢查 API 端點是否正常工作
    console.log('\n🔗 檢查 API 端點...')

    // 模擬 API 請求檢查
    console.log('📡 模擬檢查用戶申請狀態的 API 調用...')

    const userApplicationCheck = await sql`
      SELECT * FROM instructor_applications 
      WHERE user_id = ${testUser.id}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (userApplicationCheck.length === 0) {
      console.log('✅ API 應該返回 null（無申請記錄）')
    } else {
      console.log(`✅ API 應該返回申請記錄，狀態: ${userApplicationCheck[0].status}`)
    }

  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
    process.exit(1)
  }
}

checkRegularUser()
