/**
 * 測試新創建的路由端點
 * 這個腳本會檢查所有新創建的路由檔案是否可以正確載入
 */

import { existsSync } from 'fs'
import { resolve } from 'path'

const newRoutes = [
  'functions/api/v1/health.ts',
  'functions/api/v1/info.ts',
  'functions/api/v1/auth/logout.ts',
  'functions/api/v1/auth/refresh.ts',
  'functions/api/v1/courses/popular.ts',
  'functions/api/v1/instructors/search.ts',
  'functions/api/v1/instructors/top-rated.ts',
  'functions/api/v1/jobs/location/[location].ts',
  'functions/api/v1/jobs/pending-approval.ts'
]

console.log('========================================')
console.log('檢查新創建的路由檔案')
console.log('========================================\n')

let allExist = true

for (const route of newRoutes) {
  const fullPath = resolve(process.cwd(), route)
  const exists = existsSync(fullPath)
  
  if (exists) {
    console.log(`✓ ${route}`)
  } else {
    console.log(`✗ ${route} - 檔案不存在！`)
    allExist = false
  }
}

console.log('\n========================================')

if (allExist) {
  console.log('✅ 所有路由檔案都存在！')
  console.log('\n下一步：')
  console.log('1. 執行 npm run build 確保沒有編譯錯誤')
  console.log('2. 執行 npm run deploy:pages:preview 部署到 Preview 環境')
  console.log('3. 使用 ./test-new-endpoints.sh [PREVIEW_URL] 測試端點')
} else {
  console.log('❌ 有檔案缺失！')
  process.exit(1)
}

console.log('========================================\n')
