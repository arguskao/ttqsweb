/**
 * 支援服務功能路由
 * 使用模組化結構重構
 */

import type { ApiRouter } from './router'
import { setupSupportRoutes as setupSupportRoutesImpl } from './support'

// 設置所有支援服務相關路由
export function setupSupportRoutes(router: ApiRouter): void {
  setupSupportRoutesImpl(router)
}
