/**
 * 講師功能統一入口
 * 整合講師管理、評分和申請功能
 */

import type { ApiRouter } from '../router'

import { setupInstructorApplicationRoutes } from './applications'
import { setupInstructorManagementRoutes } from './management'
import { setupInstructorRatingRoutes } from './ratings'

// Repository實例
export {
  InstructorRepository,
  InstructorRatingRepository,
  InstructorApplicationRepository
} from './repositories'

// 類型定義
export * from './types'

/**
 * 設置所有講師相關路由
 */
export function setupInstructorRoutes(router: ApiRouter): void {
  // 設置講師管理路由
  setupInstructorManagementRoutes(router)

  // 設置講師評分路由
  setupInstructorRatingRoutes(router)

  // 設置講師申請路由
  setupInstructorApplicationRoutes(router)
}
