
// Setup authentication routes

// Setup course routes

// Setup job routes

// Setup instructor routes

// Setup document routes

// Setup TTQS routes

// Setup Evaluation routes
import { setupEvaluationRoutes } from './evaluation-routes'

// Setup TTQS Analytics routes
import { setupTTQSAnalyticsRoutes } from './ttqs-analytics-routes'

// Setup Analytics routes
import { setupAnalyticsRoutes } from './analytics-routes'
import { setupAuthRoutes } from './auth-routes'

// Setup Community routes
import { setupCommunityRoutes } from './community-routes'
import { setupCourseRoutes } from './course-routes'
import { setupCourseRoutesNeon } from './course-routes-neon'
import { setupDocumentRoutes } from './document-routes'
import { setupDocumentRoutesNeon } from './documents-routes-neon'
import { setupInstructorRoutes } from './instructor-routes'
import { setupJobRoutes } from './job-routes'
import { setupJobRoutesNeon } from './jobs-routes-neon'
import {
  corsMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware,
  rateLimitMiddleware
} from './middleware'
import { router } from './router'

// Setup Support routes
import { setupSupportRoutes } from './support-routes'
import { setupTTQSRoutes } from './ttqs-routes'
import type { ApiRequest, ApiResponse } from './types'

// Setup global middlewares
router.use(errorHandlingMiddleware)
router.use(corsMiddleware)
router.use(loggingMiddleware)
router.use(rateLimitMiddleware(100, 60000)) // 100 requests per minute

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
setupAuthRoutes(router)
// 使用新的 Neon 兼容路由
setupCourseRoutesNeon(router)
setupJobRoutesNeon(router)
setupDocumentRoutesNeon(router)
setupInstructorRoutes(router)
setupTTQSRoutes(router)
setupEvaluationRoutes(router)
setupTTQSAnalyticsRoutes(router)
setupAnalyticsRoutes(router)
setupCommunityRoutes(router)
setupSupportRoutes(router)

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
