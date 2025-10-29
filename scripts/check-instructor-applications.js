
/**
 * 檢查講師申請數據庫記錄
 * 用於驗證申請是否真的存入了數據庫
 */

import { neon } from '@neondatabase/serverless'

async function checkInstructorApplications() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 環境變數未設置')
    process.exit(1)
  }

  console.log('🔍 正在檢查講師申請數據庫記錄...')

  try {
    const sql = neon(databaseUrl)

    // 1. 檢查表是否存在
    console.log('\n📋 檢查 instructor_applications 表是否存在...')
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instructor_applications'
      ) as table_exists
    `

    console.log('表存在:', tableCheck[0]?.table_exists ? '✅ 是' : '❌ 否')

    if (!tableCheck[0]?.table_exists) {
      console.log('❌ instructor_applications 表不存在！')
      return
    }

    // 2. 查詢所有申請記錄
    console.log('\n📊 查詢所有講師申請記錄...')
    const allApplications = await sql`
      SELECT 
        id,
        user_id,
        bio,
        qualifications,
        specialization,
        years_of_experience,
        target_audiences,
        status,
        submitted_at,
        created_at
      FROM instructor_applications 
      ORDER BY submitted_at DESC
    `

    console.log(`找到 ${allApplications.length} 筆申請記錄:`)

    if (allApplications.length === 0) {
      console.log('❌ 沒有找到任何申請記錄！')
    } else {
      allApplications.forEach((app, index) => {
        console.log(`\n📝 申請 #${index + 1}:`)
        console.log(`  ID: ${app.id}`)
        console.log(`  用戶 ID: ${app.user_id}`)
        console.log(`  狀態: ${app.status}`)
        console.log(`  專業領域: ${app.specialization}`)
        console.log(`  工作經驗: ${app.years_of_experience} 年`)
        console.log(`  提交時間: ${app.submitted_at}`)
        console.log(`  創建時間: ${app.created_at}`)
        console.log(`  簡介: ${app.bio?.substring(0, 50)}...`)
        console.log(`  資格: ${app.qualifications?.substring(0, 50)}...`)
      })
    }

    // 3. 查詢特定用戶的申請（用戶 ID 20）
    console.log('\n👤 查詢用戶 ID 20 的申請記錄...')
    const user20Applications = await sql`
      SELECT 
        id,
        user_id,
        bio,
        qualifications,
        specialization,
        years_of_experience,
        target_audiences,
        status,
        submitted_at,
        created_at
      FROM instructor_applications 
      WHERE user_id = 20
      ORDER BY submitted_at DESC
    `

    console.log(`用戶 ID 20 有 ${user20Applications.length} 筆申請記錄:`)

    if (user20Applications.length === 0) {
      console.log('❌ 用戶 ID 20 沒有申請記錄！')
    } else {
      user20Applications.forEach((app, index) => {
        console.log(`\n📝 用戶 20 的申請 #${index + 1}:`)
        console.log(`  ID: ${app.id}`)
        console.log(`  狀態: ${app.status}`)
        console.log(`  專業領域: ${app.specialization}`)
        console.log(`  工作經驗: ${app.years_of_experience} 年`)
        console.log(`  提交時間: ${app.submitted_at}`)
        console.log(`  簡介: ${app.bio}`)
        console.log(`  資格: ${app.qualifications}`)
        console.log(`  面對族群: ${app.target_audiences}`)
      })
    }

    // 4. 檢查 users 表中的用戶
    console.log('\n👥 檢查 users 表中的用戶...')
    const users = await sql`
      SELECT id, email, first_name, last_name, user_type
      FROM users 
      WHERE id = 20
    `

    if (users.length === 0) {
      console.log('❌ 用戶 ID 20 在 users 表中不存在！')
    } else {
      const user = users[0]
      console.log('✅ 用戶 ID 20 存在:')
      console.log(`  姓名: ${user.first_name} ${user.last_name}`)
      console.log(`  郵箱: ${user.email}`)
      console.log(`  類型: ${user.user_type}`)
    }
  } catch (error) {
    console.error('❌ 查詢數據庫時發生錯誤:', error)
  }
}

// 執行檢查
checkInstructorApplications()
  .then(() => {
    console.log('\n✅ 檢查完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ 檢查失敗:', error)
    process.exit(1)
  })
