import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

async function main() {
  console.log('執行修正遷移...')
  try {
    await sql.unsafe(`UPDATE jobs SET company = '未提供公司名稱' WHERE company IS NULL`)
    console.log('✅ 更新現有資料完成')
    
    await sql.unsafe(`ALTER TABLE jobs ALTER COLUMN company DROP NOT NULL`)
    console.log('✅ 欄位改為可空')
    
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company)`)
    console.log('✅ 創建 company 索引')
    
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary)`)
    console.log('✅ 創建 salary 索引')
    
    console.log('\n✨ 遷移完成！')
  } catch (error) {
    console.error('❌ 失敗:', error.message)
    process.exit(1)
  }
}

main()

