/**
 * 生成 bcrypt 密碼 hash
 * 使用方法：node generate-password-hash.js <密碼>
 * 例如：node generate-password-hash.js password123
 */

const bcrypt = require('bcryptjs')

const password = process.argv[2]

if (!password) {
  console.error('❌ 請提供密碼')
  console.log('使用方法：node generate-password-hash.js <密碼>')
  console.log('例如：node generate-password-hash.js password123')
  process.exit(1)
}

const saltRounds = 12

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('❌ 生成 hash 失敗:', err)
    process.exit(1)
  }

  console.log('\n✅ 密碼 hash 生成成功！\n')
  console.log('密碼:', password)
  console.log('Hash:', hash)
  console.log('\n使用以下 SQL 更新用戶密碼：\n')
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'user@example.com';`)
  console.log('\n')
})
