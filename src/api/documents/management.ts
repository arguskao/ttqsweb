/**
 * 文檔管理路由
 * 處理文檔的創建、更新、刪除等操作
 */

import { validateIntParam } from '../../utils/param-validation'
import { requireAuth } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { DocumentRepository } from './repositories'
import type { CreateDocumentRequest, UpdateDocumentRequest, DocumentSearchParams } from './types'

// Repository實例
const documentRepo = new DocumentRepository()

export function setupDocumentManagementRoutes(router: ApiRouter): void {
  // 獲取所有文檔（帶篩選和分頁）
  router.get('/api/v1/documents', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const {
        page = '1',
        limit = '12',
        category,
        search
      } = req.query ?? {}

      const pageNum = parseInt(page as string, 10)
      const limitNum = parseInt(limit as string, 10)

      // 簡化查詢，直接從數據庫獲取
      let whereConditions = ['is_public = true']
      let params: any[] = []
      let paramIndex = 1

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
      const countResult = await documentRepo.queryOne(
        `SELECT COUNT(*) as total FROM documents WHERE ${whereClause}`,
        params
      )
      const total = parseInt(countResult?.total || '0')

      // 獲取分頁數據
      const offset = (pageNum - 1) * limitNum
      const documents = await documentRepo.queryMany(
        `SELECT * FROM documents WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limitNum, offset]
      )

      const meta = {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }

      return {
        success: true,
        data: documents,
        meta
      }
    } catch (error) {
      console.error('Get documents error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '載入文檔失敗',
          statusCode: 500
        }
      }
    }
  })

  // 根據ID獲取文檔
  router.get('/api/v1/documents/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const documentId = validateIntParam(req.params?.id, 'id')

      const document = await documentRepo.findByIdWithUploader(documentId)
      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      return {
        success: true,
        data: document
      }
    } catch (error) {
      console.error('Get document error:', error)
      return {
        success: false,
        error: {
          code:
            error instanceof ValidationError
              ? 'VALIDATION_ERROR'
              : error instanceof NotFoundError
                ? 'NOT_FOUND'
                : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '獲取文檔失敗',
          statusCode:
            error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500
        }
      }
    }
  })

  // 創建文檔
  router.post('/api/v1/documents', requireAuth, async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const {
        title,
        description,
        file_name,
        file_path,
        file_size,
        file_type,
        category,
        is_public
      }: CreateDocumentRequest = req.body as CreateDocumentRequest

      if (!title || !file_name || !file_type || !category) {
        throw new ValidationError('標題、文件名、文件類型和分類都是必填項')
      }

      const documentData = {
        title,
        description: description || null,
        file_name,
        file_path,
        file_size: file_size ?? 0,
        file_type,
        category,
        is_public: is_public !== false,
        uploader_id: req.user!.id,
        download_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }

      // 驗證文檔
      const validation = await documentRepo.validateDocument(documentData)
      if (!validation.isValid) {
        throw new ValidationError(`文檔驗證失敗: ${validation.errors.join(', ')}`)
      }

      const document = await documentRepo.create(documentData)

      return {
        success: true,
        data: document
      }
    } catch (error) {
      console.error('Create document error:', error)
      return {
        success: false,
        error: {
          code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '創建文檔失敗',
          statusCode: error instanceof ValidationError ? 400 : 500
        }
      }
    }
  })

  // 更新文檔
  router.put(
    '/api/v1/documents/:id',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const documentId = parseInt(req.params?.id || '0', 10)
        const { title, description, category, is_public }: UpdateDocumentRequest =
          req.body as UpdateDocumentRequest

        if (!documentId) {
          throw new ValidationError('無效的文檔ID')
        }

        const document = await documentRepo.findById(documentId)
        if (!document) {
          throw new NotFoundError('文檔不存在')
        }

        // 只有上傳者或管理員可以更新
        if (document.uploader_id !== req.user!.id && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只有文檔上傳者或管理員可以更新文檔')
        }

        const updateData: Record<string, any> = {}
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (category !== undefined) updateData.category = category
        if (is_public !== undefined) updateData.is_public = is_public

        const updatedDocument = await documentRepo.updateDocument(documentId, updateData)

        return {
          success: true,
          data: updatedDocument
        }
      } catch (error) {
        console.error('Update document error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : error instanceof UnauthorizedError
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '更新文檔失敗',
            statusCode:
              error instanceof ValidationError
                ? 400
                : error instanceof NotFoundError
                  ? 404
                  : error instanceof UnauthorizedError
                    ? 403
                    : 500
          }
        }
      }
    }
  )

  // 刪除文檔
  router.delete(
    '/api/v1/documents/:id',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const documentId = parseInt(req.params?.id || '0', 10)

        if (!documentId) {
          throw new ValidationError('無效的文檔ID')
        }

        const document = await documentRepo.findById(documentId)
        if (!document) {
          throw new NotFoundError('文檔不存在')
        }

        // 只有上傳者或管理員可以刪除
        if (document.uploader_id !== req.user!.id && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只有文檔上傳者或管理員可以刪除文檔')
        }

        await documentRepo.delete(documentId)

        return {
          success: true,
          data: { message: '文檔刪除成功' }
        }
      } catch (error) {
        console.error('Delete document error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof NotFoundError
                  ? 'NOT_FOUND'
                  : error instanceof UnauthorizedError
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '刪除文檔失敗',
            statusCode:
              error instanceof ValidationError
                ? 400
                : error instanceof NotFoundError
                  ? 404
                  : error instanceof UnauthorizedError
                    ? 403
                    : 500
          }
        }
      }
    }
  )

  // 根據分類獲取文檔
  router.get(
    '/api/v1/documents/category/:category',
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const { category } = req.params as Record<string, string>

        if (!category) {
          throw new ValidationError('分類參數不能為空')
        }

        const documents = await documentRepo.findByCategory(category)

        return {
          success: true,
          data: documents
        }
      } catch (error) {
        console.error('Get documents by category error:', error)
        return {
          success: false,
          error: {
            code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取分類文檔失敗',
            statusCode: error instanceof ValidationError ? 400 : 500
          }
        }
      }
    }
  )

  // 獲取用戶的文檔
  router.get(
    '/api/v1/users/:userId/documents',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const { userId } = req.params as Record<string, string>
        const targetUserId = parseInt(userId || '')

        if (isNaN(targetUserId)) {
          throw new ValidationError('無效的用戶ID')
        }

        // 只能查看自己的文檔，除非是管理員
        if (req.user!.id !== targetUserId && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只能查看自己的文檔')
        }

        const documents = await documentRepo.findByUploader(targetUserId)

        return {
          success: true,
          data: documents
        }
      } catch (error) {
        console.error('Get user documents error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof UnauthorizedError
                  ? 'UNAUTHORIZED'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取用戶文檔失敗',
            statusCode:
              error instanceof ValidationError
                ? 400
                : error instanceof UnauthorizedError
                  ? 403
                  : 500
          }
        }
      }
    }
  )

  // 獲取文檔統計
  router.get(
    '/api/v1/documents/stats',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const stats = await documentRepo.getStats()

        return {
          success: true,
          data: stats
        }
      } catch (error) {
        console.error('Get document stats error:', error)
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '獲取文檔統計失敗',
            statusCode: 500
          }
        }
      }
    }
  )

  // 獲取文檔分類列表（從 file_categories 表）
  router.get('/api/v1/files/categories/list', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      // 從 file_categories 表獲取啟用的分類
      const categories = await documentRepo.queryMany(
        `SELECT category_key, category_name, description, display_order
         FROM file_categories 
         WHERE is_active = true 
         ORDER BY display_order, category_name`
      )

      // 返回分類鍵值列表（用於篩選）
      const categoryKeys = categories.map(row => row.category_key)

      return {
        success: true,
        data: categoryKeys
      }
    } catch (error) {
      console.error('Get categories error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '獲取分類列表失敗',
          statusCode: 500
        }
      }
    }
  })

  // 獲取文檔分類詳細資訊（包含中文名稱）
  router.get('/api/v1/files/categories/details', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const categories = await documentRepo.queryMany(
        `SELECT category_key, category_name, description, display_order
         FROM file_categories 
         WHERE is_active = true 
         ORDER BY display_order, category_name`
      )

      return {
        success: true,
        data: categories.map(row => ({
          key: row.category_key,
          name: row.category_name,
          description: row.description,
          order: row.display_order
        }))
      }
    } catch (error) {
      console.error('Get category details error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '獲取分類詳細資訊失敗',
          statusCode: 500
        }
      }
    }
  })
}

