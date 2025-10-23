#!/usr/bin/env node

/**
 * 環境變數檢查腳本
 * 確保所有必要的環境變數都已設置
 */

import 'dotenv/config'

function checkEnvironment() {
  console.log('🔍 檢查環境變數配置...\n')

  const requiredVars = ['DATABASE_URL', 'JWT_SECRET']

  const optionalVars = ['NODE_ENV', 'PORT']

  let hasErrors = false

  // 檢查必要變數
  console.log('📋 必要環境變數:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      // 隱藏敏感信息
      const displayValue =
        varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('URL')
          ? '***已設置***'
          : value
      console.log(`   ✅ ${varName}: ${displayValue}`)
    } else {
      console.log(`   ❌ ${varName}: 未設置`)
      hasErrors = true
    }
  })

  // 檢查可選變數
  console.log('\n📋 可選環境變數:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`   ✅ ${varName}: ${value}`)
    } else {
      console.log(`   ⚪ ${varName}: 未設置 (使用默認值)`)
    }
  })

  // 檢查資料庫 URL 格式
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    console.log('\n🔗 資料庫連接檢查:')
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
      console.log('   ✅ 資料庫 URL 格式正確')

      // 解析 URL 以顯示基本信息（不顯示密碼）
      try {
        const url = new URL(databaseUrl)
        console.log(`   📍 主機: ${url.hostname}`)
        console.log(`   🔌 端口: ${url.port || '5432'}`)
        console.log(`   🗄️  資料庫: ${url.pathname.slice(1)}`)
        console.log(`   👤 用戶: ${url.username}`)
      } catch (error) {
        console.log('   ⚠️  無法解析資料庫 URL')
      }
    } else {
      console.log('   ❌ 資料庫 URL 格式不正確，應以 postgresql:// 或 postgres:// 開頭')
      hasErrors = true
    }
  }

  console.log('\n' + '='.repeat(50))

  if (hasErrors) {
    console.log('❌ 環境配置有問題，請檢查上述錯誤')
    console.log('\n💡 解決方案:')
    console.log('   1. 複製 .env.example 到 .env')
    console.log('   2. 在 .env 中設置正確的環境變數')
    console.log('   3. 確保 DATABASE_URL 指向有效的 PostgreSQL 資料庫')
    return false
  } else {
    console.log('✅ 環境配置正確，可以執行遷移')
    return true
  }
}

// 執行檢查
if (import.meta.url === `file://${process.argv[1]}`) {
  const isValid = checkEnvironment()
  process.exit(isValid ? 0 : 1)
}

export { checkEnvironment }
