
/**
 * 綜合資料庫優化腳本
 * Comprehensive Database Optimization Script
 *
 * 根據 DATABASE_REDUNDANCY_ANALYSIS.md 報告執行完整的資料庫優化
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
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

// 創建命令行界面
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

async function checkTableExists(tableName) {
  try {
    const result = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = ${tableName}
            ) as exists
        `
    return result[0].exists
  } catch (error) {
    console.error(`檢查表 ${tableName} 時出錯:`, error.message)
    return false
  }
}

async function getTableCount(tableName) {
  try {
    if (!(await checkTableExists(tableName))) {
      return 0
    }
    const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`)
    return parseInt(result[0].count)
  } catch (error) {
    console.error(`獲取表 ${tableName} 記錄數時出錯:`, error.message)
    return 0
  }
}

async function executeStep(stepName, sqlContent) {
  console.log(`\n🔄 執行步驟: ${stepName}`)
  try {
    await sql.unsafe(sqlContent)
    console.log(`✅ ${stepName} - 完成`)
    return true
  } catch (error) {
    console.error(`❌ ${stepName} - 失敗:`, error.message)
    return false
  }
}

async function analyzeCurrentState() {
  console.log('\n📊 分析當前資料庫狀態...')

  const tables = [
    'documents', 'ttqs_documents', 'instructor_applications',
    'instructor_development', 'instructor_ratings', 'uploaded_files'
  ]

  const tableStats = {}

  for (const table of tables) {
    const exists = await checkTableExists(table)
    const count = exists ? await getTableCount(table) : 0
    tableStats[table] = { exists, count }

    console.log(`   📋 ${table}: ${exists ? '存在' : '不存在'} (${count} 記錄)`)
  }

  return tableStats
}

async function executeOptimization() {
  console.log('\n🚀 開始執行綜合資料庫優化')

  try {
    // 步驟 1: 執行主要優化
    const optimization016Path = path.join(__dirname, '../src/database/migrations/016_comprehensive_database_optimization.sql')

    if (!fs.existsSync(optimization016Path)) {
      console.error('❌ 找不到優化腳本:', optimization016Path)
      return false
    }

    const optimization016Content = fs.readFileSync(optimization016Path, 'utf8')
    const success = await executeStep('綜合資料庫優化 (016)', optimization016Content)

    if (!success) {
      console.error('❌ 優化失敗，停止執行')
      return false
    }

    return true

  } catch (error) {
    console.error('❌ 優化過程中發生錯誤:', error.message)
    return false
  }
}

async function executeCleanup() {
  console.log('\n🧹 執行清理階段')

  try {
    const cleanup017Path = path.join(__dirname, '../src/database/migrations/017_cleanup_all_redundant_tables.sql')

    if (!fs.existsSync(cleanup017Path)) {
      console.error('❌ 找不到清理腳本:', cleanup017Path)
      return false
    }

    const cleanup017Content = fs.readFileSync(cleanup017Path, 'utf8')
    return await executeStep('清理冗餘表 (017)', cleanup017Content)

  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error.message)
    return false
  }
}

async function generateOptimizationReport(beforeStats, afterStats) {
  console.log('\n📈 生成優化報告...')

  const report = {
    executionTime: new Date().toISOString(),
    beforeOptimization: beforeStats,
    afterOptimization: afterStats,
    changes: {},
    recommendations: []
  }

  // 計算變化
  for (const table in beforeStats) {
    if (beforeStats[table].exists && !afterStats[table]?.exists) {
      report.changes[table] = 'REMOVED'
    } else if (!beforeStats[table].exists && afterStats[table]?.exists) {
      report.changes[table] = 'CREATED'
    } else if (beforeStats[table].count !== afterStats[table]?.count) {
      report.changes[table] = `COUNT_CHANGED: ${beforeStats[table].count} -> ${afterStats[table]?.count || 0}`
    }
  }

  // 添加建議
  report.recommendations = [
    '監控系統性能，確保查詢速度正常',
    '測試所有文件上傳和管理功能',
    '測試講師申請和管理流程',
    '檢查 API 端點是否正常工作',
    '一週後可刪除備份表（*_backup_20241028）',
    '定期執行 VACUUM ANALYZE 維護性能'
  ]

  // 保存報告
  const reportPath = path.join(__dirname, '../docs/OPTIMIZATION_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`📄 優化報告已保存到: ${reportPath}`)

  return report
}

async function main() {
  console.log('🎯 綜合資料庫優化工具')
  console.log('📅 執行時間:', new Date().toISOString())
  console.log('\n📋 本次優化將處理以下問題：')
  console.log('   🔴 高優先級：統一文件管理系統')
  console.log('   🟡 中優先級：整合講師管理系統')
  console.log('   🟢 低優先級：優化評分系統')
  console.log('   🔧 額外：索引優化和數據完整性檢查')

  try {
    // 步驟 1: 分析當前狀態
    const beforeStats = await analyzeCurrentState()

    // 步驟 2: 確認執行
    console.log('\n⚠️  即將執行以下操作：')
    console.log('   1. 將 ttqs_documents 遷移到 documents 表')
    console.log('   2. 將 instructor_development 整合到 instructor_applications 表')
    console.log('   3. 創建統一的評分視圖')
    console.log('   4. 優化索引和約束')
    console.log('   5. 創建向後兼容視圖')
    console.log('   6. 創建備份表')

    const confirmOptimization = await askQuestion('\n是否繼續執行優化？(y/N): ')
    if (confirmOptimization.toLowerCase() !== 'y' && confirmOptimization.toLowerCase() !== 'yes') {
      console.log('❌ 用戶取消操作')
      rl.close()
      return
    }

    // 步驟 3: 執行優化
    const optimizationSuccess = await executeOptimization()

    if (!optimizationSuccess) {
      console.log('❌ 優化失敗，停止執行')
      rl.close()
      return
    }

    // 步驟 4: 詢問是否執行清理
    console.log('\n🎉 優化階段完成！')
    console.log('📝 建議先測試系統功能，確認一切正常後再執行清理階段')

    const confirmCleanup = await askQuestion('\n是否立即執行清理階段（刪除舊表）？(y/N): ')

    let cleanupSuccess = false
    if (confirmCleanup.toLowerCase() === 'y' || confirmCleanup.toLowerCase() === 'yes') {
      console.log('\n🚨 最終確認：清理階段將永久刪除舊表')
      const finalConfirm = await askQuestion('請輸入 "CLEANUP" 確認執行清理: ')

      if (finalConfirm === 'CLEANUP') {
        cleanupSuccess = await executeCleanup()
      } else {
        console.log('❌ 確認失敗，跳過清理階段')
      }
    }

    // 步驟 5: 分析最終狀態
    const afterStats = await analyzeCurrentState()

    // 步驟 6: 生成報告
    const report = await generateOptimizationReport(beforeStats, afterStats)

    // 步驟 7: 顯示摘要
    console.log('\n🎊 資料庫優化完成！')
    console.log('\n📊 優化摘要：')
    console.log(`   - 優化階段: ${optimizationSuccess ? '✅ 成功' : '❌ 失敗'}`)
    console.log(`   - 清理階段: ${cleanupSuccess ? '✅ 成功' : '⏭️ 跳過'}`)

    console.log('\n📝 後續步驟：')
    if (!cleanupSuccess) {
      console.log('   1. 測試所有相關功能')
      console.log('   2. 確認系統運行正常')
      console.log('   3. 執行清理腳本: npm run cleanup:all-tables')
    } else {
      console.log('   1. 測試所有相關功能')
      console.log('   2. 監控系統性能')
      console.log('   3. 一週後刪除備份表')
    }

    console.log('\n📄 詳細報告請查看: docs/OPTIMIZATION_REPORT.json')

  } catch (error) {
    console.error('❌ 優化過程中發生未預期錯誤:', error)
    console.log('\n🔧 故障排除建議：')
    console.log('   1. 檢查數據庫連接和權限')
    console.log('   2. 查看詳細錯誤日誌')
    console.log('   3. 檢查遷移腳本語法')
    console.log('   4. 如需回滾，請使用備份表恢復')
  } finally {
    rl.close()
  }
}

// 執行優化
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main }
