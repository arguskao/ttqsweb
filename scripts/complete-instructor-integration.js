
/**
 * 完成講師系統整合
 * Complete Instructor System Integration
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

async function main() {
  console.log('🔧 完成講師系統整合')

  try {
    // 步驟 1: 擴展 instructor_applications 表
    console.log('1. 擴展 instructor_applications 表結構...')

    const alterCommands = [
      'ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) DEFAULT \'application\'',
      'ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS teaching_hours INTEGER DEFAULT 0',
      'ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS student_rating DECIMAL(3,2)',
      'ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS certifications TEXT[]',
      'ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS development_notes TEXT',
      'ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS last_evaluation_date TIMESTAMP',
      'ALTER TABLE instructor_applications ADD COLUMN IF NOT EXISTS next_milestone VARCHAR(255)'
    ]

    for (const command of alterCommands) {
      try {
        await sql.unsafe(command)
        console.log(`   ✅ ${command.split('ADD COLUMN IF NOT EXISTS')[1]?.split(' ')[0] || 'Unknown'}`)
      } catch (error) {
        console.log(`   ⚠️  ${error.message}`)
      }
    }

    // 步驟 2: 遷移 instructor_development 數據
    console.log('2. 遷移 instructor_development 數據...')

    const migrationResult = await sql`
            UPDATE instructor_applications 
            SET 
                current_stage = COALESCE(id.current_stage, 'application'),
                teaching_hours = COALESCE(id.teaching_hours, 0),
                student_rating = id.average_rating,
                development_notes = id.notes,
                last_evaluation_date = id.last_updated,
                next_milestone = id.next_milestone
            FROM instructor_development id
            WHERE instructor_applications.user_id = id.user_id
        `

    console.log('   ✅ 數據遷移完成')

    // 步驟 3: 創建備份表
    console.log('3. 創建備份表...')

    await sql`
            CREATE TABLE IF NOT EXISTS instructor_development_backup_20241028 AS 
            SELECT *, CURRENT_TIMESTAMP as backup_created_at 
            FROM instructor_development
        `

    await sql`
            CREATE TABLE IF NOT EXISTS instructor_ratings_backup_20241028 AS 
            SELECT *, CURRENT_TIMESTAMP as backup_created_at 
            FROM instructor_ratings
        `

    console.log('   ✅ 備份表創建完成')

    // 步驟 4: 創建統一評分視圖
    console.log('4. 創建統一評分視圖...')

    await sql`
            CREATE OR REPLACE VIEW instructor_ratings_unified AS
            SELECT 
                ia.user_id,
                ia.user_id as instructor_id,
                COALESCE(ia.student_rating, ia.average_rating) as overall_rating,
                ir.comment,
                ir.rated_by,
                COALESCE(ir.created_at, ia.updated_at) as rating_date,
                'general' as rating_type
            FROM instructor_applications ia
            LEFT JOIN instructor_ratings ir ON ia.user_id = ir.instructor_id
            WHERE ia.status = 'approved'
        `

    console.log('   ✅ 統一評分視圖創建完成')

    // 步驟 5: 添加約束
    console.log('5. 添加數據約束...')

    const constraints = [
      'ALTER TABLE instructor_applications DROP CONSTRAINT IF EXISTS check_current_stage',
      'ALTER TABLE instructor_applications ADD CONSTRAINT check_current_stage CHECK (current_stage IN (\'application\', \'review\', \'interview\', \'training\', \'probation\', \'certified\', \'advanced\'))',
      'ALTER TABLE instructor_applications DROP CONSTRAINT IF EXISTS check_student_rating_range',
      'ALTER TABLE instructor_applications ADD CONSTRAINT check_student_rating_range CHECK (student_rating IS NULL OR (student_rating >= 0 AND student_rating <= 5))'
    ]

    for (const constraint of constraints) {
      try {
        await sql.unsafe(constraint)
        console.log('   ✅ 約束添加成功')
      } catch (error) {
        console.log(`   ⚠️  ${error.message}`)
      }
    }

    // 步驟 6: 創建索引
    console.log('6. 創建索引...')

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_instructor_applications_current_stage ON instructor_applications(current_stage)',
      'CREATE INDEX IF NOT EXISTS idx_instructor_applications_teaching_hours ON instructor_applications(teaching_hours)',
      'CREATE INDEX IF NOT EXISTS idx_instructor_applications_student_rating ON instructor_applications(student_rating)'
    ]

    for (const index of indexes) {
      try {
        await sql.unsafe(index)
        console.log('   ✅ 索引創建成功')
      } catch (error) {
        console.log(`   ⚠️  ${error.message}`)
      }
    }

    // 步驟 7: 檢查最終結構
    console.log('7. 檢查最終表結構...')

    const finalColumns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'instructor_applications' 
            ORDER BY ordinal_position
        `

    console.log('📋 instructor_applications 最終結構:')
    finalColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`)
    })

    // 步驟 8: 統計信息
    console.log('8. 統計信息...')

    const stats = await sql`
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN current_stage IS NOT NULL THEN 1 END) as with_development_data,
                COUNT(CASE WHEN student_rating IS NOT NULL THEN 1 END) as with_ratings
            FROM instructor_applications
        `

    console.log('📊 統計結果:')
    console.log(`   - 總申請數: ${stats[0].total_applications}`)
    console.log(`   - 有發展數據: ${stats[0].with_development_data}`)
    console.log(`   - 有評分數據: ${stats[0].with_ratings}`)

    console.log('\n🎉 講師系統整合完成！')
    console.log('📝 後續步驟：')
    console.log('   1. 測試講師申請和管理功能')
    console.log('   2. 確認評分系統正常工作')
    console.log('   3. 如無問題，可執行清理腳本移除舊表')

  } catch (error) {
    console.error('❌ 整合失敗:', error.message)
  }
}

main().catch(console.error)
