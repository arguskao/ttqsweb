#!/usr/bin/env node

import axios from 'axios'

async function simpleAPITest() {
    const baseURL = 'https://main.pharmacy-assistant-academy.pages.dev'

    try {
        console.log('🔍 簡單 API 測試...\n')

        // 測試基本連接
        console.log('1. 測試基本連接...')
        const healthResponse = await axios.get(`${baseURL}/`)
        console.log('✅ 基本連接正常，狀態:', healthResponse.status)

        // 測試 API 端點
        console.log('\n2. 測試講師 API 端點...')
        const apiResponse = await axios.get(`${baseURL}/api/v1/instructors?is_active=true&page=1&limit=9`)

        console.log('API 響應狀態:', apiResponse.status)
        console.log('API 響應標頭:', apiResponse.headers['content-type'])

        // 檢查響應結構
        const data = apiResponse.data
        console.log('\n3. 響應結構分析:')
        console.log('- success:', data.success)
        console.log('- data 類型:', typeof data.data)
        console.log('- data 是否為陣列:', Array.isArray(data.data))
        console.log('- data 長度:', data.data?.length)
        console.log('- meta:', data.meta)

        if (data.data && data.data.length > 0) {
            console.log('\n4. 第一個講師資料:')
            const instructor = data.data[0]
            console.log('- ID:', instructor.id)
            console.log('- 姓名:', instructor.first_name, instructor.last_name)
            console.log('- Email:', instructor.email)
            console.log('- 專業領域:', instructor.specialization)
            console.log('- 是否啟用:', instructor.is_active)
        }

        // 測試前端會收到的確切響應
        console.log('\n5. 完整響應數據:')
        console.log(JSON.stringify(data, null, 2))

    } catch (error: any) {
        console.error('\n❌ 測試失敗:')
        console.error('錯誤類型:', error.constructor.name)
        console.error('錯誤信息:', error.message)

        if (error.response) {
            console.error('響應狀態:', error.response.status)
            console.error('響應狀態文本:', error.response.statusText)
            console.error('響應標頭:', error.response.headers)
            console.error('響應數據:', error.response.data)
        } else if (error.request) {
            console.error('請求配置:', error.config?.url)
            console.error('請求方法:', error.config?.method)
        }
    }
}

simpleAPITest()
    .then(() => {
        console.log('\n✅ 測試完成')
        process.exit(0)
    })
    .catch(error => {
        console.error('\n❌ 測試異常:', error)
        process.exit(1)
    })