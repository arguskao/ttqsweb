// Setup authentication routes

// Setup course routes

// Setup job routes

// Setup instructor routes

// Setup document routes

// Setup TTQS routes

// Setup Evaluation routes

// Setup TTQS Analytics routes

// Setup Analytics routes
import { setupAnalyticsRoutes } from './analytics-routes'
import { setupApiDocumentationRoutes, initializePredefinedEndpoints } from './api-docs-routes'
import { setupAuthRoutes } from './auth-routes'

// Setup Community routes
import { setupCommunityRoutes } from './community-routes'
import { setupCourseRoutesNeon } from './course-routes-neon'
import { setupDocumentRoutesNeon } from './documents-routes-neon'
import { enhancedErrorHandlingMiddlewareChain } from './enhanced-error-handling'
import { setupInstructorRoutes } from './instructor-routes'
import { setupJobRoutesNeon } from './jobs-routes-neon'
import {
  loggingMiddleware
} from './middleware'
import { generalApiRateLimit } from './rate-limit'
import { responseOptimizationMiddleware } from './response-optimization'
import { router } from './router'

// 導入新的優化中間件
import { securityHeadersMiddleware, secureCorsMiddleware } from './security-headers'

// 導入API文檔功能

// Setup Support routes
import { setupSupportRoutes } from './support-routes'
import { setupTTQSAnalyticsRoutes } from './ttqs-analytics-routes'
import { setupTTQSRoutes } from './ttqs-routes'
import type { ApiRequest, ApiResponse } from './types'

// Setup global middlewares
// 使用增強版錯誤處理中間件鏈
enhancedErrorHandlingMiddlewareChain().forEach(middleware => {
  router.use(middleware)
})

// 使用響應優化中間件
responseOptimizationMiddleware().forEach(middleware => {
  router.use(middleware)
})

router.use(secureCorsMiddleware) // Use secure CORS instead of basic CORS
router.use(securityHeadersMiddleware) // Add security headers
router.use(loggingMiddleware)
router.use(generalApiRateLimit('api')) // Use enhanced rate limiting

// Health check endpoint
router.get('/api/v1/health', async (req: ApiRequest): Promise<ApiResponse> => {
  return {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  }
})

// API優化測試端點
router.get('/api/v1/optimization/test', async (req: ApiRequest): Promise<ApiResponse> => {
  return {
    success: true,
    data: {
      message: 'API優化測試端點',
      features: ['響應壓縮', '智能緩存', '請求去重', '性能監控', '結構化錯誤處理', '錯誤追蹤'],
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  }
})

// 錯誤統計端點
router.get('/api/v1/errors/stats', async (req: ApiRequest): Promise<ApiResponse> => {
  const { ErrorTracker } = await import('./enhanced-error-handling')
  const stats = ErrorTracker.getErrorStats()

  return {
    success: true,
    data: stats
  }
})

// 批量操作測試端點
router.post('/api/v1/batch', async (req: ApiRequest): Promise<ApiResponse> => {
  const batchRequests = req.body as Array<{
    method: string
    url: string
    body?: any
  }>

  if (!Array.isArray(batchRequests)) {
    throw new Error('批量請求格式錯誤')
  }

  // 模擬處理批量請求
  const results = batchRequests.map((batchReq, index) => ({
    index,
    method: batchReq.method,
    url: batchReq.url,
    success: true,
    data: { message: `處理 ${batchReq.method} ${batchReq.url}` }
  }))

  return {
    success: true,
    data: {
      results,
      total: batchRequests.length,
      successful: results.length,
      failed: 0
    }
  }
})

// API info endpoint
router.get('/api/v1/info', async (req: ApiRequest): Promise<ApiResponse> => {
  return {
    success: true,
    data: {
      name: '藥助Next學院 API',
      version: '1.0.0',
      description: '藥局助理轉職教育與就業媒合平台 API',
      endpoints: {
        auth: '/api/v1/auth',
        courses: '/api/v1/courses',
        jobs: '/api/v1/jobs',
        instructors: '/api/v1/instructors',
        users: '/api/v1/users',
        files: '/api/v1/files',
        admin: '/api/v1/admin',
        analytics: '/api/v1/analytics',
        groups: '/api/v1/groups',
        experiences: '/api/v1/experiences',
        venues: '/api/v1/venues',
        recommendations: '/api/v1/recommendations',
        instructorDevelopment: '/api/v1/instructor-development'
      }
    }
  }
})
// 初始化預定義的API端點元數據
initializePredefinedEndpoints()

setupAuthRoutes(router)
// 使用新的 Neon 兼容路由
setupCourseRoutesNeon(router)
setupJobRoutesNeon(router)
setupDocumentRoutesNeon(router)
setupInstructorRoutes(router)
setupTTQSRoutes(router)
setupTTQSAnalyticsRoutes(router)
setupAnalyticsRoutes(router)
setupCommunityRoutes(router)
setupSupportRoutes(router)

// 設置API文檔路由（必須在所有其他路由之後）
setupApiDocumentationRoutes(router)

// 調試：列出所有註冊的路由
console.log('=== 已註冊的路由 ===')
const allRoutes = router.getRoutes()
allRoutes.forEach(route => {
  console.log(`${route.method} ${route.path}`)
})
console.log(`總共 ${allRoutes.length} 個路由`)
console.log('==================')

// 添加缺失的API端點
// 添加文件上傳端點
router.post('/api/v1/documents', async (req: ApiRequest): Promise<ApiResponse> => {
  try {
    if (!req.user) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '需要登入才能上傳文件',
          statusCode: 401
        }
      }
    }

    const {
      title,
      description,
      file_url,
      file_type,
      file_size,
      category,
      is_public = true
    } = req.body as any

    // Validate required fields
    if (!title || !file_url) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '標題和文件 URL 為必填項',
          statusCode: 400
        }
      }
    }

    // 模擬創建文檔
    const document = {
      id: Date.now(),
      title,
      description: description || null,
      file_url,
      file_type: file_type || null,
      file_size: file_size || null,
      category: category || null,
      is_public,
      uploaded_by: req.user.id,
      download_count: 0,
      created_at: new Date().toISOString()
    }

    return {
      success: true,
      data: document
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '上傳文件失敗',
        statusCode: 500
      }
    }
  }
})

// 添加文件更新端點
router.put('/api/v1/documents/:id', async (req: ApiRequest): Promise<ApiResponse> => {
  try {
    if (!req.user) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '需要登入才能更新文件',
          statusCode: 401
        }
      }
    }

    const id = parseInt(req.params?.id || '0', 10)
    if (!id) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無效的文件 ID',
          statusCode: 400
        }
      }
    }

    const { title, description, category, is_public } = req.body as any

    // 模擬更新文檔
    const updatedDocument = {
      id,
      title: title || '更新後的標題',
      description: description || '更新後的描述',
      category: category || 'general',
      is_public: is_public !== undefined ? is_public : true,
      updated_at: new Date().toISOString()
    }

    return {
      success: true,
      data: updatedDocument
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '更新文件失敗',
        statusCode: 500
      }
    }
  }
})

// 添加文件刪除端點
router.delete('/api/v1/documents/:id', async (req: ApiRequest): Promise<ApiResponse> => {
  try {
    if (!req.user) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '需要登入才能刪除文件',
          statusCode: 401
        }
      }
    }

    const id = parseInt(req.params?.id ?? '0', 10)
    if (!id) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無效的文件 ID',
          statusCode: 400
        }
      }
    }

    return {
      success: true,
      data: { message: '文件已刪除' }
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '刪除文件失敗',
        statusCode: 500
      }
    }
  }
})

export { router }
export * from './types'
export * from './errors'
export * from './middleware'
export * from './database'

// Main API handler function (for serverless environments)
export async function handleApiRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): Promise<ApiResponse> {
  const request: ApiRequest = {
    method,
    url,
    headers,
    body,
    query: extractQueryParams(url),
    params: {}
  }

  return await router.handleRequest(request)
}

// Utility function to extract query parameters from URL
function extractQueryParams(url: string): Record<string, string> {
  const queryString = url.split('?')[1]
  if (!queryString) return {}

  const params: Record<string, string> = {}
  const pairs = queryString.split('&')

  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value)
    }
  }

  return params
}
