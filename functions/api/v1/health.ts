/**
 * Health Check API
 * GET /api/v1/health
 */

import { createSuccessResponse } from '../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

export async function onRequestGet(context: Context): Promise<Response> {
  return createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: context.env.ENVIRONMENT || 'production'
  })
}
