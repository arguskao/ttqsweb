/**
 * 修復講師評價表的外鍵約束
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(DATABASE_URL)

async function main() {
  try {
    console.log('🔧 修復講師評價表的外鍵約束...')

    // 檢查現有的外鍵約束
    console.log('\n🔍 檢查現有外鍵約束...')
    const existingConstraints = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
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

    console.log('現有外鍵約束:')
    existingConstraints.forEach(constraint => {
      console.log(`   - ${constraint.constraint_name}: ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`)
    })

    // 刪除可能存在的錯誤外鍵約束
    console.log('\n🗑️ 清理可能的錯誤約束...')
    try {
      await sql`ALTER TABLE instructor_ratings DROP CONSTRAINT IF EXISTS fk_instructor_ratings_instructor`
      console.log('   ✅ 刪除舊的 instructor 外鍵約束')
    } catch (e) {
      console.log('   ⚠️ 沒有找到舊的 instructor 外鍵約束')
    }

    // 添加正確的外鍵約束到 instructor_applications 表
    console.log('\n🔗 添加正確的外鍵約束...')

    try {
      // 檢查 instructor_id 是否對應到 instructor_applications.id
      await sql`
        ALTER TABLE instructor_ratings
        ADD CONSTRAINT fk_instructor_ratings_instructor_application
        FOREIGN KEY (instructor_id)
        REFERENCES instructor_applications(id)
        ON DELETE CASCADE
      `
      console.log('   ✅ 添加 instructor_applications 外鍵約束成功')
    } catch (e) {
      console.log('   ⚠️ 添加 instructor_applications 外鍵約束失敗:', e.message)

      // 檢查是否有不符合的數據
      console.log('\n🔍 檢查數據完整性...')
      const invalidData = await sql`
        SELECT DISTINCT ir.instructor_id
        FROM instructor_ratings ir
        LEFT JOIN instructor_applications ia ON ir.instructor_id = ia.id
        WHERE ia.id IS NULL
      `

      if (invalidData.length > 0) {
        console.log('   ❌ 發現無效的 instructor_id:')
        invalidData.forEach(row => {
          console.log(`      - ${row.instructor_id}`)
        })

        // 清理無效數據
        console.log('\n🧹 清理無效數據...')
        const deleteResult = await sql`
          DELETE FROM instructor_ratings
          WHERE instructor_id NOT IN (
            SELECT id FROM instructor_applications
          )
        `
        console.log(`   ✅ 刪除了 ${deleteResult.length} 筆無效記錄`)

        // 重新嘗試添加約束
        try {
          await sql`
            ALTER TABLE instructor_ratings
            ADD CONSTRAINT fk_instructor_ratings_instructor_application
            FOREIGN KEY (instructor_id)
            REFERENCES instructor_applications(id)
            ON DELETE CASCADE
          `
          console.log('   ✅ 重新添加外鍵約束成功')
        } catch (e2) {
          console.log('   ❌ 重新添加外鍵約束仍然失敗:', e2.message)
        }
      }
    }

    // 最終檢查
    console.log('\n🔍 最終檢查外鍵約束...')
    const finalConstraints = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
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

    console.log('最終外鍵約束:')
    finalConstraints.forEach(constraint => {
      console.log(`   ✅ ${constraint.constraint_name}: ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`)
    })

    console.log('\n🎉 外鍵約束修復完成！')

  } catch (error) {
    console.error('❌ 錯誤:', error.message)
  }
}

main()
