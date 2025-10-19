// Cloudflare Worker for API endpoints
import { handleApiRequest } from '../api'
import type { ApiRequest } from '../api/types'

// Cloudflare Worker environment interface
interface Env {
    DATABASE_URL: string
    JWT_SECRET: string
    ENVIRONMENT: string
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Main Worker fetch handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: corsHeaders,
            })
        }

        try {
            const url = new URL(request.url)
            const pathname = url.pathname

            // Only handle API routes
            if (!pathname.startsWith('/api/v1/')) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'API endpoint not found',
                        },
                    }),
                    {
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders,
                        },
                    }
                )
            }

            // Parse request body
            let body: unknown = undefined
            const contentType = request.headers.get('content-type')

            if (request.method !== 'GET' && request.method !== 'DELETE') {
                if (contentType?.includes('application/json')) {
                    try {
                        body = await request.json()
                    } catch (error) {
                        return new Response(
                            JSON.stringify({
                                success: false,
                                error: {
                                    code: 'INVALID_JSON',
                                    message: 'Invalid JSON in request body',
                                },
                            }),
                            {
                                status: 400,
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...corsHeaders,
                                },
                            }
                        )
                    }
                } else if (contentType?.includes('text/')) {
                    body = await request.text()
                }
            }

            // Extract headers
            const headers: Record<string, string> = {}
            request.headers.forEach((value, key) => {
                headers[key] = value
            })

            // Create API request object
            const apiRequest: ApiRequest = {
                method: request.method,
                url: pathname,
                headers,
                body,
                query: Object.fromEntries(url.searchParams.entries()),
                params: {},
            }

                // Add environment to request context (for database access)
                ; (apiRequest as any).env = env

            // Handle API request
            const apiResponse = await handleApiRequest(
                request.method,
                pathname,
                headers,
                body
            )

            // Return response
            const statusCode = apiResponse.error?.statusCode || (apiResponse.success ? 200 : 500)

            return new Response(JSON.stringify(apiResponse, null, 2), {
                status: statusCode,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            })

        } catch (error) {
            console.error('Worker error:', error)

            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                    },
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            )
        }
    },
}