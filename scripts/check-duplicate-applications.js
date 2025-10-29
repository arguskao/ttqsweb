
/**
 * 檢查重複的講師申請記錄
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

async function checkDuplicateApplications() {
  console.log('🔍 檢查重複的講師申請記錄...\n')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    // 1. 檢查所有申請記錄
    console.log('1️⃣ 檢查所有申請記錄...')
    const allApplications = await sql`
      SELECT 
        ia.*,
        u.email,
        u.first_name,
        u.last_name,
        u.user_type
      FROM instructor_applications ia
      LEFT JOIN users u ON ia.user_id = u.id
      ORDER BY ia.user_id, ia.created_at DESC
    `

    console.log(`📊 總申請數: ${allApplications.length}`)

    // 按用戶分組顯示
    const userGroups = {}
    allApplications.forEach(app => {
      if (!userGroups[app.user_id]) {
        userGroups[app.user_id] = []
      }
      userGroups[app.user_id].push(app)
    })

    console.log('\n📋 按用戶分組的申請記錄:')
    Object.keys(userGroups).forEach(userId => {
      const apps = userGroups[userId]
      const user = apps[0]

      console.log(`\n👤 用戶: ${user.email} (ID: ${userId}, 類型: ${user.user_type})`)
      console.log(`   申請數量: ${apps.length}`)

      apps.forEach((app, index) => {
        console.log(`   ${index + 1}. ID: ${app.id}, 狀態: ${app.status}, 提交: ${app.submitted_at}, 審核: ${app.reviewed_at || '未審核'}`)
      })

      // 檢查是否有重複狀態
      const statuses = apps.map(app => app.status)
      const uniqueStatuses = [...new Set(statuses)]

      if (apps.length > 1) {
        console.log('   ⚠️  該用戶有多個申請記錄')
        if (statuses.includes('approved') && statuses.includes('pending')) {
          console.log('   🚨 發現問題：同時有已批准和待審核的申請！')
        }
      }
    })

    // 2. 檢查特定問題：同一用戶有多個不同狀態的申請
    console.log('\n2️⃣ 檢查問題申請...')
    const problemUsers = await sql`
      SELECT 
        user_id,
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
      FROM instructor_applications
      GROUP BY user_id
      HAVING COUNT(*) > 1 OR (COUNT(CASE WHEN status = 'approved' THEN 1 END) > 0 AND COUNT(CASE WHEN status = 'pending' THEN 1 END) > 0)
    `

    if (problemUsers.length > 0) {
      console.log('🚨 發現問題用戶:')
      problemUsers.forEach(user => {
        console.log(`  用戶 ID ${user.user_id}: 總申請 ${user.total_applications}, 待審核 ${user.pending_count}, 已批准 ${user.approved_count}, 已拒絕 ${user.rejected_count}`)
      })
    } else {
      console.log('✅ 沒有發現問題用戶')
    }

    // 3. 檢查最近的申請（ID: 4）
    console.log('\n3️⃣ 檢查最近的申請 (ID: 4)...')
    const recentApp = await sql`
      SELECT 
        ia.*,
        u.email,
        u.user_type
      FROM instructor_applications ia
      LEFT JOIN users u ON ia.user_id = u.id
      WHERE ia.id = 4
    `

    if (recentApp.length > 0) {
      const app = recentApp[0]
      console.log('📝 申請詳情:')
      console.log(`  ID: ${app.id}`)
      console.log(`  用戶: ${app.email} (ID: ${app.user_id})`)
      console.log(`  狀態: ${app.status}`)
      console.log(`  提交時間: ${app.submitted_at}`)
      console.log(`  審核時間: ${app.reviewed_at || '未審核'}`)
      console.log(`  審核者: ${app.reviewed_by || '無'}`)
      console.log(`  用戶類型: ${app.user_type}`)
    }

    // 4. 檢查用戶類型更新
    console.log('\n4️⃣ 檢查用戶類型更新...')
    const instructorUsers = await sql`
      SELECT 
        u.id,
        u.email,
        u.user_type,
        COUNT(ia.id) as application_count,
        MAX(CASE WHEN ia.status = 'approved' THEN ia.reviewed_at END) as last_approved_at
      FROM users u
      LEFT JOIN instructor_applications ia ON u.id = ia.user_id
      WHERE u.user_type = 'instructor' OR ia.status = 'approved'
      GROUP BY u.id, u.email, u.user_type
      ORDER BY u.id
    `

    console.log('👨‍🏫 講師用戶狀態:')
    instructorUsers.forEach(user => {
      console.log(`  ${user.email}: 類型=${user.user_type}, 申請數=${user.application_count}, 最後批准=${user.last_approved_at || '無'}`)
    })

  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
    process.exit(1)
  }
}

checkDuplicateApplications()
