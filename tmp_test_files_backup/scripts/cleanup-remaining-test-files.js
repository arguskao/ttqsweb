
/**
 * 清理剩餘的 test 開頭文件
 */

import fs from 'fs'

async function cleanupRemainingTestFiles() {
  console.log('🧹 清理剩餘的 test 開頭文件...\n')

  // 定義要清理的文件
  const filesToDelete = [
    {
      path: 'test-instructor-application.html',
      reason: '測試頁面，功能已整合到正式頁面',
      category: 'HTML 測試頁面'
    },
    {
      path: 'scripts/test-real-application.js',
      reason: '一次性測試腳本，已完成驗證講師申請功能 (包含測試帳號密碼)',
      category: '驗證腳本',
      security: true
    },
    {
      path: 'scripts/test-new-api.js',
      reason: '新 API 端點測試，功能已上線穩定',
      category: '驗證腳本'
    },
    {
      path: 'scripts/test-admin-api.js',
      reason: '管理員 API 測試，功能已驗證',
      category: '驗證腳本'
    },
    {
      path: 'scripts/test-instructor-application.js',
      reason: '講師申請功能測試，已完成驗證',
      category: '驗證腳本'
    },
    {
      path: 'scripts/cleanup-test-files.js',
      reason: '清理腳本，已完成清理任務',
      category: '工具腳本'
    }
  ]

  let deletedCount = 0
  let failedCount = 0
  let totalSize = 0
  let securityFilesDeleted = 0

  console.log('📋 準備刪除的文件:')
  filesToDelete.forEach(file => {
    console.log(`  - ${file.path}`)
    console.log(`    類別: ${file.category}`)
    console.log(`    理由: ${file.reason}`)
    if (file.security) {
      console.log('    🔒 安全風險: 包含敏感信息')
    }
    console.log('')
  })

  console.log('🗑️ 開始執行刪除...\n')

  for (const file of filesToDelete) {
    try {
      if (fs.existsSync(file.path)) {
        // 獲取文件大小
        const stats = fs.statSync(file.path)
        const fileSize = stats.size
        const sizeKB = (fileSize / 1024).toFixed(1)

        console.log(`🗑️  刪除: ${file.path} (${sizeKB}KB)`)

        // 刪除文件
        fs.unlinkSync(file.path)

        deletedCount++
        totalSize += fileSize

        if (file.security) {
          securityFilesDeleted++
          console.log('  🔒 已移除包含敏感信息的文件')
        }

        console.log('  ✅ 成功刪除')
      } else {
        console.log(`⏭️  跳過: ${file.path} (文件不存在)`)
      }
    } catch (error) {
      console.log(`❌ 刪除失敗: ${file.path} - ${error.message}`)
      failedCount++
    }
  }

  // 統計結果
  console.log('\n📊 清理結果統計:')
  console.log(`  成功刪除: ${deletedCount} 個文件`)
  console.log(`  刪除失敗: ${failedCount} 個文件`)
  console.log(`  節省空間: ${(totalSize / 1024).toFixed(1)}KB`)
  console.log(`  安全文件清理: ${securityFilesDeleted} 個`)
  console.log(`  清理成功率: ${deletedCount > 0 ? ((deletedCount / filesToDelete.length) * 100).toFixed(1) : 0}%`)

  // 驗證保留的重要文件
  console.log('\n✅ 驗證保留的重要文件:')
  const importantFiles = [
    'src/tests/api-integration.test.ts',
    'src/tests/auth-flow.test.ts',
    'src/tests/file-operations.test.ts',
    'vitest.config.ts',
    'scripts/setup-test-db.js'
  ]

  let preservedCount = 0
  importantFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ 保留: ${filePath}`)
      preservedCount++
    } else {
      console.log(`  ⚠️  缺失: ${filePath}`)
    }
  })

  console.log(`\n📁 重要文件保留狀態: ${preservedCount}/${importantFiles.length} 個文件存在`)

  // 最終報告
  console.log('\n🎉 剩餘 test 文件清理完成！')

  console.log('\n📋 清理成果:')
  console.log('  🎯 主要成果:')
  console.log(`    - 移除了 ${deletedCount} 個已完成任務的測試文件`)
  console.log(`    - 節省了 ${(totalSize / 1024).toFixed(1)}KB 存儲空間`)
  if (securityFilesDeleted > 0) {
    console.log(`    - 消除了 ${securityFilesDeleted} 個安全風險文件`)
  }
  console.log(`    - 保留了 ${preservedCount} 個重要測試文件`)

  console.log('\n  📈 項目改善:')
  console.log('    - 進一步減少了文件混亂')
  console.log('    - 移除了包含測試帳號密碼的文件')
  console.log('    - 專注於正式測試套件和必要工具')
  console.log('    - 提高了代碼庫的專業性')

  console.log('\n  🔄 後續狀態:')
  console.log('    - 所有一次性驗證腳本已清理完畢')
  console.log('    - 正式測試套件 (src/tests/) 完整保留')
  console.log('    - 重要工具腳本 (setup-test-db.js) 保留')
  console.log('    - 項目測試結構更加清晰')

  if (deletedCount === filesToDelete.length) {
    console.log('\n🏆 完美清理！所有目標文件都已成功移除！')
  }
}

// 執行清理
cleanupRemainingTestFiles().catch(console.error)
