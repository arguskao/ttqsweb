/**
 * 測試錯誤處理工具的邏輯
 * 不需要運行服務器，直接測試函數邏輯
 */

import {
  ApiError,
  ErrorCode,
  parseJwtToken,
  checkPermission
} from '../functions/utils/error-handler'

// 測試計數器
let totalTests = 0
let passedTests = 0
let failedTests = 0

// 測試函數
function test(name: string, fn: () => void) {
  totalTests++
  try {
    fn()
    console.log(`✓ ${name}`)
    passedTests++
  } catch (error) {
    console.log(`✗ ${name}`)
    console.error(`  錯誤: ${error}`)
    failedTests++
  }
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

console.log('========================================')
console.log('  測試錯誤處理工具邏輯')
console.log('========================================\n')

// ============================================
// 1. 測試 ApiError
// ============================================
console.log('=== 1. 測試 ApiError ===')

test('創建 ApiError', () => {
  const error = new ApiError(ErrorCode.NOT_FOUND, '資源不存在')
  assertEquals(error.code, ErrorCode.NOT_FOUND)
  assertEquals(error.message, '資源不存在')
  assertEquals(error.statusCode, 404)
})

test('ApiError 包含正確的狀態碼', () => {
  const authError = new ApiError(ErrorCode.UNAUTHORIZED, '未授權')
  assertEquals(authError.statusCode, 401)
  
  const validationError = new ApiError(ErrorCode.VALIDATION_ERROR, '驗證失敗')
  assertEquals(validationError.statusCode, 400)
  
  const serverError = new ApiError(ErrorCode.INTERNAL_ERROR, '伺服器錯誤')
  assertEquals(serverError.statusCode, 500)
})

// ============================================
// 2. 測試 parseJwtToken
// ============================================
console.log('\n=== 2. 測試 parseJwtToken ===')

test('解析有效的 JWT token', () => {
  // 創建一個簡單的 JWT token（不驗證簽名）
  const payload = { userId: 123, email: 'test@example.com', userType: 'admin' }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
  const fakeToken = `header.${encodedPayload}.signature`
  
  const parsed = parseJwtToken(fakeToken)
  assertEquals(parsed.userId, 123)
  assertEquals(parsed.email, 'test@example.com')
  assertEquals(parsed.userType, 'admin')
})

test('拒絕無效的 token 格式', () => {
  try {
    parseJwtToken('invalid-token')
    throw new Error('應該拋出錯誤')
  } catch (error) {
    assert(error instanceof ApiError, '應該是 ApiError')
    assertEquals((error as ApiError).code, ErrorCode.INVALID_TOKEN)
  }
})

test('拒絕缺少 userId 的 token', () => {
  const payload = { email: 'test@example.com' } // 缺少 userId
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
  const fakeToken = `header.${encodedPayload}.signature`
  
  try {
    parseJwtToken(fakeToken)
    throw new Error('應該拋出錯誤')
  } catch (error) {
    assert(error instanceof ApiError, '應該是 ApiError')
    assertEquals((error as ApiError).code, ErrorCode.INVALID_TOKEN)
  }
})

// ============================================
// 3. 測試 checkPermission
// ============================================
console.log('\n=== 3. 測試 checkPermission ===')

test('允許正確的權限', () => {
  // 不應該拋出錯誤
  checkPermission('admin', ['admin', 'instructor'])
  checkPermission('instructor', ['admin', 'instructor'])
})

test('拒絕錯誤的權限', () => {
  try {
    checkPermission('job_seeker', ['admin', 'instructor'])
    throw new Error('應該拋出錯誤')
  } catch (error) {
    assert(error instanceof ApiError, '應該是 ApiError')
    assertEquals((error as ApiError).code, ErrorCode.INSUFFICIENT_PERMISSIONS)
  }
})

test('拒絕 undefined 權限', () => {
  try {
    checkPermission(undefined as any, ['admin'])
    throw new Error('應該拋出錯誤')
  } catch (error) {
    assert(error instanceof ApiError, '應該是 ApiError')
  }
})

// ============================================
// 4. 測試 ErrorCode 映射
// ============================================
console.log('\n=== 4. 測試 ErrorCode 映射 ===')

test('所有 ErrorCode 都有對應的狀態碼', () => {
  const errorCodes = [
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.INTERNAL_ERROR
  ]
  
  errorCodes.forEach(code => {
    const error = new ApiError(code, '測試')
    assert(error.statusCode >= 400 && error.statusCode < 600, 
      `${code} 應該有有效的 HTTP 狀態碼`)
  })
})

// ============================================
// 測試結果總結
// ============================================
console.log('\n========================================')
console.log('  測試結果總結')
console.log('========================================')
console.log(`總測試數: ${totalTests}`)
console.log(`通過: ${passedTests}`)
console.log(`失敗: ${failedTests}`)

if (failedTests === 0) {
  console.log('\n✓✓✓ 所有測試通過！✓✓✓\n')
  process.exit(0)
} else {
  console.log(`\n✗ 有 ${failedTests} 個測試失敗\n`)
  process.exit(1)
}
