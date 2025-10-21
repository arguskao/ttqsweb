import { container, SERVICE_KEYS, type ICacheService } from './container'

// 緩存服務實現
export class CacheService implements ICacheService {
  private readonly cache = new Map<string, { data: any; expiry: number }>()

  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (cached.expiry <= Date.now()) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set<T>(key: string, value: T, ttlMs = 300000): void {
    const expiry = Date.now() + ttlMs
    this.cache.set(key, { data: value, expiry })

    // 定時清理過期緩存
    setTimeout(() => {
      const cached = this.cache.get(key)
      if (cached && cached.expiry <= Date.now()) {
        this.cache.delete(key)
      }
    }, ttlMs)
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // 獲取緩存統計信息
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 註冊緩存服務
container.registerSingleton(SERVICE_KEYS.CACHE_SERVICE, () => new CacheService())

// 導出緩存服務實例獲取函數
export const getCacheService = (): ICacheService => {
  return container.resolve<ICacheService>(SERVICE_KEYS.CACHE_SERVICE)
}
