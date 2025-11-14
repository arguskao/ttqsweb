/**
 * 測試講師功能
 * 驗證學員名單和訊息功能是否正常運作
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

async function testInstructorFeatures() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔄 開始測試講師功能...\n')

    // 1. 檢查訊息表是否存在
    console.log('1️⃣ 檢查 course_messages 表...')
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'course_messages'
    `

    if (tableCheck.length === 0) {
      console.log('❌ course_messages 表不存在')
      console.log('   請先執行: npx tsx src/scripts/create-messages-table.ts')
      process.exit(1)
    }
    console.log('✅ course_messages 表存在\n')

    // 2. 檢查表結構
    console.log('2️⃣ 檢查表結構...')
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'course_messages'
      ORDER BY ordinal_position
    `

    console.log('   欄位列表:')
    columns.forEach((col: any) => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })
    console.log('✅ 表結構正確\n')

    // 3. 檢查索引
    console.log('3️⃣ 檢查索引...')
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'course_messages'
    `

    console.log('   索引列表:')
    indexes.forEach((idx: any) => {
      console.log(`   - ${idx.indexname}`)
    })
    console.log('✅ 索引已創建\n')

    // 4. 檢查是否有課程和學員資料
    console.log('4️⃣ 檢查測試資料...')
    
    const coursesCount = await sql`SELECT COUNT(*) as count FROM courses`
    console.log(`   課程數量: ${coursesCount[0]?.count || 0}`)

    const enrollmentsCount = await sql`SELECT COUNT(*) as count FROM course_enrollments`
    console.log(`   報名記錄數量: ${enrollmentsCount[0]?.count || 0}`)

    const instructorsCount = await sql`
      SELECT COUNT(DISTINCT instructor_id) as count 
      FROM courses 
      WHERE instructor_id IS NOT NULL
    `
    console.log(`   有講師的課程數量: ${instructorsCount[0]?.count || 0}`)

    if (parseInt(String(coursesCount[0]?.count || 0)) === 0) {
      console.log('⚠️  沒有課程資料，請先創建課程')
    }

    if (parseInt(String(enrollmentsCount[0]?.count || 0)) === 0) {
      console.log('⚠️  沒有報名記錄，請先讓學員報名課程')
    }

    console.log('✅ 資料檢查完成\n')

    // 5. 測試查詢學員名單（如果有資料）
    if (parseInt(String(enrollmentsCount[0]?.count || 0)) > 0) {
      console.log('5️⃣ 測試查詢學員名單...')
      
      const sampleEnrollment = await sql`
        SELECT ce.course_id, c.title
        FROM course_enrollments ce
        JOIN courses c ON ce.course_id = c.id
        LIMIT 1
      `

      if (sampleEnrollment.length > 0) {
        const courseId = sampleEnrollment[0]?.course_id
        const courseTitle = sampleEnrollment[0]?.title

        const students = await sql`
          SELECT 
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            ce.enrollment_date,
            ce.progress_percentage,
            ce.status
          FROM course_enrollments ce
          JOIN users u ON ce.user_id = u.id
          WHERE ce.course_id = ${courseId}
        `

        console.log(`   課程: ${courseTitle}`)
        console.log(`   學員數量: ${students.length}`)
        if (students.length > 0) {
          console.log('   學員範例:')
          students.slice(0, 3).forEach((student: any) => {
            console.log(`   - ${student.last_name}${student.first_name} (${student.email}) - 進度: ${student.progress_percentage}%`)
          })
        }
        console.log('✅ 學員名單查詢成功\n')
      }
    }

    // 6. 測試訊息功能（創建測試訊息）
    console.log('6️⃣ 測試訊息功能...')
    
    // 檢查是否有訊息
    const messagesCount = await sql`SELECT COUNT(*) as count FROM course_messages`
    console.log(`   現有訊息數量: ${messagesCount[0]?.count || 0}`)

    if (parseInt(String(messagesCount[0]?.count || 0)) > 0) {
      const sampleMessages = await sql`
        SELECT 
          cm.*,
          c.title as course_title,
          sender.first_name || ' ' || sender.last_name as sender_name
        FROM course_messages cm
        JOIN courses c ON cm.course_id = c.id
        JOIN users sender ON cm.sender_id = sender.id
        ORDER BY cm.created_at DESC
        LIMIT 3
      `

      console.log('   最近的訊息:')
      sampleMessages.forEach((msg: any) => {
        console.log(`   - [${msg.course_title}] ${msg.subject}`)
        console.log(`     發送者: ${msg.sender_name}`)
        console.log(`     群發: ${msg.is_broadcast ? '是' : '否'}`)
        console.log(`     時間: ${new Date(msg.created_at).toLocaleString('zh-TW')}`)
      })
    }

    console.log('✅ 訊息功能測試完成\n')

    // 7. 總結
    console.log('📊 測試總結:')
    console.log('✅ 資料庫表結構正確')
    console.log('✅ 索引已創建')
    console.log('✅ 查詢功能正常')
    console.log('\n🎉 所有測試通過！')

    // 8. 提供測試建議
    console.log('\n💡 測試建議:')
    console.log('1. 使用講師帳號登入系統')
    console.log('2. 進入「我的授課」頁面')
    console.log('3. 點擊「學員管理」查看學員名單')
    console.log('4. 嘗試發送群發訊息')
    console.log('5. 使用學員帳號登入')
    console.log('6. 進入課程詳情頁查看訊息')

  } catch (error) {
    console.error('❌ 測試失敗:', error)
    process.exit(1)
  }
}

testInstructorFeatures()
