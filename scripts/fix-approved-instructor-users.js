
/**
 * 修復已批准申請但用戶類型未更新的講師
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

async function fixApprovedInstructorUsers() {
  console.log('🔧 修復已批准申請但用戶類型未更新的講師...\n')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    // 1. 找出已批准申請但用戶類型不是 instructor 的用戶
    console.log('1️⃣ 查找需要修復的用戶...')
    const usersToFix = await sql`
      SELECT 
        u.id,
        u.email,
        u.user_type,
        ia.id as application_id,
        ia.status,
        ia.reviewed_at
      FROM users u
      INNER JOIN instructor_applications ia ON u.id = ia.user_id
      WHERE ia.status = 'approved' AND u.user_type != 'instructor'
      ORDER BY ia.reviewed_at DESC
    `

    console.log(`📊 找到 ${usersToFix.length} 個需要修復的用戶:`)
    usersToFix.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}): 當前類型=${user.user_type}, 申請ID=${user.application_id}, 批准時間=${user.reviewed_at}`)
    })

    if (usersToFix.length === 0) {
      console.log('✅ 沒有需要修復的用戶')
      return
    }

    // 2. 確認修復
    console.log('\n⚠️  即將將這些用戶的類型更新為 "instructor"')

    // 在實際環境中，這裡應該有用戶確認步驟
    // 為了自動化，我們直接執行修復

    console.log('\n2️⃣ 開始修復用戶類型...')

    for (const user of usersToFix) {
      try {
        console.log(`🔄 修復用戶: ${user.email}`)

        const updateResult = await sql`
          UPDATE users 
          SET user_type = 'instructor', updated_at = NOW()
          WHERE id = ${user.id}
          RETURNING id, email, user_type
        `

        if (updateResult.length > 0) {
          console.log(`  ✅ 成功更新: ${updateResult[0].email} -> ${updateResult[0].user_type}`)
        } else {
          console.log(`  ❌ 更新失敗: ${user.email}`)
        }

      } catch (error) {
        console.error(`  ❌ 更新用戶 ${user.email} 時出錯:`, error.message)
      }
    }

    // 3. 驗證修復結果
    console.log('\n3️⃣ 驗證修復結果...')
    const verificationResult = await sql`
      SELECT 
        u.id,
        u.email,
        u.user_type,
        ia.status,
        ia.reviewed_at
      FROM users u
      INNER JOIN instructor_applications ia ON u.id = ia.user_id
      WHERE ia.status = 'approved'
      ORDER BY ia.reviewed_at DESC
    `

    console.log('📋 修復後的狀態:')
    verificationResult.forEach(user => {
      const status = user.user_type === 'instructor' ? '✅' : '❌'
      console.log(`  ${status} ${user.email}: 類型=${user.user_type}, 申請狀態=${user.status}`)
    })

    // 4. 檢查是否還有不一致的記錄
    const remainingIssues = verificationResult.filter(user => user.user_type !== 'instructor')

    if (remainingIssues.length === 0) {
      console.log('\n🎉 所有已批准的申請用戶類型都已正確更新為 instructor！')
    } else {
      console.log(`\n⚠️  仍有 ${remainingIssues.length} 個用戶需要手動檢查`)
    }

    // 5. 顯示最終統計
    console.log('\n📊 最終統計:')
    const finalStats = await sql`
      SELECT 
        COUNT(*) as total_approved,
        COUNT(CASE WHEN u.user_type = 'instructor' THEN 1 END) as correct_type_count
      FROM instructor_applications ia
      INNER JOIN users u ON ia.user_id = u.id
      WHERE ia.status = 'approved'
    `

    const stats = finalStats[0]
    console.log(`  已批准申請總數: ${stats.total_approved}`)
    console.log(`  用戶類型正確數: ${stats.correct_type_count}`)
    console.log(`  修復成功率: ${((stats.correct_type_count / stats.total_approved) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('❌ 修復過程中發生錯誤:', error.message)
    process.exit(1)
  }
}

fixApprovedInstructorUsers()
