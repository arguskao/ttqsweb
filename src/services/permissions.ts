/**
 * 權限管理系統
 * 定義四層用戶角色的權限控制
 */

import type { UserType } from './auth'

// 權限類型定義
export type Permission =
  // 系統管理權限
  | 'system:admin'
  | 'users:manage'
  | 'roles:assign'

  // TTQS 管理權限
  | 'ttqs:manage'
  | 'ttqs:view'
  | 'ttqs:documents:upload'
  | 'ttqs:documents:download'
  | 'ttqs:analytics:view'

  // 課程管理權限
  | 'courses:create'
  | 'courses:manage'
  | 'courses:view'
  | 'courses:enroll'

  // 工作管理權限
  | 'jobs:create'
  | 'jobs:manage'
  | 'jobs:view'
  | 'jobs:apply'

  // 用戶資料權限
  | 'profile:view'
  | 'profile:edit'
  | 'profile:view_others'

  // 數據分析權限
  | 'analytics:view'
  | 'analytics:export'

// 角色權限映射
const ROLE_PERMISSIONS: Record<UserType, Permission[]> = {
  admin: [
    // 系統管理
    'system:admin',
    'users:manage',
    'roles:assign',

    // TTQS 完整權限
    'ttqs:manage',
    'ttqs:view',
    'ttqs:documents:upload',
    'ttqs:documents:download',
    'ttqs:analytics:view',

    // 課程完整權限
    'courses:create',
    'courses:manage',
    'courses:view',
    'courses:enroll',

    // 工作完整權限
    'jobs:create',
    'jobs:manage',
    'jobs:view',
    'jobs:apply',

    // 用戶資料完整權限
    'profile:view',
    'profile:edit',
    'profile:view_others',

    // 數據分析完整權限
    'analytics:view',
    'analytics:export'
  ],

  instructor: [
    // TTQS 相關權限
    'ttqs:view',
    'ttqs:documents:upload',
    'ttqs:documents:download',

    // 課程管理權限
    'courses:create',
    'courses:manage',
    'courses:view',
    'courses:enroll',

    // 基本權限
    'jobs:view',
    'profile:view',
    'profile:edit',

    // 部分分析權限
    'analytics:view'
  ],

  employer: [
    // 工作管理權限
    'jobs:create',
    'jobs:manage',
    'jobs:view',

    // 課程查看權限
    'courses:view',

    // TTQS 查看權限
    'ttqs:view',
    'ttqs:documents:download',

    // 基本權限
    'profile:view',
    'profile:edit',

    // 部分分析權限
    'analytics:view'
  ],

  job_seeker: [
    // 基本學習權限
    'courses:view',
    'courses:enroll',

    // 工作申請權限
    'jobs:view',
    'jobs:apply',

    // TTQS 查看權限
    'ttqs:view',
    'ttqs:documents:download',

    // 基本權限
    'profile:view',
    'profile:edit'
  ]
}

// 檢查用戶是否有特定權限
export function hasPermission(userType: UserType, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[userType]
  return userPermissions.includes(permission)
}

// 檢查用戶是否有任一權限
export function hasAnyPermission(userType: UserType, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userType, permission))
}

// 檢查用戶是否有所有權限
export function hasAllPermissions(userType: UserType, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userType, permission))
}

// 獲取用戶所有權限
export function getUserPermissions(userType: UserType): Permission[] {
  return ROLE_PERMISSIONS[userType] || []
}

// 權限檢查中間件
export function requirePermission(permission: Permission) {
  return (userType: UserType) => {
    if (!hasPermission(userType, permission)) {
      throw new Error(`權限不足：需要 ${permission} 權限`)
    }
  }
}

// 角色層級定義（數字越大權限越高）
const ROLE_HIERARCHY: Record<UserType, number> = {
  job_seeker: 1,
  employer: 2,
  instructor: 3,
  admin: 4
}

// 檢查角色層級
export function hasHigherRole(userType: UserType, targetRole: UserType): boolean {
  return ROLE_HIERARCHY[userType] > ROLE_HIERARCHY[targetRole]
}

// 檢查是否為管理員
export function isAdmin(userType: UserType): boolean {
  return userType === 'admin'
}

// 檢查是否為講師或更高權限
export function isInstructorOrHigher(userType: UserType): boolean {
  return ROLE_HIERARCHY[userType] >= ROLE_HIERARCHY.instructor
}

// 檢查是否為雇主或更高權限
export function isEmployerOrHigher(userType: UserType): boolean {
  return ROLE_HIERARCHY[userType] >= ROLE_HIERARCHY.employer
}
