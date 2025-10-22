/**
 * 課程功能路由
 * 使用模組化結構重構
 */

import { setupCourseRoutes } from './course'
import type { ApiRouter } from './router'

// 設置所有課程相關路由
export function setupCourseRoutesNeon(router: ApiRouter): void {
  setupCourseRoutes(router)
}
