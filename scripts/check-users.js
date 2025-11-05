/**
 * 檢查用戶表結構和數據
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(DATABASE_URL)

async function main() {
  try {
    console.log('🔍 檢查用戶表...')

    // 檢查用戶表結構
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    console.log('📋 users 表結構:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })

    // 檢查用戶類型分布
    console.log('\n📊 用戶類型分布:')
    const userTypes = await sql`
      SELECT user_type, COUNT(*) as count
      FROM users
      GROUP BY user_type
      ORDER BY count DESC
    `

    userTypes.forEach(type => {
      console.log(`   - ${type.user_type || 'NULL'}: ${type.count} 個用戶`)
    })

    // 檢查所有用戶（前 10 個）
    console.log('\n📋 用戶範例:')
    const users = await sql`
      SELECT id, first_name, last_name, email, user_type
      FROM users
      ORDER BY id
      LIMIT 10
    `

    users.forEach(user => {
      console.log(`   - ID: ${user.id}, 姓名: ${user.first_name} ${user.last_name}, 類型: ${user.user_type || 'NULL'}`)
    })

    // 檢查是否有非講師用戶可以用作學生
    console.log('\n🔍 檢查可用作學生的用戶...')
    const potentialStudents = await sql`
      SELECT id, first_name, last_name, email, user_type
      FROM users
      WHERE user_type != 'admin' OR user_type IS NULL
      ORDER BY id
      LIMIT 5
    `

    console.log('📋 可用作學生的用戶:')
    potentialStudents.forEach(user => {
      console.log(`   - ID: ${user.id}, 姓名: ${user.first_name} ${user.last_name}, 類型: ${user.user_type || 'NULL'}`)
    })

  } catch (error) {
    console.error('❌ 錯誤:', error.message)
  }
}

main()
