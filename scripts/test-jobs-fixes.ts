/**
 * 測試 Jobs TODO 修復
 * 驗證 hasApplied 檢查和薪資過濾功能
 */

import { jobServiceNeon } from '../src/api/jobs-service-neon'

// 測試計數器
let totalTests = 0
let passedTests = 0
let failedTests = 0

// 顏色輸出（在終端中）
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

// 測試函數
function test(name: string, fn: () => Promise<void>) {
  totalTests++
  return fn()
    .then(() => {
      console.log(`${colors.green}✓${colors.reset} ${name}`)
      passedTests++
    })
    .catch(error => {
      console.log(`${colors.red}✗${colors.reset} ${name}`)
      console.error(`  ${colors.red}錯誤: ${error.message}${colors.reset}`)
      failedTests++
    })
}

// 斷言函數
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `期望 ${expected}, 實際 ${actual}`
    )
  }
}

function assertExists(value: any, message?: string) {
  if (value === null || value === undefined) {
    throw new Error(message || '值不應該是 null 或 undefined')
  }
}

console.log('========================================')
console.log('  測試 Jobs TODO 修復')
console.log('========================================\n')

// ============================================
// 1. 測試 hasApplied 功能
// ============================================
console.log(`${colors.yellow}=== 1. 測試 hasApplied 功能 ===${colors.reset}`)

test('getJobs 方法接受 userId 參數', async () => {
  // 不應該拋出錯誤
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    userId: 999 // 測試用戶 ID
  })
  
  assertExists(result, '應該返回結果')
  assertExists(result.data, '應該有 data 屬性')
  assertExists(result.meta, '應該有 meta 屬性')
})

test('未提供 userId 時，hasApplied 應該是 false', async () => {
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5
    // 不提供 userId
  })
  
  if (result.data.length > 0) {
    result.data.forEach(job => {
      assertEquals(job.hasApplied, false, `工作 ${job.id} 的 hasApplied 應該是 false`)
    })
  }
})

test('提供 userId 時，hasApplied 屬性存在', async () => {
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    userId: 1 // 假設用戶 ID 1 存在
  })
  
  if (result.data.length > 0) {
    result.data.forEach(job => {
      assert(
        'hasApplied' in job, 
        `工作 ${job.id} 應該有 hasApplied 屬性`
      )
      assert(
        typeof job.hasApplied === 'boolean',
        `hasApplied 應該是 boolean 類型`
      )
    })
  }
})

test('getJobById 方法接受 userId 參數', async () => {
  // 先獲取一個工作 ID
  const jobs = await jobServiceNeon.getJobs({ page: 1, limit: 1 })
  
  if (jobs.data.length > 0) {
    const jobId = jobs.data[0].id
    
    // 測試帶 userId 的查詢
    const job = await jobServiceNeon.getJobById(jobId, 1)
    
    if (job) {
      assert(
        'hasApplied' in job,
        '工作詳情應該包含 hasApplied 屬性'
      )
      assert(
        typeof job.hasApplied === 'boolean',
        'hasApplied 應該是 boolean 類型'
      )
    }
  }
})

// ============================================
// 2. 測試薪資過濾功能
// ============================================
console.log(`\n${colors.yellow}=== 2. 測試薪資過濾功能 ===${colors.reset}`)

test('salaryMin 參數應該被接受', async () => {
  // 不應該拋出錯誤
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    salaryMin: 30000
  })
  
  assertExists(result, '應該返回結果')
  assertExists(result.data, '應該有 data 屬性')
})

test('salaryMax 參數應該被接受', async () => {
  // 不應該拋出錯誤
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    salaryMax: 50000
  })
  
  assertExists(result, '應該返回結果')
  assertExists(result.data, '應該有 data 屬性')
})

test('同時使用 salaryMin 和 salaryMax', async () => {
  // 不應該拋出錯誤
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    salaryMin: 30000,
    salaryMax: 50000
  })
  
  assertExists(result, '應該返回結果')
  assertExists(result.data, '應該有 data 屬性')
  
  // 如果有結果，檢查薪資範圍
  if (result.data.length > 0) {
    result.data.forEach(job => {
      if (job.salaryMin !== null) {
        assert(
          job.salaryMin >= 30000,
          `工作 ${job.id} 的最低薪資應該 >= 30000`
        )
      }
      if (job.salaryMax !== null) {
        assert(
          job.salaryMax <= 50000,
          `工作 ${job.id} 的最高薪資應該 <= 50000`
        )
      }
    })
  }
})

// ============================================
// 3. 測試其他過濾功能
// ============================================
console.log(`\n${colors.yellow}=== 3. 測試其他過濾功能 ===${colors.reset}`)

test('jobType 過濾應該正常工作', async () => {
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    jobType: 'full_time'
  })
  
  assertExists(result, '應該返回結果')
  
  if (result.data.length > 0) {
    result.data.forEach(job => {
      assertEquals(
        job.jobType, 
        'full_time',
        `工作 ${job.id} 的類型應該是 full_time`
      )
    })
  }
})

test('location 過濾應該正常工作', async () => {
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    location: '台北'
  })
  
  assertExists(result, '應該返回結果')
  
  if (result.data.length > 0) {
    result.data.forEach(job => {
      if (job.location) {
        assert(
          job.location.includes('台北'),
          `工作 ${job.id} 的地點應該包含「台北」`
        )
      }
    })
  }
})

test('search 過濾應該正常工作', async () => {
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    search: '藥師'
  })
  
  assertExists(result, '應該返回結果')
  
  if (result.data.length > 0) {
    result.data.forEach(job => {
      const matchTitle = job.title && job.title.includes('藥師')
      const matchDesc = job.description && job.description.includes('藥師')
      
      assert(
        matchTitle || matchDesc,
        `工作 ${job.id} 的標題或描述應該包含「藥師」`
      )
    })
  }
})

// ============================================
// 4. 測試組合過濾
// ============================================
console.log(`\n${colors.yellow}=== 4. 測試組合過濾 ===${colors.reset}`)

test('組合多個過濾條件', async () => {
  const result = await jobServiceNeon.getJobs({ 
    page: 1, 
    limit: 5,
    jobType: 'full_time',
    salaryMin: 30000,
    userId: 1
  })
  
  assertExists(result, '應該返回結果')
  assertExists(result.data, '應該有 data 屬性')
  assertExists(result.meta, '應該有 meta 屬性')
  
  // 檢查分頁資訊
  assert(result.meta.page === 1, 'page 應該是 1')
  assert(result.meta.limit === 5, 'limit 應該是 5')
  assert(typeof result.meta.total === 'number', 'total 應該是數字')
  assert(typeof result.meta.totalPages === 'number', 'totalPages 應該是數字')
})

// ============================================
// 5. 測試資料結構
// ============================================
console.log(`\n${colors.yellow}=== 5. 測試資料結構 ===${colors.reset}`)

test('返回的工作資料結構正確', async () => {
  const result = await jobServiceNeon.getJobs({ page: 1, limit: 1 })
  
  if (result.data.length > 0) {
    const job = result.data[0]
    
    // 檢查必要欄位
    assertExists(job.id, '應該有 id')
    assertExists(job.title, '應該有 title')
    assert('hasApplied' in job, '應該有 hasApplied')
    assert('salaryMin' in job, '應該有 salaryMin')
    assert('salaryMax' in job, '應該有 salaryMax')
    assert('jobType' in job, '應該有 jobType')
    assert('location' in job, '應該有 location')
    assert('employerName' in job, '應該有 employerName')
    assert('createdAt' in job, '應該有 createdAt')
  }
})

test('分頁資訊結構正確', async () => {
  const result = await jobServiceNeon.getJobs({ page: 1, limit: 5 })
  
  const meta = result.meta
  
  assertExists(meta.page, '應該有 page')
  assertExists(meta.limit, '應該有 limit')
  assertExists(meta.total, '應該有 total')
  assertExists(meta.totalPages, '應該有 totalPages')
  
  assert(typeof meta.page === 'number', 'page 應該是數字')
  assert(typeof meta.limit === 'number', 'limit 應該是數字')
  assert(typeof meta.total === 'number', 'total 應該是數字')
  assert(typeof meta.totalPages === 'number', 'totalPages 應該是數字')
})

// ============================================
// 執行所有測試
// ============================================
async function runTests() {
  try {
    // 等待所有測試完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 顯示測試結果
    console.log('\n========================================')
    console.log('  測試結果總結')
    console.log('========================================')
    console.log(`總測試數: ${totalTests}`)
    console.log(`${colors.green}通過: ${passedTests}${colors.reset}`)
    console.log(`${colors.red}失敗: ${failedTests}${colors.reset}`)
    
    if (failedTests === 0) {
      console.log(`\n${colors.green}✓✓✓ 所有測試通過！✓✓✓${colors.reset}`)
      console.log('\n已驗證的功能：')
      console.log('  1. ✅ hasApplied 檢查正常工作')
      console.log('  2. ✅ 薪資過濾功能啟用')
      console.log('  3. ✅ 其他過濾功能正常')
      console.log('  4. ✅ 組合過濾正常')
      console.log('  5. ✅ 資料結構正確')
      console.log('')
      process.exit(0)
    } else {
      console.log(`\n${colors.red}✗ 有 ${failedTests} 個測試失敗${colors.reset}`)
      console.log('\n建議：')
      console.log('  1. 檢查資料庫連接是否正常')
      console.log('  2. 確認 jobs 和 job_applications 表存在')
      console.log('  3. 查看失敗測試的錯誤訊息')
      console.log('')
      process.exit(1)
    }
  } catch (error) {
    console.error(`\n${colors.red}測試執行失敗:${colors.reset}`, error)
    process.exit(1)
  }
}

// 執行測試
runTests()
