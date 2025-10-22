/**
 * 工作功能路由
 * 使用模組化結構重構
 */

import { setupJobRoutes } from './jobs'
import type { ApiRouter } from './router'

// 設置所有工作相關路由
export function setupJobRoutesNeon(router: ApiRouter): void {
  setupJobRoutes(router)
}
