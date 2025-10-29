
/**
 * 清理舊表腳本
 * Cleanup Old Tables Script
 *
 * ⚠️ 警告：此腳本會永久刪除 documents 和 ttqs_documents 表
 * 請確保數據已成功遷移並經過充分測試
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

async function verifyMigration() {
  console.log('🔍 驗證數據遷移完整性...')

  const documentsCount = await getTableCount('documents')
  const ttqsDocumentsCount = await getTableCount('ttqs_documents')
  const uploadedFilesCount = await getTableCount('uploaded_files')

  console.log('📊 當前狀態:')
  console.log(`   - documents: ${documentsCount} 記錄`)
  console.log(`   - ttqs_documents: ${ttqsDocumentsCount} 記錄`)
  console.log(`   - uploaded_files: ${uploadedFilesCount} 記錄`)

  const expectedMinimum = documentsCount + ttqsDocumentsCount

  if (uploadedFilesCount < expectedMinimum) {
    console.log('❌ 警告：uploaded_files 記錄數少於原始表總和')
    console.log('   建議先檢查數據遷移是否完整')
    return false
  }

  console.log('✅ 數據遷移驗證通過')
  return true
}

async function executeCleanup() {
  console.log('\n🔄 執行清理腳本...')

  try {
    // 讀取並執行清理腳本
    const migration015Path = path.join(__dirname, '../src/database/migrations/015_cleanup_redundant_tables.sql')

    if (!fs.existsSync(migration015Path)) {
      console.error('❌ 找不到清理腳本:', migration015Path)
      return false
    }

    const cleanupContent = fs.readFileSync(migration015Path, 'utf8')
    await sql.unsafe(cleanupContent)

    console.log('✅ 清理腳本執行完成')
    return true

  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error.message)
    return false
  }
}

async function main() {
  console.log('🧹 文件管理系統清理工具')
  console.log('📅 執行時間:', new Date().toISOString())
  console.log('\n⚠️  警告：此操作將永久刪除以下表：')
  console.log('   - documents')
  console.log('   - ttqs_documents')
  console.log('\n📋 執行前會創建備份表：')
  console.log('   - documents_backup_20241028')
  console.log('   - ttqs_documents_backup_20241028')

  try {
    // 步驟 1: 檢查表是否存在
    const documentsExists = await checkTableExists('documents')
    const ttqsDocumentsExists = await checkTableExists('ttqs_documents')
    const uploadedFilesExists = await checkTableExists('uploaded_files')

    if (!documentsExists && !ttqsDocumentsExists) {
      console.log('✅ 沒有需要清理的表，退出')
      rl.close()
      return
    }

    if (!uploadedFilesExists) {
      console.log('❌ 錯誤：uploaded_files 表不存在，請先執行遷移')
      rl.close()
      return
    }

    // 步驟 2: 驗證遷移
    const migrationValid = await verifyMigration()

    if (!migrationValid) {
      const continueAnyway = await askQuestion('\n⚠️  數據遷移驗證失敗，是否仍要繼續？(y/N): ')
      if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
        console.log('❌ 用戶取消操作')
        rl.close()
        return
      }
    }

    // 步驟 3: 最終確認
    console.log('\n🚨 最終確認')
    console.log('此操作將：')
    console.log('1. 創建備份表')
    console.log('2. 刪除 documents 和 ttqs_documents 表')
    console.log('3. 清理相關索引和約束')
    console.log('4. 無法撤銷（除非從備份恢復）')

    const finalConfirm = await askQuestion('\n確定要執行清理操作嗎？請輸入 "DELETE" 確認: ')

    if (finalConfirm !== 'DELETE') {
      console.log('❌ 確認失敗，操作已取消')
      rl.close()
      return
    }

    // 步驟 4: 執行清理
    console.log('\n🔄 開始執行清理...')
    const success = await executeCleanup()

    if (success) {
      console.log('\n🎉 清理完成！')
      console.log('📊 最終狀態:')

      const finalUploadedFilesCount = await getTableCount('uploaded_files')
      console.log(`   - uploaded_files: ${finalUploadedFilesCount} 記錄`)

      const backupCount = await getTableCount('documents_backup_20241028')
      console.log(`   - documents_backup_20241028: ${backupCount} 記錄`)

      console.log('\n📝 後續建議:')
      console.log('1. 測試所有文件相關功能')
      console.log('2. 確認 API 正常工作')
      console.log('3. 監控系統運行狀況')
      console.log('4. 如無問題，可在一週後刪除備份表')

    } else {
      console.log('\n❌ 清理失敗')
      console.log('📝 故障排除:')
      console.log('1. 檢查數據庫連接和權限')
      console.log('2. 查看詳細錯誤日誌')
      console.log('3. 如需協助，請聯繫數據庫管理員')
    }

  } catch (error) {
    console.error('❌ 清理過程中發生未預期錯誤:', error)
  } finally {
    rl.close()
  }
}

// 執行清理
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main }
