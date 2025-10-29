
/**
 * 直接清理未使用的索引
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

async function cleanUnusedIndexes() {
  console.log('🧹 清理未使用的索引...\n')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    // 1. 找出未使用的非關鍵索引
    console.log('1️⃣ 分析未使用的索引...')

    const safeToRemove = await sql`
      SELECT 
        i.indexname,
        i.tablename,
        i.indexdef,
        COALESCE(s.idx_scan, 0) as idx_scan
      FROM pg_indexes i
      LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexrelname
      WHERE i.schemaname = 'public'
        AND i.indexdef NOT LIKE '%UNIQUE%'
        AND i.indexname NOT LIKE '%_pkey'
        AND i.indexname NOT LIKE '%_key'
        AND (s.idx_scan = 0 OR s.idx_scan IS NULL)
      ORDER BY i.tablename, i.indexname
    `

    console.log(`📊 找到 ${safeToRemove.length} 個可安全移除的索引:`)
    safeToRemove.forEach(idx => {
      console.log(`  - ${idx.indexname} (表: ${idx.tablename}, 掃描次數: ${idx.idx_scan})`)
    })

    if (safeToRemove.length === 0) {
      console.log('✅ 沒有發現可安全移除的索引')
      return
    }

    // 2. 執行清理
    console.log('\n2️⃣ 開始清理索引...')

    let cleanedCount = 0
    let failedCount = 0

    for (const idx of safeToRemove) {
      try {
        console.log(`🗑️  移除索引: ${idx.indexname}`)
        await sql.unsafe(`DROP INDEX IF EXISTS "${idx.indexname}"`)
        cleanedCount++
        console.log('  ✅ 成功移除')
      } catch (error) {
        console.log(`  ❌ 移除失敗: ${error.message}`)
        failedCount++
      }
    }

    // 3. 統計結果
    console.log('\n3️⃣ 清理結果統計...')
    console.log('📊 清理摘要:')
    console.log(`  成功移除: ${cleanedCount} 個索引`)
    console.log(`  移除失敗: ${failedCount} 個索引`)
    console.log(`  清理成功率: ${((cleanedCount / safeToRemove.length) * 100).toFixed(1)}%`)

    // 4. 檢查清理後的索引統計
    const finalStats = await sql`
      SELECT 
        COUNT(*) as total_indexes,
        COUNT(CASE WHEN s.idx_scan = 0 THEN 1 END) as unused_indexes,
        COUNT(CASE WHEN s.idx_scan > 0 AND s.idx_scan < 10 THEN 1 END) as low_usage_indexes,
        COUNT(CASE WHEN s.idx_scan >= 10 THEN 1 END) as normal_indexes
      FROM pg_stat_user_indexes s
      WHERE s.schemaname = 'public'
    `

    const stats = finalStats[0]
    console.log('\n📈 清理後索引統計:')
    console.log(`  總索引數: ${stats.total_indexes}`)
    console.log(`  未使用索引: ${stats.unused_indexes}`)
    console.log(`  低使用索引: ${stats.low_usage_indexes}`)
    console.log(`  正常使用索引: ${stats.normal_indexes}`)

    // 5. 計算節省的空間
    const totalIndexSize = await sql`
      SELECT 
        pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_size,
        SUM(pg_relation_size(indexrelid)) as size_bytes
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
    `

    console.log(`\n💾 當前索引總大小: ${totalIndexSize[0].total_size}`)

    console.log('\n🎉 索引清理完成！')
    console.log('\n💡 優化效果:')
    console.log(`  - 減少了 ${cleanedCount} 個未使用索引`)
    console.log('  - 降低了索引維護開銷')
    console.log('  - 提升了寫入操作性能')

    console.log('\n📋 後續建議:')
    console.log('  1. 監控應用性能，確保沒有影響查詢速度')
    console.log('  2. 定期執行索引使用情況分析')
    console.log('  3. 在添加新索引時更加謹慎')

  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error.message)
    console.error('詳細錯誤:', error)
    process.exit(1)
  }
}

cleanUnusedIndexes()
