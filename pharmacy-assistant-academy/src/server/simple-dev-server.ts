#!/usr/bin/env node

import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'http'

const PORT = process.env.PORT || 3000

// Simple test server without database
async function createSimpleServer() {
    console.log('Starting simple API server...')

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200)
            res.end()
            return
        }

        try {
            const url = new URL(req.url || '', `http://localhost:${PORT}`)
            const pathname = url.pathname

            // Simple health check
            if (pathname === '/api/v1/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        version: '1.0.0'
                    }
                }, null, 2))
                return
            }

            // API info
            if (pathname === '/api/v1/info') {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        name: '藥助Next學院 API',
                        version: '1.0.0',
                        description: '藥局助理轉職教育與就業媒合平台 API',
                        endpoints: {
                            auth: '/api/v1/auth',
                            courses: '/api/v1/courses',
                            jobs: '/api/v1/jobs',
                            users: '/api/v1/users',
                            files: '/api/v1/files',
                            admin: '/api/v1/admin'
                        }
                    }
                }, null, 2))
                return
            }

            // 404 for other routes
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'API endpoint not found'
                }
            }))

        } catch (error) {
            console.error('Server error:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            }))
        }
    })

    server.listen(PORT, () => {
        console.log(`🚀 Simple API server running on http://localhost:${PORT}`)
        console.log(`📚 API info: http://localhost:${PORT}/api/v1/info`)
        console.log(`❤️  Health check: http://localhost:${PORT}/api/v1/health`)
    })

    return server
}

createSimpleServer().catch(console.error)