/**
 * TTQS分析功能路由
 * 使用模組化結構重構
 */

import type { ApiRouter } from './router'
import { setupTTQSAnalyticsRoutes as setupTTQSAnalyticsRoutesModule } from './ttqs'

// 設置所有TTQS分析相關路由
export function setupTTQSAnalyticsRoutes(router: ApiRouter): void {
  setupTTQSAnalyticsRoutesModule(router)
}
