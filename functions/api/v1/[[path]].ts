/**
 * Cloudflare Pages Function 主入口
 * 使用完整的API路由系統
 */

import { handleApiRequest } from '../../../src/api/index'

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

interface PagesContext {
  request: Request
  env: Env
  params: Record<string, string>
  waitUntil: (promise: Promise<any>) => void
}

export const onRequest = async (context: PagesContext) => {
  const { request } = context

  try {
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

    // 設置環境變量
    if (context.env.DATABASE_URL) {
      process.env.DATABASE_URL = context.env.DATABASE_URL
    }
    if (context.env.JWT_SECRET) {
      process.env.JWT_SECRET = context.env.JWT_SECRET
    }

    // 解析請求
    const url = new URL(request.url)
    const method = request.method
    const headers: Record<string, string> = {}

    // 轉換 Headers 對象為普通對象
    request.headers.forEach((value: string, key: string) => {
      headers[key] = value
    })

    // 解析請求體
    let body: unknown = undefined
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        try {
          body = await request.json()
        } catch (error) {
          // 忽略JSON解析錯誤
        }
      }
    }

    // 使用我們的API路由系統
    const apiResponse = await handleApiRequest(method, url.pathname + url.search, headers, body)

    // 轉換響應
    return new Response(JSON.stringify(apiResponse), {
      status: apiResponse.error?.statusCode || (apiResponse.success ? 200 : 500),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID'
      }
    })
  } catch (error) {
    console.error('API Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
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
