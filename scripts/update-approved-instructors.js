import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

async function updateApprovedInstructors() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('更新已批准講師的用戶類型...')

    // 先查看需要更新的用戶
    const usersToUpdate = await sql`
      SELECT 
        u.id,
        u.email,
        u.user_type,
        u.first_name,
        u.last_name,
        ia.status,
        ia.submitted_at,
        ia.reviewed_at
      FROM users u
      JOIN instructor_applications ia ON u.id = ia.user_id
      WHERE ia.status = 'approved' AND u.user_type != 'instructor'
    `

    console.log(`找到 ${usersToUpdate.length} 個需要更新的用戶:`)
    usersToUpdate.forEach(user => {
      console.log(
        `- ${user.email} (${user.first_name} ${user.last_name}) - 當前類型: ${user.user_type}`
      )
    })

    if (usersToUpdate.length > 0) {
      // 更新用戶類型
      const result = await sql`
        UPDATE users 
        SET user_type = 'instructor'
        WHERE id IN (
          SELECT ia.user_id 
          FROM instructor_applications ia 
          WHERE ia.status = 'approved'
        )
      `

      console.log(`✅ 成功更新 ${result.count || usersToUpdate.length} 個用戶的類型為 'instructor'`)

      // 驗證更新結果
      const updatedUsers = await sql`
        SELECT 
          u.id,
          u.email,
          u.user_type,
          u.first_name,
          u.last_name
        FROM users u
        JOIN instructor_applications ia ON u.id = ia.user_id
        WHERE ia.status = 'approved'
      `

      console.log('\n更新後的用戶列表:')
      updatedUsers.forEach(user => {
        console.log(
          `- ${user.email} (${user.first_name} ${user.last_name}) - 類型: ${user.user_type}`
        )
      })
    } else {
      console.log('✅ 所有已批准的講師用戶類型都已經正確')
    }
  } catch (error) {
    console.error('更新失敗:', error)
  }
}

updateApprovedInstructors()
