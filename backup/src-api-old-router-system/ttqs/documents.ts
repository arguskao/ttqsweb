/**
 * TTQS文檔管理路由
 * 處理TTQS文檔的上傳、下載、管理等操作
 */

import { ValidationError, NotFoundError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { TTQSDocumentRepository } from './repositories'
import type { UploadDocumentRequest, DocumentSearchParams } from './types'

// Repository實例
const documentRepo = new TTQSDocumentRepository()

export function setupTTQSDocumentRoutes(router: ApiRouter): void {
  // 上傳TTQS文檔
  router.post(
    '/ttqs/documents',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const { plan_id, document_type, title, file_url, file_size, version }: UploadDocumentRequest =
        req.body as UploadDocumentRequest

      if (!plan_id || !document_type || !title || !file_url) {
        throw new ValidationError('計劃ID、文件類型、標題和文件URL為必填項')
      }

      const documentData = {
        plan_id,
        document_type,
        title,
        file_url,
        file_size: file_size || null,
        version: version || null,
        uploaded_by: req.user!.id
      }

      const document = await documentRepo.create(documentData)

      return {
        success: true,
        data: document
      }
    })
  )

  // 獲取TTQS文檔列表
  router.get(
    '/ttqs/documents',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { plan_id, document_type, uploaded_by, date_from, date_to } = query

      const searchParams: DocumentSearchParams = {}
      if (plan_id) searchParams.plan_id = parseInt(plan_id as string)
      if (document_type) searchParams.document_type = document_type as string
      if (uploaded_by) searchParams.uploaded_by = parseInt(uploaded_by as string)
      if (date_from) searchParams.date_from = date_from as string
      if (date_to) searchParams.date_to = date_to as string

      const documents = await documentRepo.searchDocuments(searchParams)

      return {
        success: true,
        data: documents
      }
    })
  )

  // 獲取TTQS文檔詳情
  router.get(
    '/ttqs/documents/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const documentId = parseInt(id!)

      if (isNaN(documentId)) {
        throw new ValidationError('無效的文檔ID')
      }

      const document = await documentRepo.findById(documentId)
      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      return {
        success: true,
        data: document
      }
    })
  )

  // 更新TTQS文檔
  router.put(
    '/ttqs/documents/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const documentId = parseInt(id!)
      const { title, file_url, file_size, version } = req.body as UploadDocumentRequest

      if (isNaN(documentId)) {
        throw new ValidationError('無效的文檔ID')
      }

      const document = await documentRepo.findById(documentId)
      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && document.uploaded_by !== req.user!.id) {
        throw new ValidationError('無權限更新此文檔')
      }

      const updateData = {
        title: title || document.title,
        file_url: file_url || document.file_url,
        file_size: file_size || document.file_size,
        version: version || document.version,
        updated_at: new Date()
      }

      const updatedDocument = await documentRepo.update(documentId, updateData)

      return {
        success: true,
        data: updatedDocument
      }
    })
  )

  // 刪除TTQS文檔
  router.delete(
    '/ttqs/documents/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const documentId = parseInt(id!)

      if (isNaN(documentId)) {
        throw new ValidationError('無效的文檔ID')
      }

      const document = await documentRepo.findById(documentId)
      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      // 檢查權限
      if (req.user!.userType !== 'admin' && document.uploaded_by !== req.user!.id) {
        throw new ValidationError('無權限刪除此文檔')
      }

      await documentRepo.delete(documentId)

      return {
        success: true,
        data: { message: '文檔刪除成功' }
      }
    })
  )

  // 下載TTQS文檔
  router.get(
    '/ttqs/documents/:id/download',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const documentId = parseInt(id!)

      if (isNaN(documentId)) {
        throw new ValidationError('無效的文檔ID')
      }

      const document = await documentRepo.findById(documentId)
      if (!document) {
        throw new NotFoundError('文檔不存在')
      }

      // 記錄下載次數
      await documentRepo.incrementDownloadCount(documentId)

      return {
        success: true,
        data: {
          file_url: document.file_url,
          title: document.title,
          file_size: document.file_size
        }
      }
    })
  )

  // 獲取文檔統計
  router.get(
    '/ttqs/documents/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await documentRepo.getDocumentStats()

      return {
        success: true,
        data: stats
      }
    })
  )
}
