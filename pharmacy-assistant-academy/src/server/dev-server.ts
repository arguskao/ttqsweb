#!/usr/bin/env node

import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import { handleApiRequest } from '../api'
import { testDatabaseConnection } from '../config/database'

const PORT = process.env.PORT || 3000

// Simple HTTP server for development
async function createDevServer() {
    // Test database connection on startup
    console.log('Testing database connection...')
    const isConnected = await testDatabaseConnection()

    if (!isConnected) {
        console.error('Failed to connect to database. Please check your DATABASE_URL.')
        process.exit(1)
    }

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
            const parsedUrl = parse(req.url || '', true)
            const pathname = parsedUrl.pathname || '/'

            // Only handle API routes
            if (!pathname.startsWith('/api/v1/')) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'API endpoint not found'
                    }
                }))
                return
            }

            // Parse request body
            let body: unknown = undefined
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                const chunks: Buffer[] = []

                req.on('data', (chunk: Buffer) => {
                    chunks.push(chunk)
                })

                await new Promise<void>((resolve) => {
                    req.on('end', () => {
                        const bodyString = Buffer.concat(chunks).toString()
                        try {
                            body = bodyString ? JSON.parse(bodyString) : undefined
                        } catch (error) {
                            body = bodyString
                        }
                        resolve()
                    })
                })
            }

            // Extract headers
            const headers: Record<string, string> = {}
            for (const [key, value] of Object.entries(req.headers)) {
                if (typeof value === 'string') {
                    headers[key] = value
                } else if (Array.isArray(value)) {
                    headers[key] = value[0] || ''
                }
            }

            // Handle API request
            const apiResponse = await handleApiRequest(
                req.method || 'GET',
                pathname,
                headers,
                body
            )

            // Send response
            const statusCode = apiResponse.error?.statusCode || (apiResponse.success ? 200 : 500)
            res.writeHead(statusCode, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(apiResponse, null, 2))

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
        console.log(`🚀 Development API server running on http://localhost:${PORT}`)
        console.log(`📚 API documentation: http://localhost:${PORT}/api/v1/info`)
        console.log(`❤️  Health check: http://localhost:${PORT}/api/v1/health`)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully...')
        server.close(() => {
            console.log('Server closed')
            process.exit(0)
        })
    })

    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully...')
        server.close(() => {
            console.log('Server closed')
            process.exit(0)
        })
    })

    return server
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createDevServer().catch((error) => {
        console.error('Failed to start server:', error)
        process.exit(1)
    })
}

export { createDevServer }