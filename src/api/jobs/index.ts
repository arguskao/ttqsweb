/**
 * 工作功能統一入口
 * 整合工作管理、申請和統計功能
 */

import type { ApiRouter } from '../router'

import { setupJobApplicationRoutes } from './applications'
import { setupJobManagementRoutes } from './management'

// Repository實例
export {
  JobRepository,
  JobApplicationRepository,
  JobViewRepository,
  JobFavoriteRepository
} from './repositories'

// 類型定義
export * from './types'

/**
 * 設置所有工作相關路由
 */
export function setupJobRoutes(router: ApiRouter): void {
  // 設置工作管理路由
  setupJobManagementRoutes(router)

  // 設置工作申請路由
  setupJobApplicationRoutes(router)
}
