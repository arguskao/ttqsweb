/**
 * Cloudflare Pages Function 主入口
 * 簡化版本，只處理基本路由
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

export const onRequest: PagesFunction<Env> = async context => {
  const { request } = context

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  // Handle API routes
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/v1', '')

  // 健康檢查端點
  if (path === '/health') {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: context.env.ENVIRONMENT || 'production',
          database: context.env.DATABASE_URL ? 'connected' : 'not configured'
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }

  // 其他路由返回 404
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found',
        path: path
      }
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}
