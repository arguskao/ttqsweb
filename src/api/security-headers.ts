// Security headers middleware
import type { Middleware } from './types'

export const securityHeadersMiddleware: Middleware = async (req, next) => {
  const response = await next()

  // Add security headers to response
  if (response && typeof response === 'object' && 'headers' in response) {
    const headers = response.headers as Record<string, string>

    // Prevent clickjacking
    headers['X-Frame-Options'] = 'DENY'

    // Prevent MIME type sniffing
    headers['X-Content-Type-Options'] = 'nosniff'

    // Enable XSS protection
    headers['X-XSS-Protection'] = '1; mode=block'

    // Strict Transport Security (HTTPS only)
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

    // Content Security Policy
    headers['Content-Security-Policy'] =
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"

    // Referrer Policy
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    // Permissions Policy
    headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

    // Remove server information
    delete headers['X-Powered-By']
    delete headers['Server']
  }

  return response
}

// CORS security middleware
export const secureCorsMiddleware: Middleware = async (req, next) => {
  const response = await next()

  if (response && typeof response === 'object' && 'headers' in response) {
    const headers = response.headers as Record<string, string>

    // Set secure CORS headers
    const origin = req.headers.origin || req.headers.Origin

    // Allow specific origins in production
    const allowedOrigins =
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']

    if (origin && allowedOrigins.includes(origin as string)) {
      headers['Access-Control-Allow-Origin'] = origin as string
    } else if (process.env.NODE_ENV === 'development') {
      headers['Access-Control-Allow-Origin'] = (origin as string) || '*'
    }

    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    headers['Access-Control-Allow-Credentials'] = 'true'
    headers['Access-Control-Max-Age'] = '86400' // 24 hours
  }

  return response
}

