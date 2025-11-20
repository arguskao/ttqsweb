/**
 * Global Type Definitions
 */

import type { RoutePreloader } from '@/utils/route-preloader'

declare global {
  interface Window {
    /**
     * Route preloader instance for manual preloading
     */
    __routePreloader?: RoutePreloader

    /**
     * Authentication initialization status
     */
    __authInitialized?: boolean
  }
}

export {}

