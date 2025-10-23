/**
 * 認證和權限中間件
 */

import type { UserType, User } from '../services/auth'
import type { Permission } from '../services/permissions'
import { hasPermission, isAdmin, hasHigherRole } from '../services/permissions'

// API 請求接口擴展
export interface AuthenticatedRequest {
  user?: User & { userType: UserType }
}

// 權限錯誤類
export class PermissionError extends Error {
  constructor(
    message: string,
    public requiredPermission?: Permission
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

// 檢查是否已認證
export function requireAuth(req: AuthenticatedRequest): User & { userType: UserType } {
  if (!req.user) {
    throw new Error('需要登入才能訪問此功能')
  }
  return req.user
}

// 檢查特定權限
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest) => {
    const user = requireAuth(req)

    if (!hasPermission(user.userType, permission)) {
      throw new PermissionError(`權限不足：需要 ${permission} 權限`, permission)
    }

    return user
  }
}

// 檢查管理員權限
export function requireAdmin(req: AuthenticatedRequest): User & { userType: UserType } {
  const user = requireAuth(req)

  if (!isAdmin(user.userType)) {
    throw new PermissionError('需要管理員權限')
  }

  return user
}

// 檢查講師或更高權限
export function requireInstructorOrHigher(
  req: AuthenticatedRequest
): User & { userType: UserType } {
  const user = requireAuth(req)

  if (!hasPermission(user.userType, 'courses:create')) {
    throw new PermissionError('需要講師或更高權限')
  }

  return user
}

// 檢查雇主或更高權限
export function requireEmployerOrHigher(req: AuthenticatedRequest): User & { userType: UserType } {
  const user = requireAuth(req)

  if (!hasPermission(user.userType, 'jobs:create')) {
    throw new PermissionError('需要雇主或更高權限')
  }

  return user
}

// 檢查資源擁有者權限（用戶只能操作自己的資源，除非是管理員）
export function requireOwnershipOrAdmin(
  req: AuthenticatedRequest,
  resourceUserId: number
): User & { userType: UserType } {
  const user = requireAuth(req)

  if (user.id !== resourceUserId && !isAdmin(user.userType)) {
    throw new PermissionError('只能操作自己的資源，或需要管理員權限')
  }

  return user
}

// 檢查更高角色權限（用於角色管理）
export function requireHigherRole(
  req: AuthenticatedRequest,
  targetUserType: UserType
): User & { userType: UserType } {
  const user = requireAuth(req)

  if (!hasHigherRole(user.userType, targetUserType)) {
    throw new PermissionError('權限不足：無法管理相同或更高層級的用戶')
  }

  return user
}

// 組合權限檢查
export function requireAnyPermission(permissions: Permission[]) {
  return (req: AuthenticatedRequest) => {
    const user = requireAuth(req)

    const hasAnyPerm = permissions.some(permission => hasPermission(user.userType, permission))

    if (!hasAnyPerm) {
      throw new PermissionError(`權限不足：需要以下任一權限 ${permissions.join(', ')}`)
    }

    return user
  }
}

// 權限檢查裝飾器工廠
export function withPermission(permission: Permission) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!

    descriptor.value = function (this: any, ...args: any[]) {
      const req = args[0] as AuthenticatedRequest
      requirePermission(permission)(req)
      return originalMethod.apply(this, args)
    } as T

    return descriptor
  }
}

// 管理員權限裝飾器
export function adminOnly<T extends (...args: any[]) => any>(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
) {
  const originalMethod = descriptor.value!

  descriptor.value = function (this: any, ...args: any[]) {
    const req = args[0] as AuthenticatedRequest
    requireAdmin(req)
    return originalMethod.apply(this, args)
  } as T

  return descriptor
}
