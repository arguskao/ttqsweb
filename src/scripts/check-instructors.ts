
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

async function checkInstructors() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔍 正在查詢講師資料...\n')

    // 查詢講師申請表
    console.log('📋 講師申請統計:')
    const applicationStats = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM instructor_applications 
      GROUP BY status
      ORDER BY status
    `

    if (applicationStats.length > 0) {
      applicationStats.forEach(stat => {
        const statusText = {
          'pending': '待審核',
          'approved': '已批准',
          'rejected': '已拒絕'
        }[stat.status] || stat.status

        console.log(`  ${statusText}: ${stat.count} 個`)
      })
    } else {
      console.log('  沒有申請記錄')
    }

    // 查詢講師表
    console.log('\n👨‍🏫 正式講師統計:')
    const instructorStats = await sql`
      SELECT 
        is_active,
        COUNT(*) as count
      FROM instructors 
      GROUP BY is_active
      ORDER BY is_active DESC
    `

    if (instructorStats.length > 0) {
      instructorStats.forEach(stat => {
        const statusText = stat.is_active ? '啟用中' : '已停用'
        console.log(`  ${statusText}: ${stat.count} 個`)
      })
    } else {
      console.log('  沒有正式講師記錄')
    }

    // 查詢總數
    const totalInstructors = await sql`
      SELECT COUNT(*) as total FROM instructors
    `

    const totalApplications = await sql`
      SELECT COUNT(*) as total FROM instructor_applications
    `

    console.log('\n📊 總計:')
    console.log(`  講師申請總數: ${totalApplications[0]?.total || 0}`)
    console.log(`  正式講師總數: ${totalInstructors[0]?.total || 0}`)

    // 先檢查 instructors 表結構
    console.log('\n� 檢師查 instructors 表結構:')
    try {
      const tableStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'instructors' 
        ORDER BY ordinal_position
      `

      if (tableStructure.length > 0) {
        console.log('  欄位列表:')
        tableStructure.forEach(col => {
          console.log(`    ${col.column_name} (${col.data_type})`)
        })
      } else {
        console.log('  instructors 表不存在')
      }
    } catch (error) {
      console.log('  無法查詢表結構:', error.message)
    }

    // 查詢詳細講師資訊 - 使用簡單查詢
    console.log('\n📝 講師詳細資訊:')
    try {
      const instructorDetails = await sql`
        SELECT * FROM instructors
        ORDER BY created_at DESC
      `

      if (instructorDetails.length > 0) {
        instructorDetails.forEach((instructor, index) => {
          console.log(`\n  ${index + 1}. 講師 ID: ${instructor.id}`)
          console.log('     資料:', JSON.stringify(instructor, null, 6))
        })
      } else {
        console.log('  沒有講師資料')
      }
    } catch (error) {
      console.log('  查詢講師詳細資訊失敗:', error.message)
    }

    // 查詢用戶類型統計
    console.log('\n👥 用戶類型統計:')
    const userTypeStats = await sql`
      SELECT 
        user_type,
        COUNT(*) as count
      FROM users 
      GROUP BY user_type
      ORDER BY count DESC
    `

    if (userTypeStats.length > 0) {
      userTypeStats.forEach(stat => {
        const typeText = {
          'admin': '管理員',
          'instructor': '講師',
          'job_seeker': '求職者',
          'employer': '雇主'
        }[stat.user_type] || stat.user_type

        console.log(`  ${typeText}: ${stat.count} 個`)
      })
    }

  } catch (error) {
    console.error('❌ 查詢失敗:', error)
    process.exit(1)
  }
}

// 執行查詢
checkInstructors()
  .then(() => {
    console.log('\n✅ 查詢完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ 執行失敗:', error)
    process.exit(1)
  })
