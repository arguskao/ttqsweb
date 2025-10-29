
/**
 * 修復講師系統遷移
 * Fix Instructor System Migration
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

async function main() {
  console.log('🔧 修復講師系統遷移')

  try {
    // 步驟 1: 檢查當前狀態
    console.log('1. 檢查當前狀態...')

    const devCount = await sql`SELECT COUNT(*) as count FROM instructor_development`
    const appCount = await sql`SELECT COUNT(*) as count FROM instructor_applications`

    console.log(`   - instructor_development: ${devCount[0].count} 記錄`)
    console.log(`   - instructor_applications: ${appCount[0].count} 記錄`)

    // 步驟 2: 遷移數據（如果有的話）
    if (devCount[0].count > 0) {
      console.log('2. 遷移 instructor_development 數據...')

      const migrationResult = await sql`
                UPDATE instructor_applications 
                SET 
                    current_stage = COALESCE(dev.current_stage, 'application'),
                    teaching_hours = COALESCE(dev.teaching_hours, 0),
                    student_rating = dev.student_rating,
                    certifications = dev.certifications,
                    development_notes = dev.notes,
                    last_evaluation_date = dev.updated_at
                FROM instructor_development dev
                WHERE instructor_applications.user_id = dev.user_id
            `

      console.log('   ✅ 數據遷移完成')
    } else {
      console.log('2. 無需遷移數據（instructor_development 表為空）')
    }

    // 步驟 3: 創建向後兼容視圖
    console.log('3. 創建向後兼容視圖...')

    await sql`
            CREATE OR REPLACE VIEW instructor_development_legacy AS
            SELECT 
                user_id,
                current_stage,
                current_stage as application_status,
                teaching_hours,
                student_rating,
                certifications,
                development_notes as notes,
                created_at as applied_at,
                updated_at
            FROM instructor_applications
            WHERE current_stage IS NOT NULL
        `

    console.log('   ✅ 向後兼容視圖創建完成')

    // 步驟 4: 創建統一評分視圖
    console.log('4. 創建統一評分視圖...')

    await sql`
            CREATE OR REPLACE VIEW instructor_ratings_unified AS
            SELECT 
                ia.user_id,
                ia.user_id as instructor_id,
                COALESCE(ia.student_rating, ia.average_rating, 0) as overall_rating,
                COALESCE(ir.comment, '系統評分') as comment,
                COALESCE(ir.rated_by, ia.reviewed_by) as rated_by,
                COALESCE(ir.created_at, ia.updated_at) as rating_date,
                CASE 
                    WHEN ir.id IS NOT NULL THEN 'manual'
                    WHEN ia.student_rating IS NOT NULL THEN 'student'
                    ELSE 'system'
                END as rating_type
            FROM instructor_applications ia
            LEFT JOIN instructor_ratings ir ON ia.user_id = ir.instructor_id
            WHERE ia.status = 'approved' OR ia.average_rating IS NOT NULL
        `

    console.log('   ✅ 統一評分視圖創建完成')

    // 步驟 5: 更新表註釋
    console.log('5. 更新表註釋...')

    await sql`
            COMMENT ON TABLE instructor_applications IS '講師申請和發展管理表 - 整合了 instructor_development 功能 (2024-10-28)'
        `

    await sql`
            COMMENT ON COLUMN instructor_applications.current_stage IS '當前發展階段：application, review, interview, training, probation, certified, advanced'
        `

    await sql`
            COMMENT ON COLUMN instructor_applications.teaching_hours IS '累計教學時數'
        `

    await sql`
            COMMENT ON COLUMN instructor_applications.student_rating IS '學生評分平均（0-5分）'
        `

    console.log('   ✅ 表註釋更新完成')

    // 步驟 6: 檢查最終狀態
    console.log('6. 檢查最終狀態...')

    const finalStats = await sql`
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN current_stage IS NOT NULL THEN 1 END) as with_stage,
                COUNT(CASE WHEN student_rating IS NOT NULL THEN 1 END) as with_rating,
                COUNT(CASE WHEN teaching_hours > 0 THEN 1 END) as with_hours
            FROM instructor_applications
        `

    console.log('📊 最終統計:')
    console.log(`   - 總申請數: ${finalStats[0].total_applications}`)
    console.log(`   - 有發展階段: ${finalStats[0].with_stage}`)
    console.log(`   - 有學生評分: ${finalStats[0].with_rating}`)
    console.log(`   - 有教學時數: ${finalStats[0].with_hours}`)

    // 步驟 7: 測試視圖
    console.log('7. 測試視圖...')

    const viewTest = await sql`
            SELECT COUNT(*) as count FROM instructor_development_legacy
        `

    const ratingViewTest = await sql`
            SELECT COUNT(*) as count FROM instructor_ratings_unified
        `

    console.log(`   - instructor_development_legacy 視圖: ${viewTest[0].count} 記錄`)
    console.log(`   - instructor_ratings_unified 視圖: ${ratingViewTest[0].count} 記錄`)

    console.log('\n🎉 講師系統整合修復完成！')
    console.log('📝 現在可以安全地移除舊表了')

  } catch (error) {
    console.error('❌ 修復失敗:', error.message)
  }
}

main().catch(console.error)
