/**
 * 測試密碼驗證
 * 使用方法：node test-password.js <密碼> <hash>
 */

const bcrypt = require('bcryptjs')

const password = process.argv[2]
const hash = process.argv[3]

if (!password || !hash) {
  console.error('❌ 請提供密碼和 hash')
  console.log('使用方法：node test-password.js <密碼> <hash>')
  console.log('例如：node test-password.js password123 "$2b$12$..."')
  process.exit(1)
}

console.log('\n測試密碼驗證...\n')
console.log('密碼:', password)
console.log('Hash:', hash)
console.log('Hash 長度:', hash.length)
console.log('Hash 前綴:', hash.substring(0, 10))
console.log('')

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('❌ 驗證失敗:', err.message)
    process.exit(1)
  }

  if (result) {
    console.log('✅ 密碼正確！')
  } else {
    console.log('❌ 密碼錯誤！')
  }
  console.log('')
})
