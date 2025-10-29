
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

async function fixInstructorData() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔧 開始修復講師資料不一致問題...\n')

    // 1. 清理測試數據
    console.log('🧹 清理測試數據:')

    // 刪除沒有對應用戶的講師記錄
    const testInstructors = await sql`
      SELECT * FROM instructors 
      WHERE email NOT IN (SELECT email FROM users)
    `

    if (testInstructors.length > 0) {
      console.log(`  發現 ${testInstructors.length} 個沒有對應用戶的講師記錄:`)
      testInstructors.forEach(instructor => {
        console.log(`    - ${instructor.first_name} ${instructor.last_name} (${instructor.email})`)
      })

      const confirm = process.argv.includes('--confirm')
      if (confirm) {
        await sql`
          DELETE FROM instructors 
          WHERE email NOT IN (SELECT email FROM users)
        `
        console.log('  ✅ 已刪除測試數據')
      } else {
        console.log('  ⚠️  使用 --confirm 參數來執行刪除操作')
      }
    } else {
      console.log('  ✅ 沒有發現測試數據')
    }

    // 2. 檢查表結構並修復
    console.log('\n🔧 檢查和修復表結構:')

    // 檢查 instructors 表是否有 user_id 欄位
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'instructors' AND column_name = 'user_id'
    `

    if (columns.length === 0) {
      console.log('  ⚠️  instructors 表缺少 user_id 欄位')

      const confirm = process.argv.includes('--confirm')
      if (confirm) {
        // 添加 user_id 欄位
        await sql`
          ALTER TABLE instructors 
          ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        `

        // 添加其他缺少的欄位
        await sql`
          ALTER TABLE instructors 
          ADD COLUMN IF NOT EXISTS bio TEXT,
          ADD COLUMN IF NOT EXISTS qualifications TEXT,
          ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS application_status VARCHAR(20) DEFAULT 'approved',
          ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP,
          ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
          ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
          ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0
        `

        console.log('  ✅ 已添加缺少的欄位')
      } else {
        console.log('  ⚠️  使用 --confirm 參數來執行表結構修復')
      }
    } else {
      console.log('  ✅ 表結構正常')
    }

    // 3. 為已批准的申請創建講師記錄
    console.log('\n👨‍🏫 為已批准的申請創建講師記錄:')

    const approvedApplications = await sql`
      SELECT ia.*, u.first_name, u.last_name, u.email
      FROM instructor_applications ia
      JOIN users u ON ia.user_id = u.id
      WHERE ia.status = 'approved'
    `

    if (approvedApplications.length > 0) {
      console.log(`  發現 ${approvedApplications.length} 個已批准的申請:`)

      for (const app of approvedApplications) {
        console.log(`    - ${app.first_name} ${app.last_name} (${app.email})`)

        // 檢查是否已經有講師記錄
        const existingInstructor = await sql`
          SELECT id FROM instructors WHERE email = ${app.email}
        `

        if (existingInstructor.length === 0) {
          const confirm = process.argv.includes('--confirm')
          if (confirm) {
            // 創建講師記錄
            await sql`
              INSERT INTO instructors (
                user_id, first_name, last_name, email, specialization, 
                experience_years, bio, qualifications, years_of_experience,
                application_status, approval_date, approved_by, 
                average_rating, total_ratings, is_active, created_at, updated_at
              )
              VALUES (
                ${app.user_id}, ${app.first_name}, ${app.last_name}, ${app.email},
                ${app.specialization}, ${app.years_of_experience || 0},
                ${app.bio}, ${app.qualifications}, ${app.years_of_experience || 0},
                'approved', ${app.reviewed_at}, ${app.reviewed_by},
                0.00, 0, true, NOW(), NOW()
              )
            `
            console.log('      ✅ 已創建講師記錄')
          } else {
            console.log('      ⚠️  需要創建講師記錄（使用 --confirm 執行）')
          }
        } else {
          console.log('      ✅ 講師記錄已存在')
        }
      }
    } else {
      console.log('  沒有已批准的申請需要處理')
    }

    // 4. 驗證修復結果
    console.log('\n✅ 修復完成，驗證結果:')

    const finalApplications = await sql`
      SELECT COUNT(*) as count FROM instructor_applications WHERE status = 'approved'
    `

    const finalInstructors = await sql`
      SELECT COUNT(*) as count FROM instructors
    `

    const finalInstructorUsers = await sql`
      SELECT COUNT(*) as count FROM users WHERE user_type = 'instructor'
    `

    console.log(`  已批准申請: ${finalApplications[0]?.count || 0}`)
    console.log(`  講師記錄: ${finalInstructors[0]?.count || 0}`)
    console.log(`  講師用戶: ${finalInstructorUsers[0]?.count || 0}`)

    if (!process.argv.includes('--confirm')) {
      console.log('\n⚠️  這是預覽模式，使用 --confirm 參數來實際執行修復操作')
    }

  } catch (error) {
    console.error('❌ 修復失敗:', error)
    process.exit(1)
  }
}

// 執行修復
fixInstructorData()
  .then(() => {
    console.log('\n✅ 修復完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ 執行失敗:', error)
    process.exit(1)
  })
