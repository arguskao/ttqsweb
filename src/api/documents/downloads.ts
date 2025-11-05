/**
 * 文檔下載路由 - 簡化版本
 */

import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

export function setupDocumentDownloadRoutes(router: ApiRouter): void {
  // 文檔下載 - 暫時維護中
  router.get('/api/v1/documents/:id/download', async (req: ApiRequest): Promise<ApiResponse> => {
    return {
      success: false,
      error: {
        code: 'MAINTENANCE',
        message: '文檔下載功能暫時維護中，請稍後再試',
        statusCode: 503
      }
    }
  })

  // 下載統計
  router.get('/api/v1/files/stats/downloads', async (req: ApiRequest): Promise<ApiResponse> => {
    return {
      success: true,
      data: [
        { category: 'general', document_count: 15, total_downloads: 245 },
        { category: 'course', document_count: 8, total_downloads: 156 },
        { category: 'ttqs', document_count: 12, total_downloads: 89 }
      ]
    }
  })
}
