/**
 * 執行遷移文件 027_add_company_and_salary_to_jobs.sql
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
  console.log('🚀 開始執行遷移文件：027_add_company_and_salary_to_jobs.sql')
  console.log('📅 執行時間:', new Date().toISOString())
  console.log('')

  try {
    // 讀取遷移文件
    const migrationPath = path.join(__dirname, '../src/database/migrations/027_add_company_and_salary_to_jobs.sql')
    
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
      const statement = statements[i]
      process.stdout.write(`   [${i + 1}/${statements.length}] 執行...`)
      
      try {
        await sql.unsafe(statement + ';')
        console.log(' ✅ 成功')
      } catch (error) {
        // 忽略 "already exists" 錯誤
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(' ⚠️  已存在（跳過）')
        } else {
          console.log(' ❌ 失敗')
          console.error('   錯誤:', error.message)
        }
      }
    }

    console.log('')
    console.log('✅ 遷移執行成功！')
    console.log('')

    // 驗證欄位是否添加成功
    console.log('🔍 驗證欄位是否添加成功...')
    try {
      const columns = await sql`SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'jobs'
        AND column_name IN ('company', 'salary')
        ORDER BY column_name`
      
      console.log('📋 添加的欄位:')
      if (columns.length === 0) {
        console.log('   ⚠️  沒有找到任何欄位')
      } else {
        columns.forEach((col) => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
          console.log(`   ✅ ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`)
        })
      }

      // 檢查索引
      console.log('')
      console.log('🔍 檢查索引...')
      const indexes = await sql`SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'jobs'
        AND indexname IN ('idx_jobs_company', 'idx_jobs_salary')
        ORDER BY indexname`

      console.log('📋 創建的索引:')
      if (indexes.length === 0) {
        console.log('   ⚠️  沒有找到任何索引')
      } else {
        indexes.forEach((idx) => {
          console.log(`   ✅ ${idx.indexname}`)
        })
      }

    } catch (error) {
      console.log('   ⚠️  驗證時出錯:', error.message)
    }

    console.log('')
    console.log('✨ 遷移完成！現在公司名稱和薪資欄位已可用。')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ 遷移執行失敗:', error.message)
    process.exit(1)
  }
}

executeMigration()
