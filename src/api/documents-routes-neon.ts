// 重構的文檔路由 - 使用 Neon 數據庫
import { documentServiceNeon } from './documents-service-neon'
import { ValidationError, NotFoundError, AuthorizationError } from './errors'
import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'

// 設置文檔路由
export function setupDocumentRoutesNeon(router: ApiRouter): void {
  // 獲取所有文檔（帶篩選和分頁）
  router.get('/api/v1/documents', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const { page, limit, category, search } = req.query || {}

      const options = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12,
        category: category as string,
        search: search as string,
        isPublic: true
      }

      const result = await documentServiceNeon.getDocuments(options)

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

  // 根據 ID 獲取文檔
  router.get('/api/v1/documents/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const documentId = parseInt(req.params?.id || '0', 10)

      if (!documentId) {
        throw new ValidationError('無效的文檔 ID')
      }

      const document = await documentServiceNeon.getDocumentById(documentId)

      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      if (!document.is_public && (!req.user || req.user.id !== document.uploaded_by)) {
        throw new AuthorizationError('無權限訪問此文檔')
      }

      return {
        success: true,
        data: document
      }
    } catch (error) {
      console.error('Get document by ID error:', error)
      
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
        return {
          success: false,
          error: {
            code: error.constructor.name.replace('Error', '').toUpperCase(),
            message: error.message,
            statusCode: error instanceof NotFoundError ? 404 : (error instanceof AuthorizationError ? 403 : 400)
          }
        }
      }

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

  // 下載文檔（增加下載計數）
  router.get('/api/v1/documents/:id/download', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const documentId = parseInt(req.params?.id || '0', 10)

      if (!documentId) {
        throw new ValidationError('無效的文檔 ID')
      }

      const document = await documentServiceNeon.getDocumentById(documentId)

      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      if (!document.is_public && (!req.user || req.user.id !== document.uploaded_by)) {
        throw new AuthorizationError('無權限下載此文檔')
      }

      // 增加下載次數
      await documentServiceNeon.incrementDownloadCount(documentId)

      return {
        success: true,
        data: {
          file_url: document.file_url,
          file_name: document.title,
          file_type: document.file_type
        }
      }
    } catch (error) {
      console.error('Document download error:', error)
      
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
        return {
          success: false,
          error: {
            code: error.constructor.name.replace('Error', '').toUpperCase(),
            message: error.message,
            statusCode: error instanceof NotFoundError ? 404 : (error instanceof AuthorizationError ? 403 : 400)
          }
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '下載文檔失敗',
          statusCode: 500
        }
      }
    }
  })

  // 獲取所有分類
  router.get('/api/v1/files/categories/list', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const categories = await documentServiceNeon.getCategories()

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
          message: '載入分類失敗',
          statusCode: 500
        }
      }
    }
  })

  // 獲取下載統計
  router.get('/api/v1/files/stats/downloads', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const stats = await documentServiceNeon.getDownloadStats()

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Get download stats error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '載入統計資料失敗',
          statusCode: 500
        }
      }
    }
  })
}