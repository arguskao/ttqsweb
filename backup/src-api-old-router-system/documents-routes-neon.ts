/**
 * 文檔功能路由
 * 使用模組化結構重構
 */

import { setupDocumentRoutes } from './documents'
import type { ApiRouter } from './router'

// 設置所有文檔相關路由
export function setupDocumentRoutesNeon(router: ApiRouter): void {
  setupDocumentRoutes(router)
}
