/**
 * 社區功能路由
 * 使用模組化結構重構
 */

import { setupCommunityRoutes as setupCommunityRoutesModule } from './community'
import type { ApiRouter } from './router'

// 設置所有社區相關路由
export function setupCommunityRoutes(router: ApiRouter): void {
  setupCommunityRoutesModule(router)
}
