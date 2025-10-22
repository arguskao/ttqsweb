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
        page,
        limit,
        category,
        search,
        is_public,
        uploader_id,
        file_type,
        date_from,
        date_to
      } = req.query ?? {}

      const searchParams: DocumentSearchParams = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12,
        category: category as string,
        search: search as string,
        isPublic: is_public ? is_public === 'true' : undefined,
        uploader_id: uploader_id ? parseInt(uploader_id as string) : undefined,
        file_type: file_type as string,
        date_from: date_from as string,
        date_to: date_to as string
      }

      const result = await documentRepo.searchDocuments(searchParams)

      return {
        success: true,
        data: {
          documents: result.data
        },
        meta: result.meta
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

  // 獲取文檔分類列表
  router.get('/api/v1/files/categories/list', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const categories = await documentRepo.getCategories()

      return {
        success: true,
        data: categories
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
}

