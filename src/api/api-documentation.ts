/**
 * API文檔自動生成系統
 * 使用模組化結構重構
 */

import { ApiDocumentationGenerator } from './documentation'
import type { ApiRouter } from './router'

// 創建文檔生成器實例
const generator = new ApiDocumentationGenerator({
  title: '藥助Next學院 API',
  version: '1.0.0',
  description: '藥局助理轉職教育與就業媒合平台 API',
  baseUrl: 'https://fabe6d2d.pharmacy-assistant-academy.pages.dev/api/v1',
  includeExamples: true,
  includeSecurity: true
})

// 添加預定義端點
generator.addPredefinedEndpoints()

/**
 * 生成API文檔
 */
export function generateApiDocumentation(router: ApiRouter) {
  return generator.generateFromRouter(router)
}

/**
 * 獲取API文檔統計
 */
export function getApiDocumentationStats() {
  return generator.getStats()
}

/**
 * 重新掃描API端點
 */
export function rescanApiEndpoints(router: ApiRouter) {
  generator.rescanEndpoints(router)
}

/**
 * 獲取所有端點
 */
export function getAllEndpoints() {
  return generator.getEndpoints()
}
