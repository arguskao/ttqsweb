#!/usr/bin/env node

import axios from 'axios'

async function testInstructorsAPI() {
    const baseURL = 'https://main.pharmacy-assistant-academy.pages.dev'

    try {
        console.log('🔍 測試講師列表 API...\n')

        // 測試講師列表 API
        const response = await axios.get(`${baseURL}/api/v1/instructors`, {
            params: {
                status: 'approved',
                is_active: 'true',
                page: 1,
                limit: 12
            }
        })

        console.log('📊 API 響應狀態:', response.status)
        console.log('📋 響應數據:', JSON.stringify(response.data, null, 2))

        if (response.data.success) {
            console.log(`\n✅ 成功！找到 ${response.data.data.length} 個講師`)

            if (response.data.data.length > 0) {
                response.data.data.forEach((instructor: any, index: number) => {
                    console.log(`\n講師 ${index + 1}:`)
                    console.log(`  姓名: ${instructor.first_name} ${instructor.last_name}`)
                    console.log(`  Email: ${instructor.email}`)
                    console.log(`  專業領域: ${instructor.specialization}`)
                    console.log(`  狀態: ${instructor.is_active ? '啟用' : '停用'}`)
                })
            }
        } else {
            console.log('❌ API 返回失敗:', response.data.error)
        }

    } catch (error: any) {
        console.error('❌ API 調用失敗:', error.message)
        if (error.response) {
            console.error('響應狀態:', error.response.status)
            console.error('響應數據:', error.response.data)
        }
    }
}

testInstructorsAPI()
    .then(() => {
        console.log('\n✅ 測試完成')
        process.exit(0)
    })
    .catch(error => {
        console.error('❌ 測試失敗:', error)
        process.exit(1)
    })