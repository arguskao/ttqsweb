/**
 * 支援服務功能統一入口
 * 整合場地管理、預約、再培訓建議和講師發展功能
 */

import type { ApiRouter } from '../router'

import { setupVenueBookingRoutes } from './bookings'
import { setupInstructorDevelopmentRoutes } from './developments'
import { setupRetrainingRecommendationRoutes } from './recommendations'
import { setupVenueManagementRoutes } from './venues'

// Repository實例
export {
  PracticeVenueRepository,
  VenueBookingRepository,
  RetrainingRecommendationRepository,
  InstructorDevelopmentRepository
} from './repositories'

// 類型定義
export * from './types'

/**
 * 設置所有支援服務相關路由
 */
export function setupSupportRoutes(router: ApiRouter): void {
  // 設置場地管理路由
  setupVenueManagementRoutes(router)

  // 設置場地預約路由
  setupVenueBookingRoutes(router)

  // 設置再培訓建議路由
  setupRetrainingRecommendationRoutes(router)

  // 設置講師發展路由
  setupInstructorDevelopmentRoutes(router)
}

