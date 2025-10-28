import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

async function updatePassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔧 更新密碼...\n')

    const email = 'wii543@gmail.com'
    const newPassword = 'ppt11567'

    // 生成新的bcrypt哈希
    const newHash = await bcrypt.hash(newPassword, 12)
    console.log(`新密碼: ${newPassword}`)
    console.log(`哈希長度: ${newHash.length}`)

    // 更新數據庫
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING email, user_type',
      [newHash, email]
    )

    if (result.rows.length > 0) {
      console.log(`✅ 密碼已更新: ${result.rows[0].email}`)
      console.log(`用戶類型: ${result.rows[0].user_type}`)

      // 驗證新密碼
      const verifyResult = await pool.query('SELECT password_hash FROM users WHERE email = $1', [
        email
      ])

      const isValid = await bcrypt.compare(newPassword, verifyResult.rows[0].password_hash)
      console.log(`驗證新密碼: ${isValid ? '✅ 成功' : '❌ 失敗'}`)

      console.log('\n✅ 完成！新密碼: ppt11567')
    } else {
      console.log('❌ 更新失敗')
    }
  } catch (error) {
    console.error('❌ 錯誤:', error)
  } finally {
    await pool.end()
  }
}

updatePassword()
