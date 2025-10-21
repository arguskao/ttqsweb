// 重構的文檔服務 - 使用 Neon 數據庫
import { neonDb } from '../utils/neon-database'

// Document interface
interface Document {
  id: number
  title: string
  description: string | null
  file_url: string
  file_type: string | null
  file_size: number | null
  category: string | null
  is_public: boolean
  uploaded_by: number | null
  download_count: number
  created_at: Date
}

// Document service class
export class DocumentServiceNeon {
  // 獲取文檔列表（帶分頁和篩選）
  async getDocuments(options: {
    page?: number
    limit?: number
    category?: string
    search?: string
    isPublic?: boolean
  } = {}): Promise<{ data: Document[]; meta: any }> {
    const { page = 1, limit = 12, category, search, isPublic = true } = options
    const offset = (page - 1) * limit

    try {
      // 構建 WHERE 條件
      let whereConditions = ['is_public = $1']
      let params: any[] = [isPublic]
      let paramIndex = 2

      if (category) {
        whereConditions.push(`category = $${paramIndex}`)
        params.push(category)
        paramIndex++
      }

      if (search) {
        whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }

      const whereClause = whereConditions.join(' AND ')

      // 獲取總數
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM documents 
        WHERE ${whereClause}
      `
      const countResult = await neonDb.queryOne<{ count: string }>(countQuery, params)
      const total = parseInt(countResult?.count || '0', 10)

      // 獲取分頁數據
      const dataQuery = `
        SELECT * 
        FROM documents
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      const documents = await neonDb.queryMany<Document>(dataQuery, [...params, limit, offset])

      return {
        data: documents,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Document service error:', error)
      throw new Error('Failed to fetch documents')
    }
  }

  // 根據 ID 獲取文檔
  async getDocumentById(id: number): Promise<Document | null> {
    try {
      const query = `
        SELECT * 
        FROM documents
        WHERE id = $1
      `
      return await neonDb.queryOne<Document>(query, [id])
    } catch (error) {
      console.error('Get document by ID error:', error)
      throw new Error('Failed to fetch document')
    }
  }

  // 增加下載次數
  async incrementDownloadCount(id: number): Promise<void> {
    try {
      const query = `
        UPDATE documents
        SET download_count = download_count + 1
        WHERE id = $1
      `
      await neonDb.query(query, [id])
    } catch (error) {
      console.error('Increment download count error:', error)
      throw new Error('Failed to update download count')
    }
  }

  // 獲取所有分類
  async getCategories(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT category
        FROM documents
        WHERE category IS NOT NULL AND is_public = true
        ORDER BY category
      `
      const results = await neonDb.queryMany<{ category: string }>(query)
      return results.map(r => r.category)
    } catch (error) {
      console.error('Get categories error:', error)
      throw new Error('Failed to fetch categories')
    }
  }

  // 獲取下載統計
  async getDownloadStats(): Promise<any[]> {
    try {
      const query = `
        SELECT
          category,
          COUNT(*) as document_count,
          SUM(download_count) as total_downloads
        FROM documents
        WHERE is_public = true
        GROUP BY category
        ORDER BY total_downloads DESC
      `
      return await neonDb.queryMany<any>(query)
    } catch (error) {
      console.error('Get download stats error:', error)
      throw new Error('Failed to fetch download statistics')
    }
  }
}

// 導出實例
export const documentServiceNeon = new DocumentServiceNeon()
export default documentServiceNeon