/**
 * API Info
 * GET /api/v1/info
 */

import { createSuccessResponse } from '../../utils/error-handler'

interface Context {
  request: Request
  env: { DATABASE_URL?: string; JWT_SECRET?: string }
}

export async function onRequestGet(context: Context): Promise<Response> {
  return createSuccessResponse({
    name: '藥助Next學院 API',
    version: '1.0.0',
    description: '藥局助理轉職教育與就業媒合平台 API',
    endpoints: {
      auth: '/api/v1/auth',
      courses: '/api/v1/courses',
      jobs: '/api/v1/jobs',
      instructors: '/api/v1/instructors',
      users: '/api/v1/users',
      documents: '/api/v1/documents',
      groups: '/api/v1/groups',
      forum: '/api/v1/forum',
      experiences: '/api/v1/experiences',
      ttqs: '/api/v1/ttqs'
    }
  })
}
