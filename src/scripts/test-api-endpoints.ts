/**
 * 測試 API 端點
 * 這個腳本會測試新創建的端點是否正常工作
 */

interface TestResult {
  name: string
  endpoint: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
}

const results: TestResult[] = []

async function testEndpoint(
  name: string,
  url: string,
  options?: RequestInit
): Promise<TestResult> {
  try {
    const response = await fetch(url, options)
    const data = await response.json()

    if (response.ok) {
      return {
        name,
        endpoint: url,
        status: 'PASS',
        message: `HTTP ${response.status} - ${data.message || 'Success'}`
      }
    } else {
      return {
        name,
        endpoint: url,
        status: 'FAIL',
        message: `HTTP ${response.status} - ${data.error?.message || 'Unknown error'}`
      }
    }
  } catch (error) {
    return {
      name,
      endpoint: url,
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function runTests(baseUrl: string) {
  console.log('========================================')
  console.log('測試 API 端點')
  console.log(`Base URL: ${baseUrl}`)
  console.log('========================================\n')

  // 1. 測試系統端點
  console.log('1. 系統端點')
  console.log('---')
  
  results.push(await testEndpoint('Health Check', `${baseUrl}/api/v1/health`))
  results.push(await testEndpoint('API Info', `${baseUrl}/api/v1/info`))
  
  console.log('')

  // 2. 測試認證端點
  console.log('2. 認證端點')
  console.log('---')
  
  results.push(
    await testEndpoint('Logout', `${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
  )
  
  console.log('')

  // 3. 測試講師端點
  console.log('3. 講師端點')
  console.log('---')
  
  results.push(
    await testEndpoint(
      'Search Instructors (無關鍵字)',
      `${baseUrl}/api/v1/instructors/search`
    )
  )
  
  results.push(
    await testEndpoint(
      'Search Instructors (有關鍵字)',
      `${baseUrl}/api/v1/instructors/search?q=test`
    )
  )
  
  results.push(
    await testEndpoint('Top Rated Instructors', `${baseUrl}/api/v1/instructors/top-rated`)
  )
  
  results.push(
    await testEndpoint(
      'Top Rated Instructors (limit=5)',
      `${baseUrl}/api/v1/instructors/top-rated?limit=5`
    )
  )
  
  console.log('')

  // 4. 測試課程端點
  console.log('4. 課程端點')
  console.log('---')
  
  results.push(await testEndpoint('Popular Courses', `${baseUrl}/api/v1/courses/popular`))
  
  results.push(
    await testEndpoint(
      'Popular Courses (limit=5)',
      `${baseUrl}/api/v1/courses/popular?limit=5`
    )
  )
  
  console.log('')

  // 5. 測試工作端點
  console.log('5. 工作端點')
  console.log('---')
  
  results.push(
    await testEndpoint(
      'Jobs by Location (台北)',
      `${baseUrl}/api/v1/jobs/location/${encodeURIComponent('台北')}`
    )
  )
  
  console.log('')

  // 顯示結果
  console.log('========================================')
  console.log('測試結果')
  console.log('========================================\n')

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '○'
    const color =
      result.status === 'PASS' ? '\x1b[32m' : result.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m'
    const reset = '\x1b[0m'

    console.log(`${color}${icon}${reset} ${result.name}`)
    console.log(`  ${result.message}`)
    console.log('')

    if (result.status === 'PASS') passed++
    else if (result.status === 'FAIL') failed++
    else skipped++
  }

  console.log('========================================')
  console.log(`總計: ${results.length}`)
  console.log(`\x1b[32m通過: ${passed}\x1b[0m`)
  console.log(`\x1b[31m失敗: ${failed}\x1b[0m`)
  console.log(`\x1b[33m跳過: ${skipped}\x1b[0m`)
  console.log('========================================\n')

  if (failed === 0) {
    console.log('\x1b[32m🎉 所有測試通過！\x1b[0m\n')
    return true
  } else {
    console.log('\x1b[31m⚠️  有測試失敗\x1b[0m\n')
    return false
  }
}

// 主程式
const baseUrl = process.argv[2] || 'http://localhost:8788'

console.log('提示: 這個測試需要 API 服務正在運行')
console.log('如果要測試本地環境，請先啟動開發服務器')
console.log('如果要測試 Preview 環境，請提供 URL 作為參數\n')
console.log('使用方法:')
console.log('  npm run test:api                          # 測試本地')
console.log('  npm run test:api https://your-url.pages.dev  # 測試 Preview\n')

runTests(baseUrl)
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('測試執行失敗:', error)
    process.exit(1)
  })
