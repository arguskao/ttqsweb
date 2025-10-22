/**
 * Cloudflare Pages Function 主入口
 * 負責路由分發和CORS處理
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

// 導入各個模組的處理器
import { handleSystemRoutes } from './handlers/system'
import { handleDatabaseRoutes } from './handlers/database'
import { handleDocumentationRoutes } from './handlers/documentation'
import { handleApiRequest } from './handlers/api'

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

  // 系統相關路由
  if (
    path.startsWith('/optimization') ||
    path.startsWith('/errors') ||
    path.startsWith('/batch') ||
    path.startsWith('/info')
  ) {
    return await handleSystemRoutes(context, path)
  }

  // 數據庫相關路由
  if (path.startsWith('/db/')) {
    return await handleDatabaseRoutes(context, path)
  }

  // API文檔相關路由
  if (path.startsWith('/docs')) {
    return await handleDocumentationRoutes(context, path)
  }

  // 其他API路由
  try {
    return await handleApiRequest(context, path)
  } catch (error) {
    console.error('API Error:', error)
    console.error('Environment check:', {
      hasDatabaseUrl: !!context.env.DATABASE_URL,
      environment: context.env.ENVIRONMENT
    })
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          debug: {
            hasDatabaseUrl: !!context.env.DATABASE_URL,
            environment: context.env.ENVIRONMENT
          }
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}

