/**
 * Groups API - 學習小組管理（簡化版）
 */

import { withErrorHandler, validateDatabaseUrl, handleDatabaseError, createSuccessResponse } from '../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string }
}

// GET - 獲取小組列表（簡化版，返回空數組）
async function handleGet(context: Context): Promise<Response> {
  // 暫時返回空數組，避免數據庫查詢錯誤
  return createSuccessResponse({
    groups: [],
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    }
  })
}

export const onRequestGet = withErrorHandler(handleGet, 'Get Groups')
