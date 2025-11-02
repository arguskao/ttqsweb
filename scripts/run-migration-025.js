/**
 * 執行遷移文件 025_add_job_approval_status.sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 數據庫連接
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

if (!DATABASE_URL) {
  console.error('❌ 錯誤：未設置 DATABASE_URL 環境變量')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function executeMigration() {
  console.log('🚀 開始執行遷移文件：025_add_job_approval_status.sql')
  console.log('📅 執行時間:', new Date().toISOString())
  console.log('')

  try {
    // 讀取遷移文件
    const migrationPath = path.join(__dirname, '../src/database/migrations/025_add_job_approval_status.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ 遷移文件不存在: ${migrationPath}`)
      process.exit(1)
    }

    const sqlContent = fs.readFileSync(migrationPath, 'utf8')
    console.log(`📄 已讀取遷移文件 (${sqlContent.length} 字符)`)
    console.log('')

    // 分割並逐條執行 SQL 語句
    console.log('🔄 執行 SQL 語句...')
    
    // 移除註釋並分割 SQL 語句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`   找到 ${statements.length} 個 SQL 語句`)
    console.log('')
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        console.log(`   [${i + 1}/${statements.length}] 執行...`)
        await sql.unsafe(statement)
        console.log(`   ✅ 成功`)
      } catch (error) {
        // 如果是非關鍵錯誤（如欄位已存在），繼續執行
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('already defined')) {
          console.log(`   ⚠️  非關鍵錯誤: ${error.message.split('\n')[0]}`)
        } else {
          console.error(`   ❌ 錯誤: ${error.message}`)
          console.error(`   SQL: ${statement.substring(0, 200)}...`)
          throw error
        }
      }
    }
    
    console.log('')
    console.log('✅ 遷移執行成功！')
    console.log('')

    // 驗證欄位是否添加成功
    console.log('🔍 驗證欄位是否添加成功...')
    const columns = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name IN ('approval_status', 'reviewed_at', 'reviewed_by', 'review_notes')
      ORDER BY column_name
    `

    console.log('📋 添加的欄位:')
    columns.forEach(col => {
      console.log(`   ✅ ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

    if (columns.length === 4) {
      console.log('')
      console.log('🎉 所有欄位都已成功添加！')
    } else {
      console.log('')
      console.log(`⚠️  預期 4 個欄位，但只找到 ${columns.length} 個欄位`)
    }

    // 檢查索引
    console.log('')
    console.log('🔍 檢查索引...')
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'jobs' 
      AND indexname LIKE '%approval%'
      ORDER BY indexname
    `

    if (indexes.length > 0) {
      console.log('📋 創建的索引:')
      indexes.forEach(idx => {
        console.log(`   ✅ ${idx.indexname}`)
      })
    }

    console.log('')
    console.log('✨ 遷移完成！現在工作審核功能已可用。')

  } catch (error) {
    console.error('')
    console.error('❌ 遷移執行失敗:')
    console.error('   錯誤:', error.message)
    
    // 如果是非關鍵錯誤（如欄位已存在），繼續執行
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('already defined')) {
      console.log('')
      console.log('⚠️  這是非關鍵錯誤（欄位或索引可能已存在），遷移可能已完成')
      console.log('   請檢查資料庫確認欄位是否已存在')
    } else {
      console.error('')
      console.error('💥 關鍵錯誤，請檢查並修復問題後重試')
      process.exit(1)
    }
  }
}

// 執行遷移
executeMigration().catch(error => {
  console.error('❌ 執行失敗:', error)
  process.exit(1)
})

