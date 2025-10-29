/**
 * 文檔功能Repository類別
 * 提供數據庫操作接口
 */

import { BaseRepository } from '../database'

import type {
  Document,
  DocumentWithUploader,
  DocumentStats,
  DocumentCategory,
  DownloadStats,
  DocumentSearchParams,
  DocumentPaginationMeta,
  DocumentDownload,
  DocumentValidation
} from './types'

// 文檔Repository
export class DocumentRepository extends BaseRepository<Document> {
  constructor() {
    super('documents')
  }

  // 簡化的獲取所有文檔方法
  async findAllPublic(): Promise<Document[]> {
    return this.queryMany(
      'SELECT * FROM documents WHERE is_public = true ORDER BY created_at DESC'
    )
  }

  // 搜索文檔（帶篩選和分頁）
  async searchDocuments(
    params: DocumentSearchParams
  ): Promise<{ data: DocumentWithUploader[]; meta: DocumentPaginationMeta }> {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      isPublic,
      uploader_id,
      file_type,
      date_from,
      date_to
    } = params

    const offset = (page - 1) * limit
    const whereConditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (category) {
      whereConditions.push(`category = $${paramIndex}`)
      values.push(category)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      values.push(`%${search}%`)
      paramIndex++
    }

    if (isPublic !== undefined) {
      whereConditions.push(`is_public = $${paramIndex}`)
      values.push(isPublic)
      paramIndex++
    }

    if (uploader_id) {
      whereConditions.push(`uploader_id = $${paramIndex}`)
      values.push(uploader_id)
      paramIndex++
    }

    if (file_type) {
      whereConditions.push(`file_type = $${paramIndex}`)
      values.push(file_type)
      paramIndex++
    }

    if (date_from) {
      whereConditions.push(`created_at >= $${paramIndex}`)
      values.push(date_from)
      paramIndex++
    }

    if (date_to) {
      whereConditions.push(`created_at <= $${paramIndex}`)
      values.push(date_to)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 獲取總數
    const countResult = await this.queryOne(
      `SELECT COUNT(*) as total FROM documents ${whereClause}`,
      values
    )
    const total = parseInt(countResult?.total || '0')

    // 獲取數據
    const data = await this.queryMany(
      `SELECT d.*, 
              u.first_name || ' ' || u.last_name as uploader_name,
              u.email as uploader_email
       FROM documents d
       LEFT JOIN users u ON d.uploader_id = u.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    const meta: DocumentPaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }

    return { data, meta }
  }

  // 根據ID獲取文檔詳情
  async findByIdWithUploader(documentId: number): Promise<DocumentWithUploader | null> {
    const result = await this.queryOne(
      `SELECT d.*, 
              u.first_name || ' ' || u.last_name as uploader_name,
              u.email as uploader_email
       FROM documents d
       LEFT JOIN users u ON d.uploader_id = u.id
       WHERE d.id = $1`,
      [documentId]
    )

    return result || null
  }

  // 根據分類獲取文檔
  async findByCategory(category: string): Promise<Document[]> {
    return this.queryMany(
      'SELECT * FROM documents WHERE category = $1 AND is_public = true ORDER BY created_at DESC',
      [category]
    )
  }

  // 根據上傳者獲取文檔
  async findByUploader(uploaderId: number): Promise<Document[]> {
    return this.queryMany(
      'SELECT * FROM documents WHERE uploader_id = $1 ORDER BY created_at DESC',
      [uploaderId]
    )
  }

  // 獲取文檔統計
  async getStats(): Promise<DocumentStats> {
    const result = await this.queryOne(
      `SELECT 
         COUNT(*) as total_documents,
         SUM(download_count) as total_downloads,
         SUM(file_size) as total_size,
         AVG(file_size) as average_size,
         COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_uploads
       FROM documents`
    )

    const categoryStats = await this.queryMany(
      'SELECT category, COUNT(*) as count FROM documents GROUP BY category ORDER BY count DESC'
    )

    const typeStats = await this.queryMany(
      'SELECT file_type, COUNT(*) as count FROM documents GROUP BY file_type ORDER BY count DESC'
    )

    const documentsByCategory: Record<string, number> = {}
    const documentsByType: Record<string, number> = {}

    categoryStats.forEach(stat => {
      documentsByCategory[stat.category] = parseInt(stat.count)
    })

    typeStats.forEach(stat => {
      documentsByType[stat.file_type] = parseInt(stat.count)
    })

    return {
      totalDocuments: parseInt(result?.total_documents || '0'),
      totalDownloads: parseInt(result?.total_downloads || '0'),
      totalSize: parseInt(result?.total_size || '0'),
      averageSize: parseFloat(result?.average_size || '0'),
      documentsByCategory,
      documentsByType,
      recentUploads: parseInt(result?.recent_uploads || '0')
    }
  }

  // 獲取文檔分類列表
  async getCategories(): Promise<DocumentCategory[]> {
    const result = await this.queryMany(
      `SELECT 
         category,
         COUNT(*) as count,
         MAX(description) as description
       FROM documents 
       WHERE is_public = true
       GROUP BY category 
       ORDER BY count DESC`
    )

    return result.map(row => ({
      category: row.category,
      count: parseInt(row.count),
      description: row.description
    }))
  }

  // 增加下載次數
  async incrementDownloadCount(documentId: number): Promise<void> {
    await this.executeRaw(
      'UPDATE documents SET download_count = download_count + 1, updated_at = NOW() WHERE id = $1',
      [documentId]
    )
  }

  // 更新文檔
  async updateDocument(documentId: number, updateData: Partial<Document>): Promise<Document> {
    const updateFields = Object.keys(updateData)
      .filter(key => updateData[key as keyof Document] !== undefined)
      .map(key => `${key} = $${Object.keys(updateData).indexOf(key) + 2}`)
      .join(', ')

    const values = [documentId, ...Object.values(updateData).filter(v => v !== undefined)]

    await this.executeRaw(
      `UPDATE documents SET ${updateFields}, updated_at = NOW() WHERE id = $1`,
      values
    )

    const updated = await this.findById(documentId)
    if (!updated) {
      throw new Error(`Document with ID ${documentId} not found after update`)
    }
    return updated
  }

  // 驗證文檔
  async validateDocument(documentData: Partial<Document>): Promise<DocumentValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!documentData.title || documentData.title.trim().length === 0) {
      errors.push('文檔標題不能為空')
    }

    if (!documentData.file_name || documentData.file_name.trim().length === 0) {
      errors.push('文件名不能為空')
    }

    if (!documentData.file_type || documentData.file_type.trim().length === 0) {
      errors.push('文件類型不能為空')
    }

    if (!documentData.category || documentData.category.trim().length === 0) {
      errors.push('文檔分類不能為空')
    }

    if (documentData.file_size && documentData.file_size <= 0) {
      errors.push('文件大小必須大於0')
    }

    if (documentData.file_size && documentData.file_size > 100 * 1024 * 1024) {
      // 100MB
      warnings.push('文件大小超過100MB，可能影響上傳速度')
    }

    const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3']
    if (documentData.file_type && !allowedTypes.includes(documentData.file_type.toLowerCase())) {
      warnings.push('文件類型可能不被支持')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        size: documentData.file_size ?? 0,
        type: documentData.file_type ?? '',
        extension: documentData.file_name?.split('.').pop() ?? ''
      }
    }
  }
}

// 文檔下載Repository
export class DocumentDownloadRepository extends BaseRepository<DocumentDownload> {
  constructor() {
    super('document_downloads')
  }

  // 記錄下載
  async recordDownload(
    documentId: number,
    userId: number | null,
    ipAddress: string,
    userAgent: string
  ): Promise<DocumentDownload> {
    const downloadData = {
      document_id: documentId,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      downloaded_at: new Date()
    }

    return this.create(downloadData)
  }

  // 獲取下載統計
  async getDownloadStats(): Promise<DownloadStats> {
    const totalDownloads = await this.count()

    const downloadsByDocument = await this.queryMany(
      `SELECT d.id as document_id, d.title, COUNT(dd.id) as download_count
       FROM documents d
       LEFT JOIN document_downloads dd ON d.id = dd.document_id
       GROUP BY d.id, d.title
       ORDER BY download_count DESC
       LIMIT 10`
    )

    const downloadsByUser = await this.queryMany(
      `SELECT u.id as user_id, u.first_name || ' ' || u.last_name as user_name, COUNT(dd.id) as download_count
       FROM users u
       LEFT JOIN document_downloads dd ON u.id = dd.user_id
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY download_count DESC
       LIMIT 10`
    )

    const downloadsByDate = await this.queryMany(
      `SELECT DATE(downloaded_at) as date, COUNT(*) as count
       FROM document_downloads
       WHERE downloaded_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(downloaded_at)
       ORDER BY date DESC`
    )

    const topDocuments = downloadsByDocument.map(row => ({
      document_id: row.document_id,
      title: row.title,
      download_count: parseInt(row.download_count)
    }))

    return {
      totalDownloads,
      downloadsByDocument: {},
      downloadsByUser: {},
      downloadsByDate: {},
      topDocuments
    }
  }

  // 獲取用戶的下載記錄
  async getUserDownloads(userId: number): Promise<DocumentDownload[]> {
    return this.queryMany(
      `SELECT dd.*, d.title as document_title
       FROM document_downloads dd
       JOIN documents d ON dd.document_id = d.id
       WHERE dd.user_id = $1
       ORDER BY dd.downloaded_at DESC`,
      [userId]
    )
  }

  // 獲取文檔的下載記錄
  async getDocumentDownloads(documentId: number): Promise<DocumentDownload[]> {
    return this.queryMany(
      `SELECT dd.*, u.first_name || ' ' || u.last_name as user_name
       FROM document_downloads dd
       LEFT JOIN users u ON dd.user_id = u.id
       WHERE dd.document_id = $1
       ORDER BY dd.downloaded_at DESC`,
      [documentId]
    )
  }
}
