// 全域類型定義
export {}

declare global {
  interface Window {
    // 認證初始化標記
    __authInitialized?: boolean
    
    // 效能監控相關
    __performanceMetrics?: {
      fcp?: number
      lcp?: number
      cls?: number
      fid?: number
      ttfb?: number
    }
  }
}

