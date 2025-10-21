// 服務容器 - 依賴注入實現
export class ServiceContainer {
  private readonly services = new Map<string, () => any>()
  private readonly instances = new Map<string, any>()

  // 註冊服務工廠函數
  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory)
  }

  // 註冊單例服務
  registerSingleton<T>(name: string, factory: () => T): void {
    this.services.set(name, () => {
      if (!this.instances.has(name)) {
        this.instances.set(name, factory())
      }
      return this.instances.get(name)
    })
  }

  // 解析服務
  resolve<T>(name: string): T {
    const factory = this.services.get(name)
    if (!factory) {
      throw new Error(
        `Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`
      )
    }
    return factory()
  }

  // 檢查服務是否存在
  has(name: string): boolean {
    return this.services.has(name)
  }

  // 獲取所有已註冊的服務名稱
  getServiceNames(): string[] {
    return Array.from(this.services.keys())
  }

  // 清除所有服務
  clear(): void {
    this.services.clear()
    this.instances.clear()
  }
}

// 全局服務容器實例
export const container = new ServiceContainer()

// 服務標識符
export const SERVICE_KEYS = {
  AUTH_SERVICE: 'authService',
  COURSE_SERVICE: 'courseService',
  API_SERVICE: 'apiService',
  ERROR_HANDLER: 'errorHandler',
  CACHE_SERVICE: 'cacheService',
  ANALYTICS_SERVICE: 'analyticsService'
} as const

// 服務註冊裝飾器
export function Injectable(name?: string) {
  return function <T extends new (...args: any[]) => {}>(constructor: T) {
    const serviceName = name || constructor.name
    container.registerSingleton(serviceName, () => new constructor())
    return constructor
  }
}

// 依賴注入裝飾器
export function Inject(serviceName: string) {
  return function (
    _target: any,
    _propertyKey: string | symbol | undefined,
    _parameterIndex: number
  ) {
    // 簡化版裝飾器：在當前專案不依賴反射注入，保留為 no-op 以避免型別錯誤
  }
}

// 服務接口定義
export interface IAuthService {
  login(credentials: any): Promise<any>
  logout(): Promise<void>
  isAuthenticated(): boolean
  getCurrentUser(): any
}

export interface ICourseService {
  getCourses(filters?: any): Promise<any[]>
  getCourse(id: number): Promise<any>
  enrollCourse(courseId: number): Promise<void>
}

export interface IApiService {
  get<T>(url: string, config?: any): Promise<T>
  post<T>(url: string, data?: any, config?: any): Promise<T>
  put<T>(url: string, data?: any, config?: any): Promise<T>
  delete<T>(url: string, config?: any): Promise<T>
}

export interface IErrorHandler {
  handleApiError(error: any): void
}

export interface ICacheService {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl?: number): void
  clear(): void
  delete(key: string): void
}

export interface IAnalyticsService {
  track(event: string, properties?: any): void
  page(page: string): void
  identify(userId: string, traits?: any): void
}
