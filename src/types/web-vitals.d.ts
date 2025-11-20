/**
 * Web Vitals Type Definitions
 * https://github.com/GoogleChrome/web-vitals
 */

export interface Metric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
  id: string
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore'
}

export type ReportCallback = (metric: Metric) => void

export function getCLS(callback: ReportCallback, opts?: { reportAllChanges?: boolean }): void
export function getFID(callback: ReportCallback, opts?: { reportAllChanges?: boolean }): void
export function getFCP(callback: ReportCallback, opts?: { reportAllChanges?: boolean }): void
export function getLCP(callback: ReportCallback, opts?: { reportAllChanges?: boolean }): void
export function getTTFB(callback: ReportCallback, opts?: { reportAllChanges?: boolean }): void
export function getINP(callback: ReportCallback, opts?: { reportAllChanges?: boolean }): void
