
/**
 * 清理未使用的 TTQS 評估表
 * Cleanup Unused TTQS Evaluation Tables
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加載環境變量
config()

// 從環境變量獲取數據庫連接
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ 錯誤：未找到 DATABASE_URL 環境變量')
  console.error('請設置 DATABASE_URL 環境變量或在 .env 文件中配置')
  process.exit(1)
}

async function cleanupTTQSEvaluations() {
  console.log('🧹 開始清理未使用的 TTQS 評估表...\n')

  try {
    const sql = neon(DATABASE_URL)

    // 1. 檢查當前評估表狀態
    console.log('📊 檢查當前評估表狀態...')

    const tableChecks = [
      'reaction_evaluations',
      'learning_evaluations',
      'behavior_evaluations',
      'result_evaluations'
    ]

    for (const tableName of tableChecks) {
      try {
        const exists = await sql`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = ${tableName} AND table_schema = 'public'
                    ) as exists
                `

        if (exists[0].exists) {
          const count = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`
          console.log(`   ✅ ${tableName}: 存在，${count[0].count} 條記錄`)
        } else {
          console.log(`   ❌ ${tableName}: 不存在`)
        }
      } catch (error) {
        console.log(`   ❌ ${tableName}: 檢查失敗 - ${error.message}`)
      }
    }

    // 2. 確認是否繼續
    console.log('\n⚠️  即將刪除以下 TTQS 評估表：')
    console.log('   - reaction_evaluations (反應評估)')
    console.log('   - learning_evaluations (學習評估)')
    console.log('   - behavior_evaluations (行為評估)')
    console.log('   - result_evaluations (結果評估)')
    console.log('\n這些表在代碼中未被使用，但如果有數據會先創建備份。')

    // 在生產環境中，你可能想要添加確認提示
    // const readline = require('readline');
    // const rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout
    // });
    //
    // const answer = await new Promise(resolve => {
    //     rl.question('是否繼續？(y/N): ', resolve);
    // });
    // rl.close();
    //
    // if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    //     console.log('❌ 操作已取消');
    //     return;
    // }

    // 3. 讀取並執行遷移腳本
    console.log('\n🚀 執行清理遷移腳本...')

    const migrationPath = path.join(__dirname, '../src/database/migrations/018_cleanup_unused_ttqs_evaluations.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // 執行遷移
    await sql.unsafe(migrationSQL)

    console.log('✅ 遷移腳本執行完成')

    // 4. 驗證清理結果
    console.log('\n🔍 驗證清理結果...')

    let allCleaned = true
    for (const tableName of tableChecks) {
      try {
        const exists = await sql`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = ${tableName} AND table_schema = 'public'
                    ) as exists
                `

        if (exists[0].exists) {
          console.log(`   ❌ ${tableName}: 仍然存在`)
          allCleaned = false
        } else {
          console.log(`   ✅ ${tableName}: 已刪除`)
        }
      } catch (error) {
        console.log(`   ✅ ${tableName}: 已刪除（查詢失敗說明表不存在）`)
      }
    }

    // 5. 檢查備份表
    console.log('\n📦 檢查備份表...')
    const backupTables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE '%evaluations_backup_%' 
            AND table_schema = 'public'
            ORDER BY table_name
        `

    if (backupTables.length > 0) {
      console.log('   📁 創建的備份表：')
      backupTables.forEach(table => {
        console.log(`      - ${table.table_name}`)
      })
    } else {
      console.log('   ℹ️  沒有創建備份表（原表可能沒有數據）')
    }

    // 6. 檢查遷移日誌
    console.log('\n📋 檢查遷移日誌...')
    try {
      const logs = await sql`
                SELECT migration_name, executed_at, description 
                FROM migration_log 
                WHERE migration_name LIKE '018_%' 
                ORDER BY executed_at DESC 
                LIMIT 5
            `

      if (logs.length > 0) {
        console.log('   📝 相關遷移日誌：')
        logs.forEach(log => {
          console.log(`      ${log.executed_at.toISOString()}: ${log.migration_name}`)
          console.log(`         ${log.description}`)
        })
      }
    } catch (error) {
      console.log('   ⚠️  無法讀取遷移日誌（migration_log 表可能不存在）')
    }

    // 7. 總結
    console.log(`\n${'='.repeat(60)}`)
    if (allCleaned) {
      console.log('🎉 TTQS 評估表清理完成！')
      console.log('\n✅ 已刪除的表：')
      console.log('   - reaction_evaluations')
      console.log('   - learning_evaluations')
      console.log('   - behavior_evaluations')
      console.log('   - result_evaluations')
      console.log('\n✅ 已清理的相關對象：')
      console.log('   - 相關索引')
      console.log('   - 相關序列')
      console.log('   - 相關觸發器')
      console.log('   - 相關視圖')
    } else {
      console.log('⚠️  清理部分完成，但仍有表未刪除')
      console.log('請檢查上面的驗證結果')
    }

    console.log('\n📝 後續手動清理提醒：')
    console.log('   1. 刪除 src/api/evaluation-routes.ts 文件')
    console.log('   2. 更新 src/database/migrations/016_comprehensive_database_optimization.sql')
    console.log('   3. 更新 docs/DATABASE_REDUNDANCY_ANALYSIS.md 文檔')
    console.log('   4. 檢查其他可能引用這些表的代碼')

  } catch (error) {
    console.error('\n❌ 清理過程中發生錯誤：')
    console.error(error.message)
    console.error('\n堆棧跟蹤：')
    console.error(error.stack)
    process.exit(1)
  }
}

// 執行清理
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupTTQSEvaluations()
    .then(() => {
      console.log('\n🏁 清理腳本執行完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 清理腳本執行失敗：', error.message)
      process.exit(1)
    })
}

export { cleanupTTQSEvaluations }
