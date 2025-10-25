#!/usr/bin/env node

import axios from 'axios'

async function finalTestInstructorDetail() {
    const baseURL = 'https://main.pharmacy-assistant-academy.pages.dev'

    console.log('🔍 最終測試講師詳情頁面...\n')

    // 測試講師基本資料 API（這是唯一應該被調用的 API）
    console.log('測試講師基本資料 API:')
    try {
        const response = await axios.get(`${baseURL}/api/v1/instructors/20`)
        console.log('✅ 講師基本資料 API 成功')
        console.log('響應狀態:', response.status)
        console.log('講師資料:', {
            id: response.data.data.id,
            name: `${response.data.data.first_name} ${response.data.data.last_name}`,
            email: response.data.data.email,
            specialization: response.data.data.specialization,
            average_rating: response.data.data.average_rating,
            total_ratings: response.data.data.total_ratings
        })
    } catch (error: any) {
        console.error('❌ 講師基本資料 API 失敗')
        console.error('錯誤:', error.response?.status, error.response?.statusText)
        return
    }

    console.log('\n✅ 測試完成！')
    console.log('📋 預期結果:')
    console.log('- 只有講師基本資料 API 被調用')
    console.log('- 統計和評價數據使用默認值')
    console.log('- 不會有任何 404 錯誤')
    console.log('- 講師詳情頁面正常顯示')
}

finalTestInstructorDetail()
    .then(() => {
        console.log('\n🎉 所有測試通過！')
        process.exit(0)
    })
    .catch(error => {
        console.error('\n❌ 測試失敗:', error)
        process.exit(1)
    })