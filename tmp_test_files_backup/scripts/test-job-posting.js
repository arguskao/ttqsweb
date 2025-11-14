#!/usr/bin/env node

/**
 * 測試工作發布功能
 * 使用雇主帳號登入並發布幾個測試職缺
 */

const EMPLOYER_EMAIL = 'cats8727+002@gmail.com'
const EMPLOYER_PASSWORD = 'cats8727+002@gmail.com'
const BASE_URL = 'https://9ac36ba7.pharmacy-assistant-academy.pages.dev'

// 測試職缺數據
const TEST_JOBS = [
  {
    title: '藥房助理 - 台北信義區',
    description: '我們正在尋找熱忱、細心且具備良好溝通能力的藥房助理加入我們的團隊。\n\n**主要工作內容：**\n• 協助藥師調劑處方箋\n• 協助顧客尋找非處方藥品及健康產品\n• 維持藥品庫存，確保藥品充足\n• 處理顧客諮詢及提供用藥指導\n• 維護藥房環境整潔與安全\n\n**我們提供：**\n• 穩定工作環境\n• 完整教育訓練\n• 良好的職涯發展機會\n• 完善的員工福利',
    company_name: '健康藥局',
    location: '台北市信義區',
    job_type: 'full_time',
    salary_min: 28000,
    salary_max: 35000,
    requirements: '具備藥學相關科系畢業或藥師助理證照\n\n良好的溝通能力及服務熱忱\n\n細心負責，能承受工作壓力\n\n有相關工作經驗者優先',
    salary_currency: 'TWD'
  },
  {
    title: '藥局兼職人員 - 新北板橋',
    description: '誠摯邀請對醫藥零售有興趣的朋友加入我們的行列！\n\n**工作時間：**\n• 週一至週五晚上 18:00-22:00\n• 週六下午 14:00-20:00\n• 彈性排班，可配合個人時間\n\n**工作內容：**\n• 協助顧客尋找產品及提供諮詢\n• 收銀結帳及商品陳列\n• 整理庫存與補貨\n• 基本環境清潔\n\n**適合人群：**\n• 大學生、研究生想賺取生活費\n• 想學習醫藥知識的社會新鮮人\n• 尋求兼職機會的退休人員',
    company_name: '安心藥局',
    location: '新北市板橋區',
    job_type: 'part_time',
    salary_min: 180,
    salary_max: 200,
    requirements: '對醫藥知識有興趣\n\n親切有禮貌，有服務熱忱\n\n能配合排班時間\n\n有零售或服務業經驗佳',
    salary_currency: 'TWD'
  },
  {
    title: '社區藥局藥師助理 - 台中市',
    description: '我們是位於台中市中心的老字號社區藥局，誠徵有經驗的藥師助理。\n\n**工作特色：**\n• 穩定上班時間（不需要輪班）\n• 小規模團隊，氣氛融洽\n• 老闆直接教學，累積實務經驗\n• 顧客關係長期且穩定\n\n**工作內容：**\n• 協助藥師調配處方箋\n• 建立顧客用藥檔案\n• 辦理慢性病連續處方箋\n• 提供健康諮詢與用藥指導\n• 管理藥品與醫療用品庫存\n\n**我們尋找：**\n具備藥學相關背景，願意在社區藥局深耕發展的人才。',
    company_name: '德安社區藥局',
    location: '台中市西屯區',
    job_type: 'full_time',
    salary_min: 30000,
    salary_max: 38000,
    requirements: '藥學系畢業或有藥師助理證照\n\n具備良好的溝通能力\n\n能獨立作業且細心負責\n\n社區藥局經驗 2 年以上優先',
    salary_currency: 'TWD'
  }
]

async function login(email, password) {
  console.log('正在登入...')
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(`登入失敗: ${data.message || JSON.stringify(data)}`)
  }

  console.log('✅ 登入成功')
  return data.data.tokens.accessToken
}

async function postJob(token, jobData) {
  console.log(`正在發布職缺: ${jobData.title}`)
  const response = await fetch(`${BASE_URL}/api/v1/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(jobData)
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(`發布失敗: ${data.message || data.error?.message || JSON.stringify(data)}`)
  }

  console.log(`✅ 發布成功 - ID: ${data.data.id}`)
  return data.data
}

async function main() {
  try {
    // 1. 登入獲取 token
    const token = await login(EMPLOYER_EMAIL, EMPLOYER_PASSWORD)

    // 2. 發布測試職缺
    console.log('\n開始發布測試職缺...\n')
    const results = []
    
    for (const jobData of TEST_JOBS) {
      try {
        const result = await postJob(token, jobData)
        results.push({ success: true, job: result })
        // 稍微延遲避免請求過快
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`❌ 發布失敗: ${error.message}`)
        results.push({ success: false, error: error.message })
      }
    }

    // 3. 顯示結果摘要
    console.log('\n=== 發布結果摘要 ===')
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    console.log(`成功: ${successCount} 個`)
    console.log(`失敗: ${failCount} 個`)

    if (successCount > 0) {
      console.log('\n✅ 職缺已成功發布！您可以在網頁上查看。')
      console.log(`網址: ${BASE_URL}/employer/jobs`)
    }

    if (failCount > 0) {
      console.log('\n❌ 部分職缺發布失敗，請檢查錯誤訊息。')
    }

  } catch (error) {
    console.error('\n❌ 執行失敗:', error.message)
    process.exit(1)
  }
}

main()

