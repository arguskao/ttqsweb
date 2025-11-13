/**
 * 檢查課程訊息資料
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

async function checkMessages() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔍 檢查課程訊息資料...\n')

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
      process.exit(1)
    }
    console.log('✅ course_messages 表存在\n')

    // 2. 檢查訊息總數
    console.log('2️⃣ 檢查訊息總數...')
    const totalMessages = await sql`
      SELECT COUNT(*) as count 
      FROM course_messages
    `
    console.log(`   總訊息數: ${totalMessages[0]?.count || 0}\n`)

    // 3. 檢查最近的訊息
    console.log('3️⃣ 最近的訊息記錄:')
    const recentMessages = await sql`
      SELECT 
        cm.id,
        cm.course_id,
        cm.sender_id,
        cm.recipient_id,
        cm.subject,
        cm.is_broadcast,
        cm.created_at,
        c.title as course_title,
        sender.email as sender_email,
        sender.first_name || ' ' || sender.last_name as sender_name,
        recipient.email as recipient_email,
        recipient.first_name || ' ' || recipient.last_name as recipient_name
      FROM course_messages cm
      JOIN courses c ON cm.course_id = c.id
      JOIN users sender ON cm.sender_id = sender.id
      LEFT JOIN users recipient ON cm.recipient_id = recipient.id
      ORDER BY cm.created_at DESC
      LIMIT 10
    `

    if (recentMessages.length === 0) {
      console.log('   ⚠️  沒有訊息記錄\n')
    } else {
      recentMessages.forEach((msg: any, index: number) => {
        console.log(`\n   訊息 #${index + 1}:`)
        console.log(`   ID: ${msg.id}`)
        console.log(`   課程: ${msg.course_title} (ID: ${msg.course_id})`)
        console.log(`   發送者: ${msg.sender_name} (${msg.sender_email})`)
        if (msg.is_broadcast) {
          console.log(`   收件人: 群發訊息`)
        } else {
          console.log(`   收件人: ${msg.recipient_name} (${msg.recipient_email})`)
        }
        console.log(`   主旨: ${msg.subject}`)
        console.log(`   時間: ${new Date(msg.created_at).toLocaleString('zh-TW')}`)
      })
      console.log()
    }

    // 4. 按課程統計訊息
    console.log('4️⃣ 按課程統計訊息:')
    const messagesByCourse = await sql`
      SELECT 
        c.id,
        c.title,
        COUNT(cm.id) as message_count,
        COUNT(DISTINCT cm.sender_id) as sender_count,
        COUNT(DISTINCT cm.recipient_id) as recipient_count
      FROM courses c
      LEFT JOIN course_messages cm ON c.id = cm.course_id
      GROUP BY c.id, c.title
      HAVING COUNT(cm.id) > 0
      ORDER BY message_count DESC
    `

    if (messagesByCourse.length === 0) {
      console.log('   ⚠️  沒有課程有訊息\n')
    } else {
      messagesByCourse.forEach((course: any) => {
        console.log(`   - ${course.title}: ${course.message_count} 則訊息`)
      })
      console.log()
    }

    // 5. 檢查群發訊息
    console.log('5️⃣ 群發訊息統計:')
    const broadcastMessages = await sql`
      SELECT COUNT(*) as count
      FROM course_messages
      WHERE is_broadcast = TRUE
    `
    console.log(`   群發訊息數: ${broadcastMessages[0]?.count || 0}\n`)

    // 6. 檢查單獨訊息
    console.log('6️⃣ 單獨訊息統計:')
    const directMessages = await sql`
      SELECT COUNT(*) as count
      FROM course_messages
      WHERE is_broadcast = FALSE
    `
    console.log(`   單獨訊息數: ${directMessages[0]?.count || 0}\n`)

    // 7. 檢查課程報名情況
    console.log('7️⃣ 課程報名情況:')
    const enrollments = await sql`
      SELECT 
        c.id,
        c.title,
        COUNT(ce.id) as enrollment_count
      FROM courses c
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      GROUP BY c.id, c.title
      ORDER BY enrollment_count DESC
      LIMIT 5
    `

    enrollments.forEach((course: any) => {
      console.log(`   - ${course.title}: ${course.enrollment_count} 位學員`)
    })
    console.log()

    // 8. 檢查特定課程的訊息和學員
    if (recentMessages.length > 0) {
      const firstCourseId = recentMessages[0].course_id
      console.log(`8️⃣ 檢查課程 ID ${firstCourseId} 的詳細資訊:`)
      
      const courseEnrollments = await sql`
        SELECT 
          u.id,
          u.email,
          u.first_name || ' ' || u.last_name as name
        FROM course_enrollments ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.course_id = ${firstCourseId}
      `
      
      console.log(`   學員數: ${courseEnrollments.length}`)
      if (courseEnrollments.length > 0) {
        console.log('   學員列表:')
        courseEnrollments.forEach((student: any) => {
          console.log(`   - ${student.name} (${student.email})`)
        })
      }
      
      const courseMessages = await sql`
        SELECT COUNT(*) as count
        FROM course_messages
        WHERE course_id = ${firstCourseId}
      `
      console.log(`   訊息數: ${courseMessages[0]?.count || 0}`)
      console.log()
    }

    console.log('✅ 檢查完成！')

  } catch (error) {
    console.error('❌ 檢查失敗:', error)
    process.exit(1)
  }
}

checkMessages()
