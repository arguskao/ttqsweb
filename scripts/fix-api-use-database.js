/**
 * 修復API使用數據庫數據
 * Fix API to Use Database Data
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 修復API使用數據庫數據...')

const apiIndexPath = path.join(__dirname, '../src/api/index.ts')
let apiContent = fs.readFileSync(apiIndexPath, 'utf8')

// 新的文件下載端點 - 從數據庫讀取
const newDownloadEndpoint = `// 添加文件下載端點 - 從數據庫讀取
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
    const { neon } = await import('@neondatabase/serverless')
    const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    const sql = neon(DATABASE_URL)
    
    const documents = await sql\`
      SELECT id, title, file_url, file_type, file_size, download_count
      FROM documents 
      WHERE id = \${id} AND is_public = true
    \`
    
    if (documents.length === 0) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '文件不存在或不可下載',
          statusCode: 404
        }
      }
    }
    
    const document = documents[0]
    
    // 增加下載次數
    await sql\`
      UPDATE documents 
      SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = \${id}
    \`

    return {
      success: true,
      data: {
        id: document.id,
        title: document.title,
        file_url: document.file_url,
        file_name: document.title + '.pdf',
        file_type: document.file_type || 'application/pdf',
        file_size: document.file_size,
        download_count: (document.download_count || 0) + 1
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

// 新的文件列表端點 - 從數據庫讀取
const newDocumentsEndpoint = `// 從數據庫獲取文件列表
router.get('/api/v1/documents', async (req: ApiRequest): Promise<ApiResponse> => {
  try {
    const { page = '1', limit = '12', category, search } = req.query || {}

    // 從數據庫查詢文件
    const { neon } = await import('@neondatabase/serverless')
    const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    const sql = neon(DATABASE_URL)
    
    // 構建查詢條件
    let whereConditions = ['is_public = true']
    let queryParams = []
    
    if (category) {
      whereConditions.push(\`category = $\${queryParams.length + 1}\`)
      queryParams.push(category)
    }
    
    if (search) {
      whereConditions.push(\`(title ILIKE $\${queryParams.length + 1} OR description ILIKE $\${queryParams.length + 2})\`)
      queryParams.push(\`%\${search}%\`, \`%\${search}%\`)
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''
    
    // 獲取總數
    const countQuery = \`SELECT COUNT(*) as total FROM documents \${whereClause}\`
    const countResult = await sql.unsafe(countQuery, queryParams)
    const total = parseInt(countResult[0].total)
    
    // 獲取分頁數據
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const dataQuery = \`
      SELECT id, title, description, file_url, file_type, file_size, 
             category, download_count, created_at
      FROM documents 
      \${whereClause}
      ORDER BY created_at DESC
      LIMIT $\${queryParams.length + 1} OFFSET $\${queryParams.length + 2}
    \`
    
    const documents = await sql.unsafe(dataQuery, [...queryParams, parseInt(limit), offset])

    return {
      success: true,
      data: documents.map(doc => ({
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

// 查找並替換下載端點
const downloadStartMarker = '// 添加文件下載端點'
let downloadStartIndex = apiContent.indexOf(downloadStartMarker)

if (downloadStartIndex !== -1) {
    // 找到下載端點的結束位置
    let braceCount = 0
    let downloadEndIndex = downloadStartIndex
    let inFunction = false

    for (let i = downloadStartIndex; i < apiContent.length; i++) {
        if (apiContent[i] === '{') {
            braceCount++
            inFunction = true
        } else if (apiContent[i] === '}') {
            braceCount--
            if (inFunction && braceCount === 0) {
                downloadEndIndex = i + 1
                break
            }
        }
    }

    // 替換下載端點
    apiContent = apiContent.substring(0, downloadStartIndex) +
        newDownloadEndpoint +
        apiContent.substring(downloadEndIndex)

    console.log('   ✅ 文件下載端點已更新為數據庫查詢')
} else {
    console.log('   ⚠️ 未找到下載端點')
}

// 查找並替換文件列表端點
const documentsStartMarker = 'router.get(\'/api/v1/documents\', async'
const documentsStartIndex = apiContent.indexOf(documentsStartMarker)

if (documentsStartIndex !== -1) {
    // 找到文件列表端點的結束位置
    let braceCount = 0
    let documentsEndIndex = documentsStartIndex
    let inFunction = false

    for (let i = documentsStartIndex; i < apiContent.length; i++) {
        if (apiContent[i] === '{') {
            braceCount++
            inFunction = true
        } else if (apiContent[i] === '}') {
            braceCount--
            if (inFunction && braceCount === 0) {
                documentsEndIndex = i + 1
                break
            }
        }
    }

    // 替換文件列表端點
    apiContent = apiContent.substring(0, documentsStartIndex) +
        newDocumentsEndpoint +
        apiContent.substring(documentsEndIndex)

    console.log('   ✅ 文件列表端點已更新為數據庫查詢')
} else {
    console.log('   ⚠️ 未找到文件列表端點')
}

// 寫入更新後的內容
fs.writeFileSync(apiIndexPath, apiContent)

console.log('\n🎉 API端點修復完成！')
console.log('\n📋 修復內容：')
console.log('   ✅ 文件下載端點現在從數據庫讀取真實數據')
console.log('   ✅ 文件列表端點現在從數據庫讀取真實數據')
console.log('   ✅ 支持分類和搜索過濾')
console.log('   ✅ 正確的分頁處理')
console.log('   ✅ 自動更新下載次數')

console.log('\n🚀 下一步：')
console.log('   1. 重新構建: npm run build')
console.log('   2. 重新部署: npm run deploy:pages')
console.log('   3. 測試文件下載功能')