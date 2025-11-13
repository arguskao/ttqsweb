/**
 * 測試訊息 API
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

async function testMessageAPI() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🧪 測試訊息 API 邏輯...\n')

    // 1. 獲取測試資料
    console.log('1️⃣ 獲取測試資料...')
    const testMessage = await sql`
      SELECT 
        cm.*,
        c.title as course_title,
        sender.email as sender_email,
        recipient.email as recipient_email,
        recipient.id as recipient_user_id
      FROM course_messages cm
      JOIN courses c ON cm.course_id = c.id
      JOIN users sender ON cm.sender_id = sender.id
      LEFT JOIN users recipient ON cm.recipient_id = recipient.id
      ORDER BY cm.created_at DESC
      LIMIT 1
    `

    if (testMessage.length === 0) {
      console.log('❌ 沒有訊息可測試')
      process.exit(1)
    }

    const msg = testMessage[0]
    if (!msg) {
      console.log('❌ 無法獲取訊息資料')
      process.exit(1)
    }

    console.log(`   課程: ${msg.course_title} (ID: ${msg.course_id})`)
    console.log(`   發送者: ${msg.sender_email}`)
    console.log(`   收件人: ${msg.recipient_email} (User ID: ${msg.recipient_user_id})`)
    console.log(`   群發: ${msg.is_broadcast}\n`)

    // 2. 模擬 API 查詢（使用收件人的 userId）
    const courseId = msg.course_id
    const userId = msg.recipient_user_id

    console.log('2️⃣ 模擬 API 查詢...')
    console.log(`   課程 ID: ${courseId}`)
    console.log(`   用戶 ID: ${userId}\n`)

    const messages = await sql`
      SELECT 
        cm.*,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        sender.email as sender_email
      FROM course_messages cm
      JOIN users sender ON cm.sender_id = sender.id
      WHERE cm.course_id = ${courseId}
        AND (cm.recipient_id = ${userId} OR cm.is_broadcast = TRUE)
      ORDER BY cm.created_at DESC
    `

    console.log(`3️⃣ 查詢結果: 找到 ${messages.length} 則訊息\n`)

    if (messages.length > 0) {
      console.log('   訊息列表:')
      messages.forEach((m: any, index: number) => {
        console.log(`   ${index + 1}. ${m.subject}`)
        console.log(`      發送者: ${m.sender_first_name} ${m.sender_last_name}`)
        console.log(`      群發: ${m.is_broadcast}`)
        console.log(`      收件人 ID: ${m.recipient_id}`)
      })
      console.log()
    }

    // 4. 檢查報名狀態
    console.log('4️⃣ 檢查報名狀態...')
    const enrollment = await sql`
      SELECT *
      FROM course_enrollments
      WHERE course_id = ${courseId} AND user_id = ${userId}
    `

    const enrollmentData = enrollment as any[]
    if (enrollmentData.length === 0) {
      console.log('   ❌ 用戶未報名此課程')
      console.log('   這可能是問題所在！前端會阻止訊息載入。\n')
    } else {
      console.log('   ✅ 用戶已報名此課程')
      console.log(`   狀態: ${enrollmentData[0].status}`)
      console.log(`   進度: ${enrollmentData[0].progress_percentage}%\n`)
    }

    // 5. 測試所有學員
    console.log('5️⃣ 測試課程所有學員...')
    const allStudents = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name || ' ' || u.last_name as name
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.course_id = ${courseId}
    `

    console.log(`   課程共有 ${allStudents.length} 位學員\n`)

    for (const student of allStudents as any[]) {
      const studentMessages = await sql`
        SELECT COUNT(*) as count
        FROM course_messages
        WHERE course_id = ${courseId}
          AND (recipient_id = ${student.id} OR is_broadcast = TRUE)
      `
      
      console.log(`   - ${student.name} (${student.email}):`)
      console.log(`     可見訊息數: ${studentMessages[0]?.count || 0}`)
    }

    console.log('\n✅ 測試完成！')

    // 6. 診斷建議
    console.log('\n💡 診斷建議:')
    if (enrollmentData.length === 0) {
      console.log('   ⚠️  問題：用戶未報名課程')
      console.log('   解決方案：')
      console.log('   1. 確認用戶已報名課程')
      console.log('   2. 檢查前端是否正確處理報名狀態')
      console.log('   3. 考慮移除前端的報名狀態檢查，讓後端處理')
    } else if (messages.length === 0) {
      console.log('   ⚠️  問題：SQL 查詢沒有返回訊息')
      console.log('   解決方案：')
      console.log('   1. 檢查 recipient_id 是否正確')
      console.log('   2. 檢查 course_id 是否正確')
      console.log('   3. 檢查訊息是否真的存在於資料庫')
    } else {
      console.log('   ✅ API 邏輯正常，訊息可以正確查詢')
      console.log('   如果前端看不到訊息，可能是：')
      console.log('   1. 前端的報名狀態檢查過於嚴格')
      console.log('   2. Token 中的 userId 不正確')
      console.log('   3. 前端 API 請求的 courseId 不正確')
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error)
    process.exit(1)
  }
}

testMessageAPI()
