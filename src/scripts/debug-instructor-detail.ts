#!/usr/bin/env node

import axios from 'axios'

async function debugInstructorDetail() {
    const baseURL = 'https://main.pharmacy-assistant-academy.pages.dev'
    const userId = 20

    console.log('🔍 調試講師詳情頁面的所有 API 調用...\n')

    // 測試 1: 講師基本資料
    console.log('1. 測試講師基本資料 API')
    try {
        const response = await axios.get(`${baseURL}/api/v1/instructors/${userId}`)
        console.log('✅ 講師基本資料 API 成功')
        console.log('響應狀態:', response.status)
        console.log('講師資料:', {
            id: response.data.data.id,
            name: `${response.data.data.first_name} ${response.data.data.last_name}`,
            email: response.data.data.email
        })
    } catch (error: any) {
        console.error('❌ 講師基本資料 API 失敗')
        console.error('錯誤:', error.response?.status, error.response?.statusText)
        console.error('響應:', error.response?.data)
    }

    // 測試 2: 講師統計 (使用講師記錄 ID，不是用戶 ID)
    console.log('\n2. 測試講師統計 API (使用講師記錄 ID: 3)')
    try {
        const response = await axios.get(`${baseURL}/api/v1/instructors/3/stats`)
        console.log('✅ 講師統計 API 成功')
        console.log('統計資料:', response.data)
    } catch (error: any) {
        console.error('❌ 講師統計 API 失敗 (預期的)')
        console.error('錯誤:', error.response?.status, error.response?.statusText)
    }

    // 測試 3: 講師評價 (使用講師記錄 ID，不是用戶 ID)
    console.log('\n3. 測試講師評價 API (使用講師記錄 ID: 3)')
    try {
        const response = await axios.get(`${baseURL}/api/v1/instructors/3/ratings`)
        console.log('✅ 講師評價 API 成功')
        console.log('評價資料:', response.data)
    } catch (error: any) {
        console.error('❌ 講師評價 API 失敗 (預期的)')
        console.error('錯誤:', error.response?.status, error.response?.statusText)
    }

    // 測試 4: 檢查前端會實際調用的 API
    console.log('\n4. 模擬前端實際調用流程')
    try {
        // 第一步：獲取講師基本資料
        const instructorResponse = await axios.get(`${baseURL}/api/v1/instructors/${userId}`)
        const instructor = instructorResponse.data.data
        console.log('獲取到講師資料，講師記錄 ID:', instructor.id)

        // 第二步：使用講師記錄 ID 調用統計 API
        try {
            const statsResponse = await axios.get(`${baseURL}/api/v1/instructors/${instructor.id}/stats`)
            console.log('✅ 統計 API 成功')
        } catch (error: any) {
            console.log('❌ 統計 API 失敗 (404)，這是預期的')
        }

        // 第三步：使用講師記錄 ID 調用評價 API
        try {
            const ratingsResponse = await axios.get(`${baseURL}/api/v1/instructors/${instructor.id}/ratings`)
            console.log('✅ 評價 API 成功')
        } catch (error: any) {
            console.log('❌ 評價 API 失敗 (404)，這是預期的')
        }

    } catch (error: any) {
        console.error('❌ 模擬流程失敗:', error.message)
    }
}

debugInstructorDetail()
    .then(() => {
        console.log('\n✅ 調試完成')
        process.exit(0)
    })
    .catch(error => {
        console.error('\n❌ 調試失敗:', error)
        process.exit(1)
    })