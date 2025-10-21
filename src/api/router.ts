import { NotFoundError } from './errors'
import type { ApiRequest, ApiResponse, RouteHandler, Middleware } from './types'

// Route definition interface
export interface Route {
  method: string
  path: string
  handler: RouteHandler
  middlewares?: Middleware[]
}

// Router class
export class ApiRouter {
  private readonly routes: Route[] = []
  private readonly globalMiddlewares: Middleware[] = []

  // Add global middleware
  use(middleware: Middleware): void {
    this.globalMiddlewares.push(middleware)
  }

  // Add route with specific method
  addRoute(
    method: string,
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = []
  ): void {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      handler,
      middlewares
    })
  }

  // HTTP method shortcuts
  get(path: string, handler: RouteHandler, middlewares: Middleware[] = []): void {
    this.addRoute('GET', path, handler, middlewares)
  }

  post(path: string, handler: RouteHandler, middlewares: Middleware[] = []): void {
    this.addRoute('POST', path, handler, middlewares)
  }

  put(path: string, handler: RouteHandler, middlewares: Middleware[] = []): void {
    this.addRoute('PUT', path, handler, middlewares)
  }

  delete(path: string, handler: RouteHandler, middlewares: Middleware[] = []): void {
    this.addRoute('DELETE', path, handler, middlewares)
  }

  patch(path: string, handler: RouteHandler, middlewares: Middleware[] = []): void {
    this.addRoute('PATCH', path, handler, middlewares)
  }

  // Find matching route
  private findRoute(
    method: string,
    path: string
  ): { route: Route; params: Record<string, string> } | null {
    // Strip query parameters from path for matching
    const pathWithoutQuery = String(path).split('?')[0]

    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue

      const params = this.matchPath(String(route.path), String(pathWithoutQuery))
      if (params !== null) {
        return { route, params }
      }
    }
    return null
  }

  // Simple path matching with parameters
  private matchPath(routePath: string, requestPath: string): Record<string, string> | null {
    const routeParts = routePath.split('/')
    const requestParts = requestPath.split('/')

    if (routeParts.length !== requestParts.length) {
      return null
    }

    const params: Record<string, string> = {}

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i]!
      const requestPart = requestParts[i]!

      if (routePart.startsWith(':')) {
        // Parameter
        const paramName = routePart.substring(1)
        params[paramName] = requestPart
      } else if (routePart !== requestPart) {
        // Exact match required
        return null
      }
    }

    return params
  }

  // Execute middleware chain
  private async executeMiddlewares(
    middlewares: Middleware[],
    req: ApiRequest,
    finalHandler: () => Promise<ApiResponse>
  ): Promise<ApiResponse> {
    if (middlewares.length === 0) {
      return await finalHandler()
    }

    const [currentMiddleware, ...remainingMiddlewares] = middlewares

    return await (currentMiddleware as Middleware)(req, async () => {
      return await this.executeMiddlewares(remainingMiddlewares, req, finalHandler)
    })
  }

  // Handle incoming request
  async handleRequest(req: ApiRequest): Promise<ApiResponse> {
    // Strip query parameters from URL for route matching
    const urlWithoutQuery = (req.url || '').split('?')[0]

    // Find matching route
    const httpMethod = (req.method || 'GET').toString()
    const match = this.findRoute(httpMethod, String(urlWithoutQuery))

    if (!match) {
      const methodStr = String(req.method || 'GET')
      const urlStr = String(req.url || '')
      throw new NotFoundError(`路由不存在: ${methodStr} ${urlStr}`)
    }

    // Add route parameters to request
    req.params = match.params

    // Combine global and route-specific middlewares
    const routeMiddlewares = Array.isArray(match.route.middlewares) ? match.route.middlewares : []
    const allMiddlewares: Middleware[] = [...this.globalMiddlewares, ...routeMiddlewares].filter(
      (mw): mw is Middleware => typeof mw === 'function'
    )

    // Execute middleware chain and route handler
    return await this.executeMiddlewares(allMiddlewares, req, async () => {
      return await match.route.handler(req)
    })
  }

  // Get all registered routes (for debugging)
  getRoutes(): Route[] {
    return [...this.routes]
  }
}

// Create main router instance
export const router = new ApiRouter()
