import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

async function checkUserInstructorStatus() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('檢查用戶 wii543@gmail.com 的講師申請狀態...')

    const result = await sql`
      SELECT 
        ia.id,
        ia.user_id,
        ia.status,
        ia.submitted_at,
        ia.reviewed_at,
        ia.review_notes,
        u.email,
        u.user_type,
        u.first_name,
        u.last_name
      FROM instructor_applications ia
      JOIN users u ON ia.user_id = u.id
      WHERE u.email = 'wii543@gmail.com'
    `

    if (result.length === 0) {
      console.log('❌ 用戶沒有講師申請記錄')

      // 檢查用戶是否存在
      const userCheck = await sql`
        SELECT id, email, user_type, first_name, last_name
        FROM users
        WHERE email = 'wii543@gmail.com'
      `

      if (userCheck.length > 0) {
        console.log('✅ 用戶存在:', userCheck[0])
        console.log('💡 建議：用戶需要先申請成為講師')
      } else {
        console.log('❌ 用戶不存在')
      }
    } else {
      console.log('✅ 找到講師申請記錄:')
      result.forEach(app => {
        console.log(`- ID: ${app.id}`)
        console.log(`- 狀態: ${app.status}`)
        console.log(`- 提交時間: ${app.submitted_at}`)
        console.log(`- 審核時間: ${app.reviewed_at || '未審核'}`)
        console.log(`- 審核備註: ${app.review_notes || '無'}`)
        console.log(`- 用戶類型: ${app.user_type}`)
        console.log('---')
      })
    }
  } catch (error) {
    console.error('檢查失敗:', error)
  }
}

checkUserInstructorStatus()
