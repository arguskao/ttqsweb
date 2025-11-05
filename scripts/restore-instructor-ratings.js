/**
 * 恢復講師評價表
 * Restore instructor ratings table
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 數據庫連接
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ 錯誤：未設置 DATABASE_URL 環境變量')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function checkTableExists(tableName) {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      )
    `
    return result[0].exists
  } catch (error) {
    console.error(`檢查表 ${tableName} 是否存在時出錯:`, error.message)
    return false
  }
}

async function executeSqlFile(filePath) {
  console.log(`\n🔄 執行 SQL 文件: ${filePath}`)

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`)
      return false
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8')
    console.log(`📊 SQL 內容長度: ${sqlContent.length} 字符`)

    // 執行整個 SQL 文件
    await sql.unsafe(sqlContent)
    console.log('✅ SQL 文件執行成功')
    return true

  } catch (error) {
    console.error('❌ SQL 文件執行失敗:', error.message)
    return false
  }
}

async function verifyTableStructure() {
  console.log('\n🔍 驗證 instructor_ratings 表結構...')

  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'instructor_ratings'
      ORDER BY ordinal_position
    `

    console.log('📋 instructor_ratings 表欄位:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })

    // 檢查索引
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'instructor_ratings'
    `

    console.log('\n📋 索引:')
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`)
    })

    // 檢查觸發器
    const triggers = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'instructor_ratings'
    `

    console.log('\n📋 觸發器:')
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation})`)
    })

    return true

  } catch (error) {
    console.error('❌ 驗證表結構失敗:', error.message)
    return false
  }
}

async function testBasicOperations() {
  console.log('\n🧪 測試基本操作...')

  try {
    // 測試插入
    console.log('   測試插入評價...')
    const insertResult = await sql`
      INSERT INTO instructor_ratings (
        instructor_id,
        student_id,
        course_id,
        rating,
        comment
      ) VALUES (
        1, 2, 1, 5, '測試評價'
      )
      ON CONFLICT (instructor_id, student_id, course_id) DO NOTHING
      RETURNING id
    `

    if (insertResult.length > 0) {
      const ratingId = insertResult[0].id
      console.log(`   ✅ 插入成功，ID: ${ratingId}`)

      // 測試查詢
      console.log('   測試查詢評價...')
      const selectResult = await sql`
        SELECT * FROM instructor_ratings WHERE id = ${ratingId}
      `
      console.log(`   ✅ 查詢成功，找到 ${selectResult.length} 筆記錄`)

      // 測試更新
      console.log('   測試更新評價...')
      await sql`
        UPDATE instructor_ratings
        SET comment = '更新後的測試評價'
        WHERE id = ${ratingId}
      `
      console.log('   ✅ 更新成功')

      // 清理測試數據
      console.log('   清理測試數據...')
      await sql`DELETE FROM instructor_ratings WHERE id = ${ratingId}`
      console.log('   🗑️  測試數據已刪除')

    } else {
      console.log('   ℹ️  測試數據已存在或插入被跳過')
    }

    return true

  } catch (error) {
    console.error('❌ 測試基本操作失敗:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 恢復講師評價表')
  console.log('📅 執行時間:', new Date().toISOString())

  try {
    // 步驟 1: 檢查表是否已存在
    console.log('\n🔍 檢查 instructor_ratings 表是否存在...')
    const tableExists = await checkTableExists('instructor_ratings')

    if (tableExists) {
      console.log('⚠️  instructor_ratings 表已存在')
      console.log('是否要繼續執行？這將重新建立表結構（如果有衝突）')
    } else {
      console.log('ℹ️  instructor_ratings 表不存在，將建立新表')
    }

    // 步驟 2: 執行 migration SQL
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', '029_restore_instructor_ratings_table.sql')
    const success = await executeSqlFile(migrationPath)

    if (!success) {
      console.error('❌ Migration 執行失敗')
      process.exit(1)
    }

    // 步驟 3: 驗證表結構
    const verified = await verifyTableStructure()
    if (!verified) {
      console.error('❌ 表結構驗證失敗')
      process.exit(1)
    }

    // 步驟 4: 測試基本操作
    const tested = await testBasicOperations()
    if (!tested) {
      console.error('❌ 基本操作測試失敗')
      process.exit(1)
    }

    console.log('\n🎉 講師評價表恢復完成！')
    console.log('📝 現在可以使用評價功能了')
    console.log('\n📋 後續步驟:')
    console.log('   1. 更新前端 loadRatings() 函數')
    console.log('   2. 測試評價 API 端點')
    console.log('   3. 測試前端評價功能')

  } catch (error) {
    console.error('❌ 恢復過程中發生錯誤:', error)
    process.exit(1)
  }
}

// 執行恢復
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main }
