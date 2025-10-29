/**
 * 權限檢查 Composable
 * 在 Vue 組件中使用的權限檢查工具
 */

import { computed } from 'vue'

import type { UserType } from '../services/auth'
import {
  hasPermission,
  isAdmin,
  isInstructorOrHigher,
  isEmployerOrHigher
} from '../services/permissions'
import type { Permission } from '../services/permissions'
import { useAuthStore } from '../stores/auth'

export function usePermissions() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)
  const userType = computed(() => user.value?.userType as UserType)

  // 檢查特定權限
  const checkPermission = (permission: Permission): boolean => {
    if (!userType.value) return false
    return hasPermission(userType.value, permission)
  }

  // 角色檢查
  const permissions = computed(() => ({
    // 基本角色檢查
    isAdmin: userType.value ? isAdmin(userType.value) : false,
    isInstructor: userType.value === 'instructor',
    isEmployer: userType.value === 'employer',
    isJobSeeker: userType.value === 'job_seeker',

    // 層級權限檢查
    isInstructorOrHigher: userType.value ? isInstructorOrHigher(userType.value) : false,
    isEmployerOrHigher: userType.value ? isEmployerOrHigher(userType.value) : false,

    // 系統管理權限
    canManageUsers: checkPermission('users:manage'),
    canAssignRoles: checkPermission('roles:assign'),
    canViewAnalytics: checkPermission('analytics:view'),
    canExportData: checkPermission('analytics:export'),

    // TTQS 權限
    canManageTTQS: checkPermission('ttqs:manage'),
    canViewTTQS: checkPermission('ttqs:view'),
    canUploadTTQSDocuments: checkPermission('ttqs:documents:upload'),
    canDownloadTTQSDocuments: checkPermission('ttqs:documents:download'),

    // 課程權限
    canCreateCourses: checkPermission('courses:create'),
    canManageCourses: checkPermission('courses:manage'),
    canViewCourses: checkPermission('courses:view'),
    canEnrollCourses: checkPermission('courses:enroll'),

    // 工作權限
    canCreateJobs: checkPermission('jobs:create'),
    canManageJobs: checkPermission('jobs:manage'),
    canViewJobs: checkPermission('jobs:view'),
    canApplyJobs: checkPermission('jobs:apply'),

    // 個人資料權限
    canViewProfile: checkPermission('profile:view'),
    canEditProfile: checkPermission('profile:edit'),
    canViewOthersProfile: checkPermission('profile:view_others')
  }))

  // 檢查是否可以訪問特定路由
  const canAccessRoute = (routeMeta: any): boolean => {
    if (!user.value) return false

    if (routeMeta.requiresAdmin && !permissions.value.isAdmin) return false
    if (routeMeta.requiresInstructor && !permissions.value.isInstructorOrHigher) return false
    if (routeMeta.requiresEmployer && !permissions.value.isEmployerOrHigher) return false
    if (routeMeta.requiresJobSeeker && !permissions.value.isJobSeeker) return false

    return true
  }

  // 檢查是否可以管理特定用戶
  const canManageUser = (targetUserType: UserType): boolean => {
    if (!userType.value) return false
    if (!permissions.value.canManageUsers) return false

    // 管理員可以管理所有人
    if (permissions.value.isAdmin) return true

    // 其他角色不能管理相同或更高層級的用戶
    const hierarchy: Record<UserType, number> = {
      job_seeker: 1,
      employer: 2,
      instructor: 3,
      admin: 4
    }

    return userType.value && hierarchy[userType.value] > hierarchy[targetUserType]
  }

  return {
    user,
    userType,
    permissions,
    checkPermission,
    canAccessRoute,
    canManageUser
  }
}
