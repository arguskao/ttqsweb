/**
 * 檢查評價表結構
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(DATABASE_URL)

async function main() {
  try {
    console.log('🔍 檢查 instructor_ratings 表結構...')

    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'instructor_ratings'
      ORDER BY ordinal_position
    `

    console.log('📋 欄位結構:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

    // 檢查外鍵約束
    const constraints = await sql`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'instructor_ratings'
    `

    console.log('\n📋 外鍵約束:')
    constraints.forEach(constraint => {
      console.log(`   - ${constraint.constraint_name}: ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`)
    })

    // 檢查 instructor_applications 表的 id 欄位
    console.log('\n🔍 檢查 instructor_applications 表的 id 欄位...')
    const instructorApps = await sql`
      SELECT id, user_id, status, bio
      FROM instructor_applications
      WHERE status = 'approved'
      LIMIT 5
    `

    console.log('📋 範例講師申請記錄:')
    instructorApps.forEach(app => {
      console.log(`   - ID: ${app.id}, User ID: ${app.user_id}, Status: ${app.status}`)
    })

    // 說明關係
    console.log('\n📝 關係說明:')
    console.log('   - instructor_ratings.instructor_id 應該對應到 instructor_applications.id')
    console.log('   - instructor_applications.user_id 對應到 users.id')
    console.log('   - 所以要查詢某個用戶的評價，需要先找到他的 instructor_applications.id')

  } catch (error) {
    console.error('❌ 錯誤:', error.message)
  }
}

main()
