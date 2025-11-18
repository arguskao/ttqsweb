/**
 * Refresh Token API - 刷新 Token
 * POST /api/v1/auth/refresh
 */

import {
  withErrorHandler,
  validateToken,
  parseJwtToken,
  createSuccessResponse,
  ApiError,
  ErrorCode
} from '../../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

async function handleRefresh(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證舊 token
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)

  // 生成新 token
  const jwt = await import('jsonwebtoken')
  const secret = env.JWT_SECRET

  if (!secret) {
    throw new ApiError(ErrorCode.INTERNAL_ERROR, 'JWT_SECRET 未設置')
  }

  const newToken = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      userType: payload.userType
    },
    secret,
    {
      expiresIn: '24h',
      issuer: 'pharmacy-assistant-academy',
      audience: 'pharmacy-assistant-academy-users'
    }
  )

  return createSuccessResponse({
    token: newToken,
    expiresIn: 86400 // 24 hours in seconds
  })
}

export const onRequestPost = withErrorHandler(handleRefresh, 'Auth Refresh')
