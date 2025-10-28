import https from 'https'

async function checkAPI(url) {
  return new Promise(resolve => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache'
        }
      },
      res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            contentType: res.headers['content-type'],
            isJson: res.headers['content-type']?.includes('application/json')
          })
        })
      }
    )

    req.on('error', () => resolve({ status: 0, contentType: 'error', isJson: false }))
    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ status: 0, contentType: 'timeout', isJson: false })
    })
    req.end()
  })
}

async function monitor() {
  console.log('🔍 監控主域名部署狀態...\n')
  console.log('預覽URL已確認工作正常 ✅')
  console.log('等待主域名更新...\n')

  let attempts = 0
  const maxAttempts = 20

  while (attempts < maxAttempts) {
    attempts++

    const result = await checkAPI('https://pharmacy-assistant-academy.pages.dev/api/v1/health')

    const timestamp = new Date().toLocaleTimeString('zh-TW')

    if (result.isJson && result.status === 200) {
      console.log(`\n🎉 [${timestamp}] 成功！主域名已更新！`)
      console.log('✅ API現在正常工作')
      console.log('✅ 講師功能應該已經可以使用')
      break
    } else {
      process.stdout.write(
        `\r⏳ [${timestamp}] 嘗試 ${attempts}/${maxAttempts} - 狀態: ${result.status} - 等待更新...`
      )
    }

    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // 等待5秒
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n\n⚠️ 主域名仍未更新')
    console.log('📋 建議：')
    console.log('1. 在Cloudflare Pages控制台手動將最新部署設為生產環境')
    console.log('2. 或者使用預覽URL測試: https://672a9c24.pharmacy-assistant-academy.pages.dev')
    console.log('3. 主域名可能需要更長時間才能更新')
  }
}

monitor().catch(console.error)
