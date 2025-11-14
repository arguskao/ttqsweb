
/**
 * 分析剩餘的 test 開頭文件
 */

import fs from 'fs'

async function analyzeRemainingTestFiles() {
  console.log('🔍 分析剩餘的 test 開頭文件...\n')

  // 定義要分析的文件
  const testFiles = {
    '根目錄 HTML 文件': [
      'test-instructor-application.html'
    ],
    'scripts 目錄 JS 文件': [
      'scripts/test-real-application.js',
      'scripts/test-new-api.js',
      'scripts/test-admin-api.js',
      'scripts/test-instructor-application.js'
    ],
    '工具腳本': [
      'scripts/setup-test-db.js',
      'scripts/cleanup-test-files.js'
    ],
    '正式測試文件 (保留)': [
      'src/tests/api-integration.test.ts',
      'src/tests/auth-flow.test.ts',
      'src/tests/file-operations.test.ts',
      'src/tests/components/CourseCard.test.ts',
      'src/tests/services/auth-service.test.ts',
      'src/tests/views/LoginView.test.ts',
      'src/tests/setup-test-database.ts'
    ],
    '工具類文件 (保留)': [
      'src/scripts/test-db.ts',
      'src/scripts/test-course-admin-guard.ts',
      'src/utils/test-database.ts',
      'vitest.config.ts'
    ]
  }

  const canDelete = []
  const shouldKeep = []
  let totalSize = 0

  for (const [category, files] of Object.entries(testFiles)) {
    console.log(`\n📂 ${category}:`)

    for (const filePath of files) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        const fileSize = stats.size
        const sizeKB = (fileSize / 1024).toFixed(1)

        // 分析文件內容來判斷是否可以刪除
        let canDeleteFile = false
        let reason = ''

        if (category === '根目錄 HTML 文件') {
          canDeleteFile = true
          reason = '測試頁面，功能已整合到正式頁面'
        } else if (category === 'scripts 目錄 JS 文件') {
          // 檢查文件內容
          const content = fs.readFileSync(filePath, 'utf8')

          if (filePath.includes('test-real-application.js')) {
            canDeleteFile = true
            reason = '一次性測試腳本，已完成驗證講師申請功能'
          } else if (filePath.includes('test-new-api.js')) {
            canDeleteFile = true
            reason = '新 API 端點測試，功能已上線穩定'
          } else if (filePath.includes('test-admin-api.js')) {
            canDeleteFile = true
            reason = '管理員 API 測試，功能已驗證'
          } else if (filePath.includes('test-instructor-application.js')) {
            canDeleteFile = true
            reason = '講師申請功能測試，已完成驗證'
          }
        } else if (category === '工具腳本') {
          if (filePath.includes('cleanup-test-files.js')) {
            canDeleteFile = true
            reason = '清理腳本，已完成清理任務'
          } else {
            canDeleteFile = false
            reason = '數據庫設置工具，可能還會用到'
          }
        } else {
          canDeleteFile = false
          reason = '正式測試套件或重要工具，需要保留'
        }

        const status = canDeleteFile ? '🗑️ 可刪除' : '✅ 保留'
        console.log(`  ${status} ${filePath} (${sizeKB}KB) - ${reason}`)

        if (canDeleteFile) {
          canDelete.push({ path: filePath, size: fileSize, reason })
          totalSize += fileSize
        } else {
          shouldKeep.push({ path: filePath, reason })
        }
      } else {
        console.log(`  ⏭️ 不存在: ${filePath}`)
      }
    }
  }

  // 生成清理建議
  console.log('\n📊 分析結果:')
  console.log(`  可刪除文件: ${canDelete.length} 個`)
  console.log(`  需要保留: ${shouldKeep.length} 個`)
  console.log(`  可節省空間: ${(totalSize / 1024).toFixed(1)}KB`)

  if (canDelete.length > 0) {
    console.log('\n🗑️ 建議刪除的文件:')
    canDelete.forEach(file => {
      console.log(`  - ${file.path} (${(file.size / 1024).toFixed(1)}KB)`)
      console.log(`    理由: ${file.reason}`)
    })

    console.log('\n💡 特別說明:')
    console.log('  - test-real-application.js 包含測試帳號密碼，建議刪除')
    console.log('  - 這些都是一次性驗證腳本，完成任務後可安全刪除')
    console.log('  - 正式測試套件 (src/tests/) 會完整保留')
  }

  console.log('\n✅ 保留的重要文件:')
  shouldKeep.forEach(file => {
    console.log(`  - ${file.path}`)
    console.log(`    理由: ${file.reason}`)
  })

  return canDelete
}

// 執行分析
analyzeRemainingTestFiles().then(canDelete => {
  if (canDelete.length > 0) {
    console.log('\n🔧 如果要執行清理，可以運行:')
    console.log('node scripts/cleanup-remaining-test-files.js')
  }
}).catch(console.error)
