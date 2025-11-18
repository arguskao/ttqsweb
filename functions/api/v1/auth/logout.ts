/**
 * Logout API - 登出
 * POST /api/v1/auth/logout
 */

import { withErrorHandler, createSuccessResponse } from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

async function handleLogout(context: Context): Promise<Response> {
  // 登出主要在前端處理（清除 localStorage 中的 token）
  // 後端可以選擇將 token 加入黑名單（如果有實作 token blacklist）
  
  return createSuccessResponse(
    { message: '登出成功' },
    '登出成功'
  )
}

export const onRequestPost = withErrorHandler(handleLogout, 'Auth Logout')
