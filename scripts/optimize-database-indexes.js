
/**
 * 資料庫索引優化腳本
 * 基於 DATABASE_REDUNDANCY_ANALYSIS_REPORT.md 的建議
 */

import readline from 'readline'

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function optimizeDatabaseIndexes() {
  console.log('🔧 資料庫索引優化工具')
  console.log('📋 基於 DATABASE_REDUNDANCY_ANALYSIS_REPORT.md 的建議\n')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    // 1. 分析當前索引使用情況
    console.log('1️⃣ 分析當前索引使用情況...')

    const indexStats = await sql`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC, relname, indexrelname
    `

    console.log(`📊 找到 ${indexStats.length} 個用戶索引`)

    // 分類索引
    const unusedIndexes = indexStats.filter(idx => idx.idx_scan === 0)
    const lowUsageIndexes = indexStats.filter(idx => idx.idx_scan > 0 && idx.idx_scan < 10)
    const normalIndexes = indexStats.filter(idx => idx.idx_scan >= 10)

    console.log('\n📈 索引使用統計:')
    console.log(`  未使用索引: ${unusedIndexes.length} 個`)
    console.log(`  低使用索引: ${lowUsageIndexes.length} 個`)
    console.log(`  正常使用索引: ${normalIndexes.length} 個`)

    // 2. 顯示未使用的索引
    if (unusedIndexes.length > 0) {
      console.log('\n🚨 未使用的索引 (idx_scan = 0):')
      unusedIndexes.forEach(idx => {
        console.log(`  - ${idx.indexname} (表: ${idx.tablename})`)
      })
    }

    // 3. 顯示低使用率索引
    if (lowUsageIndexes.length > 0) {
      console.log('\n⚠️  低使用率索引 (idx_scan < 10):')
      lowUsageIndexes.forEach(idx => {
        console.log(`  - ${idx.indexname} (表: ${idx.tablename}, 掃描: ${idx.idx_scan})`)
      })
    }

    // 4. 檢查索引大小
    console.log('\n2️⃣ 檢查索引大小...')
    const indexSizes = await sql`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        pg_relation_size(indexrelid) as size_bytes
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC
    `

    console.log('📏 最大的索引:')
    indexSizes.slice(0, 10).forEach(idx => {
      console.log(`  ${idx.indexname}: ${idx.index_size} (表: ${idx.tablename})`)
    })

    // 5. 生成清理建議
    console.log('\n3️⃣ 生成清理建議...')

    // 安全清理的索引（非主鍵、非唯一約束）
    const safeToRemove = await sql`
      SELECT 
        i.indexname,
        i.tablename,
        i.indexdef,
        s.idx_scan
      FROM pg_indexes i
      LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexrelname
      WHERE i.schemaname = 'public'
        AND i.indexdef NOT LIKE '%UNIQUE%'
        AND i.indexname NOT LIKE '%_pkey'
        AND (s.idx_scan = 0 OR s.idx_scan IS NULL)
      ORDER BY i.tablename, i.indexname
    `

    if (safeToRemove.length > 0) {
      console.log(`\n✅ 建議安全移除的索引 (${safeToRemove.length} 個):`)
      safeToRemove.forEach(idx => {
        console.log(`  - ${idx.indexname} (表: ${idx.tablename})`)
      })

      // 詢問是否執行清理
      const shouldClean = await askQuestion('\n是否要執行索引清理？(y/N): ')

      if (shouldClean.toLowerCase() === 'y' || shouldClean.toLowerCase() === 'yes') {
        console.log('\n4️⃣ 執行索引清理...')

        let cleanedCount = 0
        for (const idx of safeToRemove) {
          try {
            console.log(`🗑️  移除索引: ${idx.indexname}`)
            await sql.unsafe(`DROP INDEX IF EXISTS ${idx.indexname}`)
            cleanedCount++
            console.log('  ✅ 成功移除')
          } catch (error) {
            console.log(`  ❌ 移除失敗: ${error.message}`)
          }
        }

        console.log('\n🎉 索引清理完成！')
        console.log(`  成功移除: ${cleanedCount} 個索引`)
        console.log(`  失敗: ${safeToRemove.length - cleanedCount} 個索引`)

        // 重新統計
        console.log('\n5️⃣ 清理後統計...')
        const newStats = await sql`
          SELECT COUNT(*) as total_indexes
          FROM pg_stat_user_indexes 
          WHERE schemaname = 'public'
        `

        console.log(`📊 剩餘索引數: ${newStats[0].total_indexes}`)

      } else {
        console.log('\n⏭️  跳過索引清理')
      }
    } else {
      console.log('\n✅ 沒有發現可安全移除的索引')
    }

    // 6. 生成優化報告
    console.log('\n6️⃣ 生成優化建議...')

    const totalIndexSize = await sql`
      SELECT 
        COUNT(*) as total_indexes,
        pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_size
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
    `

    console.log('\n📋 優化摘要:')
    console.log(`  總索引數: ${totalIndexSize[0].total_indexes}`)
    console.log(`  總索引大小: ${totalIndexSize[0].total_size}`)
    console.log(`  未使用索引: ${unusedIndexes.length} 個`)
    console.log(`  優化潛力: ${((unusedIndexes.length / indexStats.length) * 100).toFixed(1)}%`)

    console.log('\n💡 後續建議:')
    console.log('  1. 定期監控索引使用情況')
    console.log('  2. 在新功能開發時謹慎添加索引')
    console.log('  3. 每季度執行一次索引優化檢查')

  } catch (error) {
    console.error('❌ 優化過程中發生錯誤:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

optimizeDatabaseIndexes()
