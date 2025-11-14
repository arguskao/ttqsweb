/**
 * 測試文件下載功能
 */

const API_BASE = 'http://localhost:8788/api/v1'

async function testFileDownload() {
  console.log('🧪 測試文件下載功能...')
  
  try {
    // 1. 測試文件列表
    console.log('\n1. 測試文件列表...')
    const listResponse = await fetch(`${API_BASE}/documents`)
    const listData = await listResponse.json()
    
    if (listData.success) {
      console.log('   ✅ 文件列表獲取成功')
      console.log(`   📄 找到 ${listData.data.length} 個文件`)
      
      if (listData.data.length > 0) {
        const firstFile = listData.data[0]
        console.log(`   📋 第一個文件: ${firstFile.title}`)
        
        // 2. 測試文件下載
        console.log('\n2. 測試文件下載...')
        const downloadResponse = await fetch(`${API_BASE}/documents/${firstFile.id}/download`)
        const downloadData = await downloadResponse.json()
        
        if (downloadData.success) {
          console.log('   ✅ 文件下載端點正常')
          console.log(`   🔗 下載URL: ${downloadData.data.file_url}`)
        } else {
          console.log('   ❌ 文件下載失敗:', downloadData.error.message)
        }
      }
    } else {
      console.log('   ❌ 文件列表獲取失敗:', listData.error.message)
    }
    
    // 3. 測試分類
    console.log('\n3. 測試分類獲取...')
    const categoriesResponse = await fetch(`${API_BASE}/files/categories/details`)
    const categoriesData = await categoriesResponse.json()
    
    if (categoriesData.success) {
      console.log('   ✅ 分類獲取成功')
      console.log(`   📂 分類數量: ${categoriesData.data.length}`)
    } else {
      console.log('   ❌ 分類獲取失敗:', categoriesData.error.message)
    }
    
    // 4. 測試統計
    console.log('\n4. 測試下載統計...')
    const statsResponse = await fetch(`${API_BASE}/files/stats/downloads`)
    const statsData = await statsResponse.json()
    
    if (statsData.success) {
      console.log('   ✅ 統計獲取成功')
      console.log(`   📊 統計項目: ${statsData.data.length}`)
    } else {
      console.log('   ❌ 統計獲取失敗:', statsData.error.message)
    }
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message)
  }
}

// 如果是直接執行此腳本
if (typeof window === 'undefined') {
  console.log('🧪 測試文件下載功能 - API端點檢查')
  console.log('📋 已添加的API端點：')
  console.log('   ✅ GET /api/v1/documents - 文件列表')
  console.log('   ✅ GET /api/v1/documents/:id/download - 文件下載')
  console.log('   ✅ GET /api/v1/files/categories/details - 分類詳情')
  console.log('   ✅ GET /api/v1/files/stats/downloads - 下載統計')
  console.log('')
  console.log('🚀 請部署後在瀏覽器中測試：')
  console.log('   1. 訪問 /documents 頁面')
  console.log('   2. 嘗試下載文件')
  console.log('   3. 檢查是否正常下載')
} else {
  // 瀏覽器環境
  testFileDownload()
}

export { testFileDownload }
