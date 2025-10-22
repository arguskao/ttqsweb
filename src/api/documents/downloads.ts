/**
 * 文檔下載路由
 * 處理文檔下載、下載統計等操作
 */

import { requireAuth } from '../auth-middleware'
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { DocumentRepository, DocumentDownloadRepository } from './repositories'

// Repository實例
const documentRepo = new DocumentRepository()
const downloadRepo = new DocumentDownloadRepository()

export function setupDocumentDownloadRoutes(router: ApiRouter): void {
  // 下載文檔
  router.get('/api/v1/documents/:id/download', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const documentId = parseInt(req.params?.id || '0', 10)

      if (!documentId) {
        throw new ValidationError('無效的文檔ID')
      }

      const document = await documentRepo.findById(documentId)
      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      // 檢查文檔是否公開或用戶有權限
      if (!document.is_public && (!req.user || document.uploader_id !== req.user.id)) {
        throw new UnauthorizedError('沒有權限下載此文檔')
      }

      // 記錄下載
      const ipAddress = req.ip || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'
      await downloadRepo.recordDownload(documentId, req.user?.id || null, ipAddress, userAgent)

      // 增加下載次數
      await documentRepo.incrementDownloadCount(documentId)

      return {
        success: true,
        data: {
          downloadUrl: document.file_path,
          fileName: document.file_name,
          fileSize: document.file_size,
          fileType: document.file_type
        }
      }
    } catch (error) {
      console.error('Download document error:', error)
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
          message: error instanceof Error ? error.message : '下載文檔失敗',
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
  })

  // 獲取下載統計
  router.get(
    '/api/v1/files/stats/downloads',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const stats = await downloadRepo.getDownloadStats()

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
            message: '獲取下載統計失敗',
            statusCode: 500
          }
        }
      }
    }
  )

  // 獲取用戶的下載記錄
  router.get(
    '/api/v1/users/:userId/downloads',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const { userId } = req.params as Record<string, string>
        const targetUserId = parseInt(userId || '')

        if (isNaN(targetUserId)) {
          throw new ValidationError('無效的用戶ID')
        }

        // 只能查看自己的下載記錄，除非是管理員
        if (req.user!.id !== targetUserId && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只能查看自己的下載記錄')
        }

        const downloads = await downloadRepo.getUserDownloads(targetUserId)

        return {
          success: true,
          data: downloads
        }
      } catch (error) {
        console.error('Get user downloads error:', error)
        return {
          success: false,
          error: {
            code:
              error instanceof ValidationError
                ? 'VALIDATION_ERROR'
                : error instanceof UnauthorizedError
                  ? 'UNAUTHORIZED'
                  : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : '獲取用戶下載記錄失敗',
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

  // 獲取文檔的下載記錄
  router.get(
    '/api/v1/documents/:id/downloads',
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

        // 只有文檔上傳者或管理員可以查看下載記錄
        if (document.uploader_id !== req.user!.id && req.user!.userType !== 'admin') {
          throw new UnauthorizedError('只有文檔上傳者或管理員可以查看下載記錄')
        }

        const downloads = await downloadRepo.getDocumentDownloads(documentId)

        return {
          success: true,
          data: downloads
        }
      } catch (error) {
        console.error('Get document downloads error:', error)
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
            message: error instanceof Error ? error.message : '獲取文檔下載記錄失敗',
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

  // 批量下載文檔
  router.post(
    '/api/v1/documents/batch-download',
    requireAuth,
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const { documentIds } = req.body as { documentIds: number[] }

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
          throw new ValidationError('文檔ID列表不能為空')
        }

        if (documentIds.length > 10) {
          throw new ValidationError('一次最多只能下載10個文檔')
        }

        const documents = await Promise.all(
          documentIds.map(async (id: number) => {
            const document = await documentRepo.findById(id)
            if (!document) {
              throw new NotFoundError(`文檔ID ${id} 不存在`)
            }

            // 檢查權限
            if (
              !document.is_public &&
              document.uploader_id !== req.user!.id &&
              req.user!.userType !== 'admin'
            ) {
              throw new UnauthorizedError(`沒有權限下載文檔 ${document.title}`)
            }

            return document
          })
        )

        // 記錄批量下載
        const ipAddress = req.ip || 'unknown'
        const userAgent = req.headers['user-agent'] || 'unknown'

        await Promise.all(
          documents.map(doc =>
            downloadRepo.recordDownload(doc.id, req.user!.id, ipAddress, userAgent)
          )
        )

        // 增加下載次數
        await Promise.all(documents.map(doc => documentRepo.incrementDownloadCount(doc.id)))

        return {
          success: true,
          data: {
            documents: documents.map(doc => ({
              id: doc.id,
              title: doc.title,
              fileName: doc.file_name,
              downloadUrl: doc.file_path,
              fileSize: doc.file_size,
              fileType: doc.file_type
            })),
            totalSize: documents.reduce((sum, doc) => sum + doc.file_size, 0),
            count: documents.length
          }
        }
      } catch (error) {
        console.error('Batch download error:', error)
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
            message: error instanceof Error ? error.message : '批量下載失敗',
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

  // 獲取下載進度（用於大文件下載）
  router.get(
    '/api/v1/documents/:id/download-progress',
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

        // 檢查權限
        if (
          !document.is_public &&
          document.uploader_id !== req.user!.id &&
          req.user!.userType !== 'admin'
        ) {
          throw new UnauthorizedError('沒有權限下載此文檔')
        }

        // 這裡可以實現下載進度追蹤邏輯
        // 目前返回基本的下載信息
        return {
          success: true,
          data: {
            documentId: document.id,
            fileName: document.file_name,
            fileSize: document.file_size,
            downloadUrl: document.file_path,
            progress: 0, // 下載進度百分比
            status: 'ready', // ready, downloading, completed, failed
            estimatedTime: Math.ceil(document.file_size / (1024 * 1024)) // 估算下載時間（秒）
          }
        }
      } catch (error) {
        console.error('Get download progress error:', error)
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
            message: error instanceof Error ? error.message : '獲取下載進度失敗',
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
}

