#!/usr/bin/env node

import axios from 'axios'

async function testInstructorDetail() {
    const baseURL = 'https://main.pharmacy-assistant-academy.pages.dev'
    const userId = 20 // 從講師列表中我們知道用戶 ID 是 20

    try {
        console.log('🔍 測試講師詳情 API...\n')
        console.log('用戶 ID:', userId)
        console.log('請求 URL:', `${baseURL}/api/v1/instructors/${userId}`)

        const response = await axios.get(`${baseURL}/api/v1/instructors/${userId}`)

        console.log('\n📊 API 響應:')
        console.log('狀態:', response.status)
        console.log('數據:', JSON.stringify(response.data, null, 2))

    } catch (error: any) {
        console.error('\n❌ API 調用失敗:')
        console.error('錯誤信息:', error.message)

        if (error.response) {
            console.error('響應狀態:', error.response.status)
            console.error('響應狀態文本:', error.response.statusText)
            console.error('響應數據:', JSON.stringify(error.response.data, null, 2))
        } else if (error.request) {
            console.error('請求失敗，沒有收到響應')
            console.error('請求配置:', error.config?.url)
        } else {
            console.error('請求配置錯誤:', error.message)
        }
    }
}

testInstructorDetail()
    .then(() => {
        console.log('\n✅ 測試完成')
        process.exit(0)
    })
    .catch(error => {
        console.error('\n❌ 測試失敗:', error)
        process.exit(1)
    })