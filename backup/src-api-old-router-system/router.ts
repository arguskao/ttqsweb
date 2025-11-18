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

  // HTTP method shortcuts with overloads for flexible middleware passing
  get(path: string, handler: RouteHandler): void
  get(path: string, middleware: Middleware, handler: RouteHandler): void
  get(path: string, middlewares: Middleware[], handler: RouteHandler): void
  get(path: string, ...args: any[]): void {
    this.handleRouteArgs('GET', path, ...args)
  }

  post(path: string, handler: RouteHandler): void
  post(path: string, middleware: Middleware, handler: RouteHandler): void
  post(path: string, middlewares: Middleware[], handler: RouteHandler): void
  post(path: string, ...args: any[]): void {
    this.handleRouteArgs('POST', path, ...args)
  }

  put(path: string, handler: RouteHandler): void
  put(path: string, middleware: Middleware, handler: RouteHandler): void
  put(path: string, middlewares: Middleware[], handler: RouteHandler): void
  put(path: string, ...args: any[]): void {
    this.handleRouteArgs('PUT', path, ...args)
  }

  delete(path: string, handler: RouteHandler): void
  delete(path: string, middleware: Middleware, handler: RouteHandler): void
  delete(path: string, middlewares: Middleware[], handler: RouteHandler): void
  delete(path: string, ...args: any[]): void {
    this.handleRouteArgs('DELETE', path, ...args)
  }

  patch(path: string, handler: RouteHandler): void
  patch(path: string, middleware: Middleware, handler: RouteHandler): void
  patch(path: string, middlewares: Middleware[], handler: RouteHandler): void
  patch(path: string, ...args: any[]): void {
    this.handleRouteArgs('PATCH', path, ...args)
  }

  // Helper method to handle different argument patterns
  private handleRouteArgs(method: string, path: string, ...args: any[]): void {
    let handler: RouteHandler
    let middlewares: Middleware[] = []

    if (args.length === 1) {
      // Only handler provided
      handler = args[0] as RouteHandler
    } else if (args.length === 2) {
      // Middleware(s) and handler provided
      const first = args[0]
      handler = args[1] as RouteHandler

      if (Array.isArray(first)) {
        middlewares = first as Middleware[]
      } else {
        middlewares = [first as Middleware]
      }
    } else {
      throw new Error(`Invalid arguments for ${method} route: ${path}`)
    }

    this.addRoute(method, path, handler, middlewares)
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
    const urlWithoutQuery = (req.url ?? '').split('?')[0]

    // Find matching route
    const httpMethod = (req.method || 'GET').toString()
    const match = this.findRoute(httpMethod, String(urlWithoutQuery))

    if (!match) {
      const methodStr = String(req.method || 'GET')
      const urlStr = String(req.url ?? '')
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
