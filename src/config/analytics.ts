/**
 * Analytics 配置常量
 * Analytics Configuration Constants
 */
export const ANALYTICS_CONFIG = {
  /**
   * 滾動深度追蹤間隔 (每 25% 記錄一次)
   * Scroll depth tracking interval (record every 25%)
   */
  SCROLL_DEPTH_INTERVAL: 25,

  /**
   * 滾動事件防抖延遲 (毫秒)
   * Scroll event debounce delay (milliseconds)
   */
  SCROLL_DEBOUNCE_DELAY: 100,

  /**
   * 毫秒轉秒數轉換常量
   * Milliseconds to seconds conversion constant
   */
  MS_TO_SECONDS: 1000,
} as const

export type AnalyticsConfig = typeof ANALYTICS_CONFIG

