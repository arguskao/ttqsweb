// 測試登入 API
const testLogin = async () => {
  // 先測試健康檢查
  console.log('🔍 測試健康檢查端點...')
  try {
    const healthResponse = await fetch(
      'https://dffdd932.pharmacy-assistant-academy.pages.dev/api/v1/health'
    )
    console.log('健康檢查狀態:', healthResponse.status)
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('健康檢查響應:', JSON.stringify(healthData, null, 2))
    } else {
      const healthText = await healthResponse.text()
      console.log('健康檢查錯誤:', healthText.substring(0, 200))
    }
    console.log('---\n')
  } catch (error) {
    console.error('健康檢查失敗:', error.message)
  }

  const apiUrl = 'https://dffdd932.pharmacy-assistant-academy.pages.dev/api/v1/auth/login'

  const credentials = {
    email: 'wii543@gmail.com',
    password: 'ppt11567'
  }

  console.log('🔍 測試登入 API...')
  console.log('URL:', apiUrl)
  console.log('Email:', credentials.email)
  console.log('---')

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    })

    console.log('📊 響應狀態:', response.status, response.statusText)
    console.log('📋 響應頭:')
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    console.log('---')

    const text = await response.text()
    console.log('📄 原始響應:', text.substring(0, 500))
    console.log('---')

    try {
      const data = JSON.parse(text)
      console.log('✅ JSON 解析成功:')
      console.log(JSON.stringify(data, null, 2))

      if (data.success) {
        console.log('✅ 登入成功！')
        if (data.data?.tokens?.accessToken) {
          console.log('🔑 Token:', `${data.data.tokens.accessToken.substring(0, 50)}...`)
        }
        if (data.data?.user) {
          console.log('👤 用戶:', data.data.user)
        }
      } else {
        console.log('❌ 登入失敗:', data.error?.message || '未知錯誤')
      }
    } catch (parseError) {
      console.error('❌ JSON 解析失敗:', parseError.message)
    }
  } catch (error) {}
}

testLogin()
