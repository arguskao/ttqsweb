/**
 * API文檔端點和自動掃描功能
 */

import { ApiDocumentationGenerator } from './documentation/generator'
import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'

// 全局生成器實例
const generator = new ApiDocumentationGenerator()

// 設置API文檔路由
export function setupApiDocumentationRoutes(router: ApiRouter): void {
  // 自動掃描並註冊所有路由
  generator.extractFromRouter(router)

  // OpenAPI JSON 端點
  router.get('/api/v1/docs/openapi.json', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const spec = generator.generateOpenAPISpec()

      return {
        success: true,
        data: spec,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // 緩存1小時
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: '生成API文檔失敗',
          statusCode: 500
        }
      }
    }
  })

  // Swagger UI 端點
  router.get('/api/v1/docs', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const html = generator.generateSwaggerUI()

      return {
        success: true,
        data: html,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: '生成Swagger UI失敗',
          statusCode: 500
        }
      }
    }
  })

  // Markdown 文檔端點
  router.get('/api/v1/docs/markdown', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const markdown = generator.generateMarkdown()

      return {
        success: true,
        data: markdown,
        headers: {
          'Content-Type': 'text/markdown',
          'Cache-Control': 'public, max-age=3600'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: '生成Markdown文檔失敗',
          statusCode: 500
        }
      }
    }
  })

  // API文檔統計端點
  router.get('/api/v1/docs/stats', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const stats = generator.getStats()

      return {
        success: true,
        data: {
          ...stats,
          lastUpdated: new Date().toISOString(),
          totalSchemas: generator['schemas'].size,
          totalTags: generator['tags'].size
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: '獲取文檔統計失敗',
          statusCode: 500
        }
      }
    }
  })

  // 重新掃描API端點
  router.post('/api/v1/docs/rescan', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      // 清空現有端點
      generator['endpoints'].clear()

      // 重新掃描
      generator.extractFromRouter(router)

      const stats = generator.getStats()

      return {
        success: true,
        data: {
          message: 'API端點重新掃描完成',
          stats,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: '重新掃描API端點失敗',
          statusCode: 500
        }
      }
    }
  })

  // API端點列表端點
  router.get('/api/v1/docs/endpoints', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const endpoints: Array<{
        path: string
        method: string
        summary: string
        description?: string
        tags?: string[]
        parameters?: any[]
      }> = []

      generator['endpoints'].forEach((metadata, key) => {
        endpoints.push({
          path: metadata.path,
          method: metadata.method,
          summary: metadata.summary,
          description: metadata.description,
          tags: metadata.tags,
          parameters: metadata.parameters
        })
      })

      // 按標籤分組
      const groupedEndpoints: Record<string, typeof endpoints> = {}
      endpoints.forEach(endpoint => {
        const tag = endpoint.tags?.[0] || 'general'
        if (!groupedEndpoints[tag]) {
          groupedEndpoints[tag] = []
        }
        groupedEndpoints[tag].push(endpoint)
      })

      return {
        success: true,
        data: {
          endpoints,
          groupedEndpoints,
          total: endpoints.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: '獲取API端點列表失敗',
          statusCode: 500
        }
      }
    }
  })
}

// 手動註冊特定端點的元數據
export function registerApiEndpoint(metadata: {
  path: string
  method: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: any[]
  requestBody?: any
  responses?: any
  examples?: any
}): void {
  generator.registerEndpoint(metadata)
}

// 批量註冊端點
export function registerApiEndpoints(
  endpoints: Array<{
    path: string
    method: string
    summary: string
    description?: string
    tags?: string[]
    parameters?: any[]
    requestBody?: any
    responses?: any
    examples?: any
  }>
): void {
  endpoints.forEach(endpoint => {
    generator.registerEndpoint(endpoint)
  })
}

// 預定義的API端點元數據
export const predefinedEndpoints = [
  // 認證端點
  {
    path: '/api/v1/auth/register',
    method: 'POST',
    summary: '用戶註冊',
    description: '創建新用戶帳戶',
    tags: ['auth'],
    requestBody: {
      description: '用戶註冊信息',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 },
              userType: { type: 'string', enum: ['job_seeker', 'employer'] },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              phone: { type: 'string' }
            },
            required: ['email', 'password', 'userType', 'firstName', 'lastName']
          }
        }
      }
    }
  },
  {
    path: '/api/v1/auth/login',
    method: 'POST',
    summary: '用戶登入',
    description: '用戶登入獲取JWT令牌',
    tags: ['auth'],
    requestBody: {
      description: '登入憑證',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' }
            },
            required: ['email', 'password']
          }
        }
      }
    }
  },
  {
    path: '/api/v1/auth/profile',
    method: 'GET',
    summary: '獲取用戶資料',
    description: '獲取當前登入用戶的資料',
    tags: ['auth'],
    security: [{ bearerAuth: [] }]
  },
  {
    path: '/api/v1/auth/logout',
    method: 'POST',
    summary: '用戶登出',
    description: '登出並使令牌失效',
    tags: ['auth'],
    security: [{ bearerAuth: [] }]
  },

  // 課程端點
  {
    path: '/api/v1/courses',
    method: 'GET',
    summary: '獲取課程列表',
    description: '獲取所有可用課程，支持分頁和篩選',
    tags: ['courses'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 },
        description: '頁碼'
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 10 },
        description: '每頁數量'
      },
      {
        name: 'category',
        in: 'query',
        schema: { type: 'string' },
        description: '課程類別'
      },
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: '搜索關鍵字'
      }
    ]
  },
  {
    path: '/api/v1/courses/:id',
    method: 'GET',
    summary: '獲取課程詳情',
    description: '根據ID獲取特定課程的詳細信息',
    tags: ['courses'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: '課程ID'
      }
    ]
  },

  // 工作端點
  {
    path: '/api/v1/jobs',
    method: 'GET',
    summary: '獲取工作列表',
    description: '獲取所有可用工作，支持分頁和篩選',
    tags: ['jobs'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 },
        description: '頁碼'
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 10 },
        description: '每頁數量'
      },
      {
        name: 'location',
        in: 'query',
        schema: { type: 'string' },
        description: '工作地點'
      },
      {
        name: 'employmentType',
        in: 'query',
        schema: { type: 'string' },
        description: '工作類型'
      }
    ]
  },
  {
    path: '/api/v1/jobs/:id',
    method: 'GET',
    summary: '獲取工作詳情',
    description: '根據ID獲取特定工作的詳細信息',
    tags: ['jobs'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: '工作ID'
      }
    ]
  },

  // 文檔端點
  {
    path: '/api/v1/documents',
    method: 'GET',
    summary: '獲取文檔列表',
    description: '獲取所有公開文檔，支持分頁和篩選',
    tags: ['documents'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 },
        description: '頁碼'
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 12 },
        description: '每頁數量'
      },
      {
        name: 'category',
        in: 'query',
        schema: { type: 'string' },
        description: '文檔類別'
      },
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: '搜索關鍵字'
      }
    ]
  },
  {
    path: '/api/v1/documents/:id',
    method: 'GET',
    summary: '獲取文檔詳情',
    description: '根據ID獲取特定文檔的詳細信息',
    tags: ['documents'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: '文檔ID'
      }
    ]
  },

  // 系統端點
  {
    path: '/api/v1/health',
    method: 'GET',
    summary: '健康檢查',
    description: '檢查API服務的健康狀態',
    tags: ['system']
  },
  {
    path: '/api/v1/info',
    method: 'GET',
    summary: 'API信息',
    description: '獲取API的基本信息',
    tags: ['system']
  },
  {
    path: '/api/v1/optimization/test',
    method: 'GET',
    summary: 'API優化測試',
    description: '測試API優化功能',
    tags: ['system']
  },
  {
    path: '/api/v1/errors/stats',
    method: 'GET',
    summary: '錯誤統計',
    description: '獲取API錯誤統計信息',
    tags: ['system']
  },
  {
    path: '/api/v1/batch',
    method: 'POST',
    summary: '批量操作',
    description: '執行批量API請求',
    tags: ['system'],
    requestBody: {
      description: '批量請求列表',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                method: { type: 'string' },
                url: { type: 'string' },
                body: { type: 'object' }
              },
              required: ['method', 'url']
            }
          }
        }
      }
    }
  }
]

// 初始化預定義端點
export function initializePredefinedEndpoints(): void {
  registerApiEndpoints(predefinedEndpoints)
}
