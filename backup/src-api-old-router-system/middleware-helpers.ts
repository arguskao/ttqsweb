/**
 * 中間件輔助函數
 * 提供統一的認證和授權包裝器
 */

import { requireAuth, requireRole } from './auth-middleware'
import type { ApiRequest, ApiResponse } from './types'

// 輔助函數：創建帶認證中間件的路由處理器
export function withAuth(handler: (req: ApiRequest) => Promise<ApiResponse>) {
  return async (req: ApiRequest): Promise<ApiResponse> => {
    // 應用認證中間件
    const authMiddleware = requireAuth
    return await authMiddleware(req, async () => handler(req))
  }
}

// 輔助函數：創建帶角色中間件的路由處理器
export function withRole(
  roles: string | string[],
  handler: (req: ApiRequest) => Promise<ApiResponse>
) {
  return async (req: ApiRequest): Promise<ApiResponse> => {
    // 應用角色中間件
    const normalizedRoles = Array.isArray(roles) ? roles : [roles]
    const roleMiddleware = requireRole(normalizedRoles)
    return await roleMiddleware(req, async () => handler(req))
  }
}

// 輔助函數：創建帶多個中間件的路由處理器
export function withMiddlewares(
  middlewares: Array<(req: ApiRequest, next: () => Promise<ApiResponse>) => Promise<ApiResponse>>,
  handler: (req: ApiRequest) => Promise<ApiResponse>
) {
  return async (req: ApiRequest): Promise<ApiResponse> => {
    let index = 0

    const next = async (): Promise<ApiResponse> => {
      if (index >= middlewares.length) {
        return await handler(req)
      }

      const middleware = middlewares[index++]
      return await middleware!(req, next)
    }

    return await next()
  }
}
