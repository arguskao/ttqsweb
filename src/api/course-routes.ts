/**
 * 課程功能路由
 * 使用模組化結構重構
 */

import { setupCourseRoutes as setupCourseRoutesModule } from './course'
import type { ApiRouter } from './router'

// 設置所有課程相關路由
export function setupCourseRoutes(router: ApiRouter): void {
  setupCourseRoutesModule(router)
}
