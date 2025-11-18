/**
 * 講師功能路由
 * 使用模組化結構重構
 */

import { setupInstructorRoutes as setupInstructorRoutesImpl } from './instructor'
import type { ApiRouter } from './router'

// 設置所有講師相關路由
export function setupInstructorRoutes(router: ApiRouter): void {
  setupInstructorRoutesImpl(router)
}
