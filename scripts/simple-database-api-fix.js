/**
 * 簡化的數據庫API修復
 * Simple Database API Fix
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 簡化數據庫API修復...')

const apiIndexPath = path.join(__dirname, '../src/api/index.ts')
let apiContent = fs.readFileSync(apiIndexPath, 'utf8')

// 簡單的文件下載端點
const simpleDownloadEndpoint = `// 添加文件下載端點 - 簡化版本
router.get('/api/v1/documents/:id/download', async (req: ApiRequest): Promise<ApiResponse> => {
  try {
    const id = parseInt(req.params?.id || '0', 10)
    if (!id) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無效的文件 ID',
          statusCode: 400
        }
      }
    }

    // 從數據庫查詢文件
    try {
      const { neon } = await import('@neondatabase/serverless')
      const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
      const sql = neon(DATABASE_URL)
      
      const result = await sql\`
        SELECT id, title, file_url, file_type, file_size, download_count
        FROM documents 
        WHERE id = \${id} AND is_public = true
      \`
      
      if (result.length === 0) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '文件不存在或不可下載',
            statusCode: 404
          }
        }
      }
      
      const doc = result[0] as any
      
      // 增加下載次數
      await sql\`
        UPDATE documents 
        SET download_count = COALESCE(download_count, 0) + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = \${id}
      \`

      return {
        success: true,
        data: {
          id: doc.id,
          title: doc.title,
          file_url: doc.file_url,
          file_name: doc.title + '.pdf',
          file_type: doc.file_type || 'application/pdf',
          file_size: doc.file_size,
          download_count: (doc.download_count || 0) + 1
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '數據庫查詢失敗',
          statusCode: 500
        }
      }
    }
  } catch (error) {
    console.error('Download error:', error)
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '下載文件失敗',
        statusCode: 500
      }
    }
  }
})`

// 簡單的文件列表端點
const simpleDocumentsEndpoint = `// 從數據庫獲取文件列表 - 簡化版本
router.get('/api/v1/documents', async (req: ApiRequest): Promise<ApiResponse> => {
  try {
    const { page = '1', limit = '12', category, search } = req.query || {}

    try {
      const { neon } = await import('@neondatabase/serverless')
      const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
      const sql = neon(DATABASE_URL)
      
      // 簡化查詢 - 先獲取所有文件，然後在JavaScript中過濾
      const allDocs = await sql\`
        SELECT id, title, description, file_url, file_type, file_size, 
               category, download_count, created_at
        FROM documents 
        WHERE is_public = true
        ORDER BY created_at DESC
      \`
      
      // JavaScript過濾
      let filteredDocs = allDocs as any[]
      
      if (category) {
        filteredDocs = filteredDocs.filter((doc: any) => doc.category === category)
      }
      
      if (search) {
        const searchLower = search.toLowerCase()
        filteredDocs = filteredDocs.filter((doc: any) => 
          doc.title?.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower)
        )
      }
      
      // 分頁處理
      const total = filteredDocs.length
      const offset = (parseInt(page) - 1) * parseInt(limit)
      const paginatedDocs = filteredDocs.slice(offset, offset + parseInt(limit))

      return {
        success: true,
        data: paginatedDocs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          file_url: doc.file_url,
          file_type: doc.file_type,
          file_size: doc.file_size,
          category: doc.category,
          download_count: doc.download_count || 0,
          created_at: doc.created_at
        })),
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '數據庫查詢失敗',
          statusCode: 500
        }
      }
    }
  } catch (error) {
    console.error('Documents list error:', error)
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取文件列表失敗',
        statusCode: 500
      }
    }
  }
})`

console.log('\n📋 替換API端點...')

// 找到並替換整個下載端點
const downloadPattern = /\/\/ 添加文件下載端點[\s\S]*?}\s*}\s*}\)/
if (downloadPattern.test(apiContent)) {
    apiContent = apiContent.replace(downloadPattern, simpleDownloadEndpoint)
    console.log('   ✅ 文件下載端點已替換')
} else {
    console.log('   ⚠️ 未找到下載端點模式')
}

// 找到並替換整個文件列表端點
const documentsPattern = /\/\/ 從數據庫獲取文件列表[\s\S]*?}\s*}\s*}\)/
if (documentsPattern.test(apiContent)) {
    apiContent = apiContent.replace(documentsPattern, simpleDocumentsEndpoint)
    console.log('   ✅ 文件列表端點已替換')
} else {
    console.log('   ⚠️ 未找到文件列表端點模式')
}

// 寫入更新後的內容
fs.writeFileSync(apiIndexPath, apiContent)

console.log('\n🎉 簡化API修復完成！')
console.log('\n📋 修復內容：')
console.log('   ✅ 使用簡化的數據庫查詢')
console.log('   ✅ 添加了適當的類型轉換')
console.log('   ✅ 改進了錯誤處理')
console.log('   ✅ JavaScript端過濾而非SQL過濾')

console.log('\n🚀 下一步：')
console.log('   1. 重新構建: npm run build')
console.log('   2. 重新部署: npm run deploy:pages')
console.log('   3. 測試文件下載功能')