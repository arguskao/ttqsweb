/**
 * 社區功能統一入口
 * 整合群組管理、論壇功能和經驗分享
 */

import type { ApiRouter } from '../router'

import { setupExperienceRoutes } from './experiences'
import { setupForumRoutes } from './forums'
import { setupGroupRoutes } from './groups'

// Repository實例
export {
  StudentGroupRepository,
  GroupMemberRepository,
  ForumTopicRepository,
  ForumReplyRepository,
  ExperienceShareRepository,
  ExperienceCommentRepository
} from './repositories'

// 類型定義
export * from './types'

/**
 * 設置所有社區相關路由
 */
export function setupCommunityRoutes(router: ApiRouter): void {
  // 設置群組管理路由
  setupGroupRoutes(router)

  // 設置論壇功能路由
  setupForumRoutes(router)

  // 設置經驗分享路由
  setupExperienceRoutes(router)
}

