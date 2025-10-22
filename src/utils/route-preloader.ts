import type { Router } from 'vue-router'

interface PreloadConfig {
  routes: string[]
  priority: 'high' | 'medium' | 'low'
  condition?: () => boolean
}

class RoutePreloader {
  private readonly router: Router
  private readonly preloadedRoutes = new Set<string>()
  private config: PreloadConfig[] = []

  constructor(router: Router) {
    this.router = router
    this.setupDefaultConfig()
    this.setupIntersectionObserver()
  }

  private setupDefaultConfig(): void {
    this.config = [
      {
        routes: ['courses', 'jobs', 'instructors'],
        priority: 'high',
        condition: () => this.isAuthenticated()
      },
      {
        routes: ['profile', 'learning-progress'],
        priority: 'medium',
        condition: () => this.isAuthenticated()
      },
      {
        routes: ['admin-analytics', 'admin-ttqs'],
        priority: 'low',
        condition: () => this.isAdmin()
      }
    ]
  }

  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const routeName = entry.target.getAttribute('data-route')
            if (routeName) {
              this.preloadRoute(routeName)
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    // Observe navigation links
    document.addEventListener('DOMContentLoaded', () => {
      const navLinks = document.querySelectorAll('[data-route]')
      navLinks.forEach(link => observer.observe(link))
    })
  }

  private isAuthenticated(): boolean {
    return !!sessionStorage.getItem('access_token')
  }

  private isAdmin(): boolean {
    // This would need to be implemented based on your auth system
    return false
  }

  private async preloadRoute(routeName: string): Promise<void> {
    if (this.preloadedRoutes.has(routeName)) return

    try {
      const route = this.router.resolve({ name: routeName })
      if (route.matched && route.matched.length > 0) {
        const matchedRoute = route.matched[0]
        if (matchedRoute) {
          const component = matchedRoute.components?.default as any
          if (component && typeof component === 'function') {
            await component()
            this.preloadedRoutes.add(routeName)
            console.log(`Preloaded route: ${routeName}`)
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to preload route ${routeName}:`, error)
    }
  }

  public preloadByPriority(priority: 'high' | 'medium' | 'low'): void {
    const configs = this.config.filter(c => c.priority === priority)

    configs.forEach(config => {
      if (!config.condition || config.condition()) {
        config.routes.forEach(routeName => {
          this.preloadRoute(routeName)
        })
      }
    })
  }

  public preloadCriticalRoutes(): void {
    // Preload high priority routes immediately
    this.preloadByPriority('high')

    // Preload medium priority routes after a short delay
    setTimeout(() => {
      this.preloadByPriority('medium')
    }, 1000)

    // Preload low priority routes after user interaction
    setTimeout(() => {
      this.preloadByPriority('low')
    }, 3000)
  }

  public preloadOnHover(element: HTMLElement, routeName: string): void {
    let timeoutId: number | null = null

    element.addEventListener('mouseenter', () => {
      timeoutId = window.setTimeout(() => {
        this.preloadRoute(routeName)
      }, 200) // 200ms delay to avoid unnecessary preloading
    })

    element.addEventListener('mouseleave', () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    })
  }

  public getPreloadedRoutes(): string[] {
    return Array.from(this.preloadedRoutes)
  }
}

export function setupRoutePreloading(router: Router): RoutePreloader {
  return new RoutePreloader(router)
}

// Vue directive for hover preloading
export const vPreloadOnHover = {
  mounted(el: HTMLElement, binding: { value: string }) {
    const routeName = binding.value
    const preloader = (window as any).__routePreloader as RoutePreloader

    if (preloader) {
      preloader.preloadOnHover(el, routeName)
    }
  }
}
