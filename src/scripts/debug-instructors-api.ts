#!/usr/bin/env node

import axios from 'axios'

async function debugInstructorsAPI() {
    const baseURL = 'https://main.pharmacy-assistant-academy.pages.dev'

    try {
        console.log('🔍 調試講師列表 API...\n')
        console.log('請求 URL:', `${baseURL}/api/v1/instructors`)
        console.log('請求參數:', {
            status: 'approved',
            is_active: 'true',
            page: 1,
            limit: 12
        })

        // 測試講師列表 API
        const response = await axios.get(`${baseURL}/api/v1/instructors`, {
            params: {
                status: 'approved',
                is_active: 'true',
                page: 1,
                limit: 12
            },
            timeout: 10000
        })

        console.log('\n📊 響應狀態:', response.status)
        console.log('📋 響應標頭:', response.headers)
        console.log('📋 響應數據:', JSON.stringify(response.data, null, 2))

    } catch (error: any) {
        console.error('\n❌ API 調用失敗:')
        console.error('錯誤類型:', error.name)
        console.error('錯誤信息:', error.message)

        if (error.response) {
            console.error('\n📊 錯誤響應:')
            console.error('狀態碼:', error.response.status)
            console.error('狀態文本:', error.response.statusText)
            console.error('響應標頭:', error.response.headers)
            console.error('響應數據:', JSON.stringify(error.response.data, null, 2))
        } else if (error.request) {
            console.error('\n📡 請求錯誤:')
            console.error('請求配置:', error.config)
            console.error('請求對象:', error.request)
        } else {
            console.error('\n⚙️ 配置錯誤:')
            console.error('錯誤配置:', error.config)
        }
    }

    // 也測試一下簡單的健康檢查
    try {
        console.log('\n🏥 測試基礎連接...')
        const healthResponse = await axios.get(`${baseURL}/`, { timeout: 5000 })
        console.log('基礎連接狀態:', healthResponse.status)
    } catch (error: any) {
        console.error('基礎連接失敗:', error.message)
    }
}

debugInstructorsAPI()
    .then(() => {
        console.log('\n✅ 調試完成')
        process.exit(0)
    })
    .catch(error => {
        console.error('\n❌ 調試失敗:', error)
        process.exit(1)
    })