import { authMiddleware } from './auth-middleware'
import { BaseRepository } from './database'
import { ValidationError, NotFoundError, AuthorizationError } from './errors'
import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'

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

// Document repository
class DocumentRepository extends BaseRepository<Document> {
  constructor() {
    super('documents')
  }

  // Find documents by category
  async findByCategory(category: string): Promise<Document[]> {
    try {
      return await this.findAll({ category, is_public: true })
    } catch (error) {
      throw error
    }
  }

  // Search documents by title or description
  async search(searchTerm: string): Promise<Document[]> {
    const { db } = await import('../utils/database')
    try {
      return await db.queryMany({
        text: `
          SELECT * FROM documents
          WHERE is_public = true
          AND (title ILIKE $1 OR description ILIKE $1)
          ORDER BY created_at DESC
        `,
        values: [`%${searchTerm}%`]
      })
    } catch (error) {
      throw error
    }
  }

  // Increment download count
  async incrementDownloadCount(id: number): Promise<void> {
    const { db } = await import('../utils/database')
    try {
      await db.query({
        text: `
          UPDATE documents
          SET download_count = download_count + 1
          WHERE id = $1
        `,
        values: [id]
      })
    } catch (error) {
      throw error
    }
  }

  // Get documents with pagination and filters
  async findWithFilters(options: {
        page?: number
        limit?: number
        category?: string
        searchTerm?: string
        isPublic?: boolean
    }): Promise<{ data: Document[]; meta: any }> {
    const { db } = await import('../utils/database')
    const {
      page = 1,
      limit = 10,
      category,
      searchTerm,
      isPublic = true
    } = options

    const offset = (page - 1) * limit
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build WHERE clause
    if (isPublic !== undefined) {
      conditions.push(`is_public = $${paramIndex}`)
      values.push(isPublic)
      paramIndex++
    }

    if (category) {
      conditions.push(`category = $${paramIndex}`)
      values.push(category)
      paramIndex++
    }

    if (searchTerm) {
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      values.push(`%${searchTerm}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    try {
      // Get total count
      const countResult = await db.queryOne({
        text: `SELECT COUNT(*) as count FROM documents ${whereClause}`,
        values
      })
      const total = parseInt(countResult?.count || '0', 10)

      // Get paginated data
      const data = await db.queryMany({
        text: `
          SELECT * FROM documents
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        values: [...values, limit, offset]
      })

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw error
    }
  }

  // Get all categories
  async getCategories(): Promise<string[]> {
    const { db } = await import('../utils/database')
    try {
      const results = await db.queryMany({
        text: `
          SELECT DISTINCT category
          FROM documents
          WHERE category IS NOT NULL AND is_public = true
          ORDER BY category
        `
      })
      return results.map(r => r.category)
    } catch (error) {
      throw error
    }
  }

  // Get download statistics
  async getDownloadStats(): Promise<any> {
    const { db } = await import('../utils/database')
    try {
      return await db.queryMany({
        text: `
          SELECT
            category,
            COUNT(*) as document_count,
            SUM(download_count) as total_downloads
          FROM documents
          WHERE is_public = true
          GROUP BY category
          ORDER BY total_downloads DESC
        `
      })
    } catch (error) {
      throw error
    }
  }
}

const documentRepo = new DocumentRepository()

// Setup document routes
export function setupDocumentRoutes(router: ApiRouter): void {
  // Get all documents with filters and pagination
  router.get('/api/v1/documents', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const {
        page = '1',
        limit = '10',
        category,
        search
      } = req.query || {}

      const result = await documentRepo.findWithFilters({
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        category: category as string,
        searchTerm: search as string,
        isPublic: true
      })

      return {
        success: true,
        data: {
          documents: result.data
        },
        meta: result.meta
      }
    } catch (error) {
      throw error
    }
  })

  // Get document by ID
  router.get('/api/v1/documents/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const id = parseInt(req.params?.id || '0', 10)

      if (!id) {
        throw new ValidationError('無效的文件 ID')
      }

      const document = await documentRepo.findById(id)

      if (!document) {
        throw new NotFoundError('文件不存在')
      }

      if (!document.is_public && (!req.user || req.user.id !== document.uploaded_by)) {
        throw new AuthorizationError('無權限訪問此文件')
      }

      return {
        success: true,
        data: document
      }
    } catch (error) {
      throw error
    }
  })

  // Download document (increment counter)
  router.get('/api/v1/documents/:id/download', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const id = parseInt(req.params?.id || '0', 10)

      if (!id) {
        throw new ValidationError('無效的文件 ID')
      }

      const document = await documentRepo.findById(id)

      if (!document) {
        throw new NotFoundError('文件不存在')
      }

      if (!document.is_public && (!req.user || req.user.id !== document.uploaded_by)) {
        throw new AuthorizationError('無權限下載此文件')
      }

      // Increment download count
      await documentRepo.incrementDownloadCount(id)

      return {
        success: true,
        data: {
          file_url: document.file_url,
          file_name: document.title,
          file_type: document.file_type
        }
      }
    } catch (error) {
      throw error
    }
  })

  // Get all categories
  router.get('/api/v1/files/categories/list', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const categories = await documentRepo.getCategories()

      return {
        success: true,
        data: categories
      }
    } catch (error) {
      throw error
    }
  })

  // Get download statistics
  router.get('/api/v1/files/stats/downloads', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const stats = await documentRepo.getDownloadStats()

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      throw error
    }
  })

  // Upload document (requires authentication)
  router.post('/api/v1/documents', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      if (!req.user) {
        throw new AuthorizationError('需要登入才能上傳文件')
      }

      const {
        title,
        description,
        file_url,
        file_type,
        file_size,
        category,
        is_public = true
      } = req.body as any

      // Validate required fields
      if (!title || !file_url) {
        throw new ValidationError('標題和文件 URL 為必填項')
      }

      const document = await documentRepo.create({
        title,
        description: description || null,
        file_url,
        file_type: file_type || null,
        file_size: file_size || null,
        category: category || null,
        is_public,
        uploaded_by: req.user.id,
        download_count: 0
      } as any)

      return {
        success: true,
        data: document
      }
    } catch (error) {
      throw error
    }
  }, [authMiddleware])

  // Update document (requires authentication and ownership)
  router.put('/api/v1/files/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      if (!req.user) {
        throw new AuthorizationError('需要登入才能更新文件')
      }

      const id = parseInt(req.params?.id || '0', 10)

      if (!id) {
        throw new ValidationError('無效的文件 ID')
      }

      const document = await documentRepo.findById(id)

      if (!document) {
        throw new NotFoundError('文件不存在')
      }

      if (document.uploaded_by !== req.user.id) {
        throw new AuthorizationError('無權限更新此文件')
      }

      const {
        title,
        description,
        category,
        is_public
      } = req.body as any

      const updatedDocument = await documentRepo.update(id, {
        title,
        description,
        category,
        is_public
      })

      return {
        success: true,
        data: updatedDocument
      }
    } catch (error) {
      throw error
    }
  }, [authMiddleware])

  // Delete document (requires authentication and ownership)
  router.delete('/api/v1/files/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      if (!req.user) {
        throw new AuthorizationError('需要登入才能刪除文件')
      }

      const id = parseInt(req.params?.id || '0', 10)

      if (!id) {
        throw new ValidationError('無效的文件 ID')
      }

      const document = await documentRepo.findById(id)

      if (!document) {
        throw new NotFoundError('文件不存在')
      }

      if (document.uploaded_by !== req.user.id) {
        throw new AuthorizationError('無權限刪除此文件')
      }

      await documentRepo.delete(id)

      return {
        success: true,
        data: { message: '文件已刪除' }
      }
    } catch (error) {
      throw error
    }
  }, [authMiddleware])
}
