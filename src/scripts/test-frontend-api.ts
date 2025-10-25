#!/usr/bin/env node

// 模擬前端 API 調用
import axios from 'axios'

async function testFrontendAPI() {
    // 使用與前端相同的配置
    const api = axios.create({
        baseURL: '/api/v1',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const baseURL = 'https://main.pharmacy-assistant-academy.pages.dev'

    try {
        console.log('🔍 測試前端 API 調用...\n')

        // 測試 1: 直接調用完整 URL
        console.log('測試 1: 直接調用完整 URL')
        const response1 = await axios.get(`${baseURL}/api/v1/instructors`, {
            params: {
                is_active: 'true',
                page: 1,
                limit: 9
            }
        })
        console.log('✅ 直接調用成功，講師數量:', response1.data.data.length)

        // 測試 2: 模擬前端 API 實例調用
        console.log('\n測試 2: 模擬前端 API 實例調用')
        const frontendAPI = axios.create({
            baseURL: `${baseURL}/api/v1`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const response2 = await frontendAPI.get('/instructors', {
            params: {
                is_active: 'true',
                page: 1,
                limit: 9
            }
        })
        console.log('✅ 前端 API 實例調用成功，講師數量:', response2.data.data.length)

        // 測試 3: 檢查響應結構
        console.log('\n測試 3: 檢查響應結構')
        console.log('響應結構:', {
            success: response2.data.success,
            dataType: typeof response2.data.data,
            dataLength: response2.data.data?.length,
            meta: response2.data.meta
        })

        if (response2.data.data && response2.data.data.length > 0) {
            console.log('第一個講師:', {
                id: response2.data.data[0].id,
                name: `${response2.data.data[0].first_name} ${response2.data.data[0].last_name}`,
                email: response2.data.data[0].email,
                is_active: response2.data.data[0].is_active
            })
        }

    } catch (error: any) {
        console.error('\n❌ API 調用失敗:')
        console.error('錯誤信息:', error.message)

        if (error.response) {
            console.error('響應狀態:', error.response.status)
            console.error('響應數據:', error.response.data)
        }
    }
}

testFrontendAPI()
    .then(() => {
        console.log('\n✅ 測試完成')
        process.exit(0)
    })
    .catch(error => {
        console.error('\n❌ 測試失敗:', error)
        process.exit(1)
    })