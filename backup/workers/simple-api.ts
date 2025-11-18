// Simple Cloudflare Worker for API endpoints
interface Env {
    DATABASE_URL: string
    JWT_SECRET: string
    ENVIRONMENT: string
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      })
    }

    try {
      const url = new URL(request.url)
      const pathname = url.pathname

      // Health check endpoint
      if (pathname === '/api/v1/health') {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
              environment: env.ENVIRONMENT
            }
          }, null, 2),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        )
      }

      // API info endpoint
      if (pathname === '/api/v1/info') {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              name: '藥助Next學院 API',
              version: '1.0.0',
              description: '藥局助理轉職教育與就業媒合平台 API',
              environment: env.ENVIRONMENT,
              endpoints: {
                auth: '/api/v1/auth',
                courses: '/api/v1/courses',
                jobs: '/api/v1/jobs',
                users: '/api/v1/users',
                files: '/api/v1/files',
                admin: '/api/v1/admin'
              }
            }
          }, null, 2),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        )
      }

      // Database test endpoint
      if (pathname === '/api/v1/db-test') {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              message: 'Database connection configured',
              hasUrl: !!env.DATABASE_URL,
              hasJwt: !!env.JWT_SECRET
            }
          }, null, 2),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        )
      }

      // 404 for other routes
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'API endpoint not found'
          }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )

    } catch (error) {
      console.error('Worker error:', error)

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }
  }
}
