/**
 * 文檔功能統一入口
 * 整合文檔管理、下載和統計功能
 */

import type { ApiRouter } from '../router'

import { setupDocumentDownloadRoutes } from './downloads'
import { setupDocumentManagementRoutes } from './management'

// Repository實例
export { DocumentRepository, DocumentDownloadRepository } from './repositories'

// 類型定義
export * from './types'

/**
 * 設置所有文檔相關路由
 */
export function setupDocumentRoutes(router: ApiRouter): void {
  // 設置文檔管理路由
  setupDocumentManagementRoutes(router)

  // 設置文檔下載路由
  setupDocumentDownloadRoutes(router)
}
