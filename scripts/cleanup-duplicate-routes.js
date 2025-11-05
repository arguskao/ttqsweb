/**
 * 清理 index.ts 中重複的路由定義
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const indexPath = path.join(__dirname, '..', 'src', 'api', 'index.ts')

async function main() {
  try {
    console.log('🧹 清理重複的路由定義...')

    // 讀取檔案內容
    const content = fs.readFileSync(indexPath, 'utf8')

    // 找到需要清理的部分
    const startMarker = '// 添加缺失的API端點'
    const endMarker = '// 設置所有路由'

    const startIndex = content.indexOf(startMarker)
    const endIndex = content.indexOf(endMarker)

    if (startIndex === -1 || endIndex === -1) {
      console.log('❌ 找不到標記，無法自動清理')
      return
    }

    console.log(`📍 找到重複路由區段: ${startIndex} - ${endIndex}`)

    // 保留檔案的前半部分和後半部分
    const beforeSection = content.substring(0, startIndex)
    const afterSection = content.substring(endIndex)

    // 建立新的內容
    const newContent = beforeSection +
      '// 重複的路由定義已移至對應的模組\n' +
      '// 文件相關路由: src/api/documents/\n' +
      '// 認證相關路由: src/api/auth-routes.ts\n\n' +
      afterSection

    // 備份原檔案
    const backupPath = indexPath + '.backup.' + Date.now()
    fs.writeFileSync(backupPath, content)
    console.log(`💾 已備份原檔案: ${backupPath}`)

    // 寫入新內容
    fs.writeFileSync(indexPath, newContent)
    console.log('✅ 重複路由已清理')

    // 顯示清理的統計
    const removedLines = content.split('\n').length - newContent.split('\n').length
    console.log(`📊 清理統計: 移除了 ${removedLines} 行重複代碼`)

  } catch (error) {
    console.error('❌ 清理失敗:', error.message)
  }
}

main()
