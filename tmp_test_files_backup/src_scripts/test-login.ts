/**
 * 測試登入功能
 * 使用 wii543@gmail.com / ppt11567 進行測試
 */

import axios from 'axios'

const API_BASE_URL = 'https://58859742.pharmacy-assistant-academy.pages.dev/api/v1'

async function testLogin() {
  try {
    console.log('🔐 開始測試登入功能...')
    
    const loginData = {
      email: 'wii543@gmail.com',
      password: 'ppt11567'
    }

    console.log('📤 發送登入請求:', {
      email: loginData.email,
      passwordLength: loginData.password.length
    })

    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      loginData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    console.log('✅ 登入成功!')
    console.log('📦 響應數據:', JSON.stringify(response.data, null, 2))
    
    if (response.data.success && response.data.data) {
      const { user, tokens } = response.data.data
      console.log('\n👤 用戶信息:')
      console.log('  - ID:', user.id)
      console.log('  - Email:', user.email)
      console.log('  - 用戶類型:', user.userType)
      console.log('  - 姓名:', `${user.firstName || ''} ${user.lastName || ''}`)
      
      console.log('\n🎫 Token 信息:')
      console.log('  - Access Token:', tokens.accessToken.substring(0, 50) + '...')
      console.log('  - Token 長度:', tokens.accessToken.length)
      
      // 嘗試解析 JWT token
      try {
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]))
        console.log('\n📝 Token Payload:')
        console.log('  - User ID:', payload.userId)
        console.log('  - Email:', payload.email)
        console.log('  - User Type:', payload.userType)
        console.log('  - Expires:', new Date(payload.exp * 1000).toLocaleString())
      } catch (e) {
        console.log('\n⚠️  無法解析 JWT token')
      }
    }

    return response.data
  } catch (error: any) {
    console.error('❌ 登入失敗!')
    
    if (error.response) {
      console.error('📋 錯誤詳情:')
      console.error('  - 狀態碼:', error.response.status)
      console.error('  - 錯誤數據:', JSON.stringify(error.response.data, null, 2))
    } else if (error.request) {
      console.error('⚠️  網絡錯誤: 無響應')
      console.error('  - 錯誤信息:', error.message)
    } else {
      console.error('⚠️  請求錯誤:', error.message)
    }
    
    throw error
  }
}

// 執行測試
testLogin()
  .then(() => {
    console.log('\n✅ 測試完成')
    process.exit(0)
  })
  .catch((error) => {
    console.log('\n❌ 測試失敗')
    process.exit(1)
  })


