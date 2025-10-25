/**
 * 課程功能統一入口
 * 整合課程管理、註冊和進度追蹤功能
 */

import type { ApiRouter } from '../router'

import { setupCourseApplicationRoutes } from './applications'
import { setupCourseEnrollmentRoutes } from './enrollments'
import { setupCourseManagementRoutes } from './management'

// Repository實例
export { CourseRepository, CourseEnrollmentRepository } from './repositories'

// 類型定義
export * from './types'

/**
 * 設置所有課程相關路由
 */
export function setupCourseRoutes(router: ApiRouter): void {
  // 設置課程管理路由
  setupCourseManagementRoutes(router)

  // 設置課程註冊路由
  setupCourseEnrollmentRoutes(router)

  // 設置課程申請路由
  setupCourseApplicationRoutes(router)
}

