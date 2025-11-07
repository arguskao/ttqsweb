/**
 * 文檔下載路由
 */

import { neon } from '@neondatabase/serverless'

import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

export function setupDocumentDownloadRoutes(router: ApiRouter): void {
  // 文檔下載
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
      try {
        const DATABASE_URL =
          process.env.DATABASE_URL ||
          'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
        const sql = neon(DATABASE_URL)

        const result = await sql`
          SELECT id, title, file_url, file_type, file_size, download_count
          FROM documents
          WHERE id = ${id} AND is_public = true
        `

        if (result.length === 0) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '文件不存在或不可下載',
              statusCode: 404
            }
          }
        }

        const doc = result[0] as any

        // 增加下載次數
        await sql`
          UPDATE documents
          SET download_count = COALESCE(download_count, 0) + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `

        return {
          success: true,
          data: {
            id: doc.id,
            title: doc.title,
            file_url: doc.file_url,
            file_name: doc.title + '.pdf',
            file_type: doc.file_type || 'application/pdf',
            file_size: doc.file_size,
            download_count: (doc.download_count || 0) + 1
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '數據庫查詢失敗',
            statusCode: 500
          }
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
  })

  // 下載統計
  router.get('/api/v1/files/stats/downloads', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const DATABASE_URL =
        process.env.DATABASE_URL ||
        'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
      const sql = neon(DATABASE_URL)

      const stats = await sql`
        SELECT
          category,
          COUNT(*) as document_count,
          SUM(COALESCE(download_count, 0)) as total_downloads
        FROM documents
        WHERE is_public = true
        GROUP BY category
        ORDER BY total_downloads DESC
      `

      return {
        success: true,
        data: stats.map((row: any) => ({
          category: row.category,
          document_count: parseInt(row.document_count),
          total_downloads: parseInt(row.total_downloads || '0')
        }))
      }
    } catch (error) {
      console.error('Get download stats error:', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '獲取統計失敗',
          statusCode: 500
        }
      }
    }
  })
}
