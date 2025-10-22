/**
 * TTQS分析功能統一入口
 * 整合文檔管理、分析儀表板、報告生成和合規檢查功能
 */

import type { ApiRouter } from '../router'

import { setupTTQSAnalyticsRoutes as setupAnalyticsRoutes } from './analytics'
import { setupTTQSDocumentRoutes } from './documents'
import { setupTTQSReportRoutes } from './reports'

// Repository實例
export { TTQSDocumentRepository, TTQSPlanRepository, TTQSAnalyticsRepository } from './repositories'

// 類型定義
export * from './types'

/**
 * 設置所有TTQS分析相關路由
 */
export function setupTTQSAnalyticsRoutes(router: ApiRouter): void {
  // 設置文檔管理路由
  setupTTQSDocumentRoutes(router)

  // 設置分析儀表板路由
  setupAnalyticsRoutes(router)

  // 設置報告生成路由
  setupTTQSReportRoutes(router)
}
