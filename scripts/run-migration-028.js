/**
 * 執行遷移文件 028_fix_jobs_company_nullable.sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

async function executeMigration() {
  console.log('🚀 開始執行遷移文件：028_fix_jobs_company_nullable.sql')
  console.log('📅 執行時間:', new Date().toISOString())
  console.log('')

  try {
    const migrationPath = path.join(__dirname, '../src/database/migrations/028_fix_jobs_company_nullable.sql')
    const sqlContent = fs.readFileSync(migrationPath, 'utf8')
    
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`找到 ${statements.length} 個 SQL 語句`)
    console.log('')

    for (let i = 0; i < statements.length; i++) {
      process.stdout.write(`[${i + 1}/${statements.length}] 執行...`)
      try {
        await sql.unsafe(statements[i] + ';')
        console.log(' ✅ 成功')
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(' ⚠️  已存在（跳過）')
        } else {
          console.log(' ❌ 失敗:', error.message)
        }
      }
    }

    console.log('')
    console.log('✅ 遷移執行成功！')

  } catch (error) {
    console.error('❌ 遷移失敗:', error.message)
    process.exit(1)
  }
}

executeMigration()

