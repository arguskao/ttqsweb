
/**
 * 最終優化狀態檢查
 * Final Optimization Status Check
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

async function main() {
  console.log('🔍 DATABASE_REDUNDANCY_ANALYSIS.md 完成狀態檢查')
  console.log('📅 檢查時間:', new Date().toISOString())

  try {
    // ✅ Phase 1: 文件系統統一檢查
    console.log('\n📁 Phase 1: 文件管理系統統一')

    const documentsCount = await sql`SELECT COUNT(*) as count FROM documents`
    const documentsColumns = await sql`
            SELECT COUNT(*) as count 
            FROM information_schema.columns 
            WHERE table_name = 'documents' 
            AND column_name IN ('original_name', 'file_path', 'is_active')
        `

    console.log(`   ✅ documents 表: ${documentsCount[0].count} 記錄`)
    console.log(`   ✅ 新增欄位: ${documentsColumns[0].count}/3 個`)

    const ttqsExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'ttqs_documents'
            ) as exists
        `

    const uploadedFilesExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'uploaded_files'
            ) as exists
        `

    console.log(`   📋 ttqs_documents 表: ${ttqsExists[0].exists ? '存在（待清理）' : '已移除'}`)
    console.log(`   📋 uploaded_files 表: ${uploadedFilesExists[0].exists ? '存在（待清理）' : '已移除'}`)

    // ✅ Phase 2: 講師系統整合檢查
    console.log('\n👨‍🏫 Phase 2: 講師管理系統整合')

    const instructorAppColumns = await sql`
            SELECT COUNT(*) as count 
            FROM information_schema.columns 
            WHERE table_name = 'instructor_applications' 
            AND column_name IN ('current_stage', 'teaching_hours', 'student_rating')
        `

    const instructorDevExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'instructor_development'
            ) as exists
        `

    const instructorRatingsExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'instructor_ratings'
            ) as exists
        `

    console.log(`   ✅ instructor_applications 擴展: ${instructorAppColumns[0].count}/3 個新欄位`)
    console.log(`   📋 instructor_development 表: ${instructorDevExists[0].exists ? '存在（待清理）' : '已移除'}`)
    console.log(`   📋 instructor_ratings 表: ${instructorRatingsExists[0].exists ? '存在（待清理）' : '已移除'}`)

    // 檢查視圖
    const viewExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.views 
                WHERE table_name = 'instructor_development_legacy'
            ) as exists
        `

    console.log(`   ✅ 向後兼容視圖: ${viewExists[0].exists ? '已創建' : '未創建'}`)

    // ⭐ Phase 3: 評分系統檢查
    console.log('\n⭐ Phase 3: 評分系統優化')

    const unifiedRatingView = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.views 
                WHERE table_name = 'instructor_ratings_unified'
            ) as exists
        `

    console.log(`   ✅ 統一評分視圖: ${unifiedRatingView[0].exists ? '已創建' : '未創建'}`)

    // 📊 總體狀態評估
    console.log('\n📊 總體優化狀態')

    const phase1Complete = documentsColumns[0].count === 3
    const phase2Complete = instructorAppColumns[0].count === 3 && viewExists[0].exists
    const phase3Complete = unifiedRatingView[0].exists

    console.log(`   Phase 1 (文件系統): ${phase1Complete ? '✅ 完成' : '🟡 部分完成'}`)
    console.log(`   Phase 2 (講師系統): ${phase2Complete ? '✅ 完成' : '🟡 部分完成'}`)
    console.log(`   Phase 3 (評分系統): ${phase3Complete ? '✅ 完成' : '🟡 部分完成'}`)

    // 🧹 清理建議
    console.log('\n🧹 清理建議')

    const tablesToCleanup = []
    if (ttqsExists[0].exists) tablesToCleanup.push('ttqs_documents')
    if (uploadedFilesExists[0].exists) tablesToCleanup.push('uploaded_files')
    if (instructorDevExists[0].exists) tablesToCleanup.push('instructor_development')
    if (instructorRatingsExists[0].exists) tablesToCleanup.push('instructor_ratings')

    if (tablesToCleanup.length > 0) {
      console.log('   🗑️  可以清理的冗餘表:')
      tablesToCleanup.forEach(table => {
        console.log(`      - ${table}`)
      })
      console.log('   💡 執行清理: npm run cleanup:all-tables')
    } else {
      console.log('   ✅ 無需清理，所有冗餘表已移除')
    }

    // 📈 效益統計
    console.log('\n📈 優化效益')

    const totalTables = await sql`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `

    console.log(`   📋 當前表數: ${totalTables[0].count}`)
    console.log(`   📉 預計減少: ${tablesToCleanup.length} 個冗餘表`)
    console.log(`   📈 優化後表數: ${totalTables[0].count - tablesToCleanup.length}`)

    // 🎯 最終結論
    const allComplete = phase1Complete && phase2Complete && phase3Complete

    console.log('\n🎯 最終結論')
    if (allComplete) {
      console.log('   🎉 DATABASE_REDUNDANCY_ANALYSIS.md 中的所有優化已完成！')
      console.log('   ✅ 文件管理系統已統一')
      console.log('   ✅ 講師管理系統已整合')
      console.log('   ✅ 評分系統已優化')
      console.log('   📝 建議執行清理腳本移除冗餘表')
    } else {
      console.log('   🟡 部分優化已完成，仍有改進空間')
      if (!phase1Complete) console.log('   ❌ 文件系統需要完善')
      if (!phase2Complete) console.log('   ❌ 講師系統需要完善')
      if (!phase3Complete) console.log('   ❌ 評分系統需要完善')
    }

  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
  }
}

main().catch(console.error)
