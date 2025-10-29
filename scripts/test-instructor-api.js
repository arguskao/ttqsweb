#!/usr/bin/env node

/**
 * 測試講師申請 API 端點
 */

import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = 'https://9cb9f595.pharmacy-assistant-academy.pages.dev'
const API_BASE = `${BASE_URL}/api/v1`

async function testInstructorApplicationAPI() {
  console.log('🧪 測試講師申請 API 端點...\n')

  try {
    // 1. 測試健康檢查
    console.log('1️⃣ 測試健康檢查端點...')
    const healthResponse = await fetch(`${API_BASE}/health`)
    const healthData = await healthResponse.json()
    console.log('健康檢查結果:', healthData)

    // 2. 測試講師申請端點（不帶認證）
    console.log('\n2️⃣ 測試講師申請端點（無認證）...')
    const applicationResponse = await fetch(`${API_BASE}/instructor-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bio: '測試申請',
        qualifications: '測試資格',
        specialization: '測試專業',
        years_of_experience: 5
      })
    })
    
    console.log('狀態碼:', applicationResponse.status)
    const applicationData = await applicationResponse.json()
    console.log('回應:', applicationData)

    // 3. 測試用戶申請查詢端點
    console.log('\n3️⃣ 測試用戶申請查詢端點...')
    const userAppResponse = await fetch(`${API_BASE}/users/1/instructor-application`)
    console.log('狀態碼:', userAppResponse.status)
    const userAppData = await userAppResponse.json()
    console.log('回應:', userAppData)

  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }
}

testInstructorApplicationAPI()