
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

async function analyzeInstructorData() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔍 分析講師資料不一致問題...\n')

    // 1. 檢查所有表是否存在
    console.log('📋 檢查相關表是否存在:')
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'instructors', 'instructor_applications')
      ORDER BY table_name
    `

    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name} 表存在`)
    })

    // 2. 檢查 instructor_applications 表的詳細資料
    console.log('\n📝 講師申請詳細資料:')
    const applications = await sql`
      SELECT 
        ia.*,
        u.first_name,
        u.last_name,
        u.email,
        u.user_type
      FROM instructor_applications ia
      LEFT JOIN users u ON ia.user_id = u.id
      ORDER BY ia.submitted_at DESC
    `

    if (applications.length > 0) {
      applications.forEach((app, index) => {
        console.log(`\n  申請 ${index + 1}:`)
        console.log(`    ID: ${app.id}`)
        console.log(`    用戶ID: ${app.user_id}`)
        console.log(`    申請人: ${app.first_name} ${app.last_name}`)
        console.log(`    Email: ${app.email}`)
        console.log(`    用戶類型: ${app.user_type}`)
        console.log(`    申請狀態: ${app.status}`)
        console.log(`    專業領域: ${app.specialization}`)
        console.log(`    提交時間: ${app.submitted_at}`)
        console.log(`    審核時間: ${app.reviewed_at || '未審核'}`)
      })
    } else {
      console.log('  沒有申請記錄')
    }

    // 3. 檢查 instructors 表的詳細資料
    console.log('\n👨‍🏫 講師表詳細資料:')
    const instructors = await sql`
      SELECT ia.*, u.first_name, u.last_name, u.email 
      FROM instructor_applications ia
      JOIN users u ON ia.user_id = u.id
      ORDER BY ia.created_at DESC
    `

    if (instructors.length > 0) {
      instructors.forEach((instructor, index) => {
        console.log(`\n  講師 ${index + 1}:`)
        console.log(`    ID: ${instructor.id}`)
        console.log(`    姓名: ${instructor.first_name} ${instructor.last_name}`)
        console.log(`    Email: ${instructor.email}`)
        console.log(`    專業領域: ${instructor.specialization}`)
        console.log(`    工作年資: ${instructor.experience_years} 年`)
        console.log(`    狀態: ${instructor.is_active ? '啟用' : '停用'}`)
        console.log(`    創建時間: ${instructor.created_at}`)
      })
    }

    // 4. 檢查用戶表中講師類型的用戶
    console.log('\n👤 用戶表中的講師用戶:')
    const instructorUsers = await sql`
      SELECT id, first_name, last_name, email, user_type, created_at
      FROM users 
      WHERE user_type = 'instructor'
      ORDER BY created_at DESC
    `

    if (instructorUsers.length > 0) {
      instructorUsers.forEach((user, index) => {
        console.log(`\n  講師用戶 ${index + 1}:`)
        console.log(`    用戶ID: ${user.id}`)
        console.log(`    姓名: ${user.first_name} ${user.last_name}`)
        console.log(`    Email: ${user.email}`)
        console.log(`    用戶類型: ${user.user_type}`)
        console.log(`    創建時間: ${user.created_at}`)
      })
    } else {
      console.log('  沒有講師類型的用戶')
    }

    // 5. 交叉比對分析
    console.log('\n🔍 數據一致性分析:')

    // 檢查 instructors 表中的 email 是否在 users 表中存在
    console.log('\n  檢查講師表中的用戶是否存在於用戶表:')
    for (const instructor of instructors) {
      const user = await sql`
        SELECT id, user_type FROM users WHERE email = ${instructor.email}
      `

      if (user.length > 0) {
        console.log(`    ✅ ${instructor.email} - 用戶ID: ${user[0]?.id}, 類型: ${user[0]?.user_type}`)
      } else {
        console.log(`    ❌ ${instructor.email} - 在用戶表中不存在`)
      }
    }

    // 6. 檢查是否有孤立的數據
    console.log('\n  檢查孤立數據:')

    // 檢查 instructor_applications 中的 user_id 是否都存在於 users 表
    for (const app of applications) {
      const user = await sql`
        SELECT id, user_type FROM users WHERE id = ${app.user_id}
      `

      if (user.length === 0) {
        console.log(`    ❌ 申請ID ${app.id} 關聯的用戶ID ${app.user_id} 不存在`)
      }
    }

    // 7. 建議修復方案
    console.log('\n💡 問題分析和建議:')

    if (instructors.length > applications.filter(app => app.status === 'approved').length) {
      console.log('  ⚠️  講師表中的記錄數量多於已批准的申請數量')
      console.log('     可能原因:')
      console.log('     1. 有測試數據直接插入到講師表')
      console.log('     2. 數據遷移時創建了額外的講師記錄')
      console.log('     3. 某些講師記錄是通過其他方式創建的')
    }

    if (instructorUsers.length < instructors.length) {
      console.log('  ⚠️  用戶表中講師類型的用戶少於講師表中的記錄')
      console.log('     可能原因:')
      console.log('     1. 講師表中的某些記錄沒有對應的用戶')
      console.log('     2. 用戶類型沒有正確更新為 instructor')
    }

  } catch (error) {
    console.error('❌ 分析失敗:', error)
    process.exit(1)
  }
}

// 執行分析
analyzeInstructorData()
  .then(() => {
    console.log('\n✅ 分析完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ 執行失敗:', error)
    process.exit(1)
  })
