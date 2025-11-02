import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sql = neon(
  'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
)

async function executeMigration(filePath) {
  console.log('📄 開始執行遷移文件...')
  const sqlContent = fs.readFileSync(filePath, 'utf8')

  // 分割 SQL 語句（DO $$ ... END $$ 是一個完整的語句）
  const statements = [sqlContent.trim()]

  for (const statement of statements) {
    try {
      await sql.unsafe(statement)
      console.log('✅ 執行成功')
    } catch (error) {
      console.log('⚠️  執行結果:', error.message)
    }
  }
}

async function verifyColumn() {
  console.log('🔍 驗證欄位是否添加成功...')
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'employer_id'
  `

  if (columns.length > 0) {
    console.log('✅ employer_id 欄位已成功添加:')
    columns.forEach((col) => {
      console.log(`   類型: ${col.data_type}, 可為空: ${col.is_nullable}`)
    })

    // 檢查索引
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'jobs' AND indexname LIKE '%employer%'
    `
    console.log('📊 相關索引:')
    indexes.forEach((idx) => {
      console.log(`   ✅ ${idx.indexname}`)
    })

    // 檢查現有數據
    const existingData = await sql`SELECT COUNT(*) as count FROM jobs WHERE employer_id IS NOT NULL`
    console.log(`📊 已有 employer_id 的記錄數: ${existingData[0].count}`)
  } else {
    console.log('❌ employer_id 欄位未找到')
  }
}

async function main() {
  const migrationFile = path.join(__dirname, '../src/database/migrations/026_add_employer_id_to_jobs.sql')
  await executeMigration(migrationFile)
  await verifyColumn()
  console.log('✨ 遷移完成！')
}

main().catch(console.error)

