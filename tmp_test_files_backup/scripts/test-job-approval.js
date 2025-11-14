/**
 * 測試工作審核功能
 */

// 使用內建的 fetch (Node.js 18+)
const BASE_URL = 'https://05ab54e2.pharmacy-assistant-academy.pages.dev'

async function testJobApproval() {
  console.log('🚀 開始測試工作審核功能\n')

  try {
    // 步驟 1: 登入雇主帳號
    console.log('=== 1. 登入雇主帳號 ===')
    const employerLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cats8727+002@gmail.com',
        password: 'cats8727+002@gmail.com'
      })
    })

    if (employerLogin.status !== 200) {
      console.error(`❌ 登入失敗，HTTP ${employerLogin.status}`)
      const text = await employerLogin.text()
      console.error(`響應: ${text.substring(0, 200)}`)
      return
    }

    const employerData = await employerLogin.json()
    if (!employerData.success || !employerData.data?.tokens?.accessToken) {
      console.error('❌ 登入失敗:', employerData)
      return
    }

    const employerToken = employerData.data.tokens.accessToken
    console.log('✅ 雇主登入成功')
    console.log(`   Token: ${employerToken.substring(0, 50)}...\n`)

    // 步驟 2: 發布測試工作
    console.log('=== 2. 發布測試工作 ===')
    const createJob = await fetch(`${BASE_URL}/api/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employerToken}`
      },
      body: JSON.stringify({
        title: '測試工作職缺 - 藥局助理（審核測試）',
        description: '這是一個測試工作職缺，用於測試審核功能。工作內容包括協助藥師處理處方箋、管理庫存、提供顧客服務等。',
        location: '台北市信義區信義路五段7號',
        job_type: 'full_time',
        salary_min: 30000,
        salary_max: 35000,
        requirements: '藥局工作經驗優先，細心負責，良好溝通能力'
      })
    })

    if (createJob.status !== 200) {
      console.error(`❌ 發布工作失敗，HTTP ${createJob.status}`)
      const text = await createJob.text()
      console.error(`響應: ${text.substring(0, 300)}`)
      return
    }

    const jobData = await createJob.json()
    if (!jobData.success || !jobData.data?.id) {
      console.error('❌ 發布工作失敗:', jobData)
      return
    }

    const jobId = jobData.data.id
    const approvalStatus = jobData.data.approval_status || jobData.data.approvalStatus
    console.log('✅ 工作發布成功')
    console.log(`   工作 ID: ${jobId}`)
    console.log(`   標題: ${jobData.data.title}`)
    console.log(`   審核狀態: ${approvalStatus || '未知'}\n`)

    // 步驟 3: 登入管理員帳號
    console.log('=== 3. 登入管理員帳號 ===')
    const adminLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ttqs.com',
        password: 'admin@ttqs.com'
      })
    })

    if (adminLogin.status !== 200) {
      console.error(`❌ 管理員登入失敗，HTTP ${adminLogin.status}`)
      return
    }

    const adminData = await adminLogin.json()
    if (!adminData.success || !adminData.data?.tokens?.accessToken) {
      console.error('❌ 管理員登入失敗:', adminData)
      return
    }

    const adminToken = adminData.data.tokens.accessToken
    console.log('✅ 管理員登入成功\n')

    // 步驟 4: 查看待審核工作
    console.log('=== 4. 查看待審核工作 ===')
    const pendingJobs = await fetch(`${BASE_URL}/api/v1/jobs/pending-approval?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    })

    if (pendingJobs.status === 200) {
      const pendingData = await pendingJobs.json()
      if (pendingData.success && pendingData.data) {
        console.log(`✅ 找到 ${pendingData.data.length || 0} 個待審核工作`)
        if (pendingData.data.length > 0) {
          pendingData.data.slice(0, 3).forEach((job, idx) => {
            console.log(`   ${idx + 1}. ID: ${job.id}, 標題: ${job.title}, 狀態: ${job.approval_status || 'pending'}`)
          })
        }
      } else {
        console.log('⚠️  沒有待審核的工作')
      }
    } else {
      console.error(`❌ 查詢待審核工作失敗，HTTP ${pendingJobs.status}`)
    }
    console.log('')

    // 步驟 5: 審核通過工作
    if (jobId) {
      console.log(`=== 5. 審核通過工作 ID: ${jobId} ===`)
      const approveJob = await fetch(`${BASE_URL}/api/v1/jobs/${jobId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: 'approved',
          review_notes: '測試審核：工作內容完整，符合要求，已審核通過'
        })
      })

      if (approveJob.status === 200) {
        const approveData = await approveJob.json()
        if (approveData.success) {
          console.log('✅ 工作審核通過成功')
          console.log(`   審核狀態: ${approveData.data?.approval_status || approveData.data?.approvalStatus}`)
          console.log(`   審核備註: ${approveData.data?.review_notes || '無'}\n`)
        } else {
          console.error('❌ 審核失敗:', approveData)
        }
      } else {
        console.error(`❌ 審核失敗，HTTP ${approveJob.status}`)
        const text = await approveJob.text()
        console.error(`響應: ${text.substring(0, 300)}`)
      }
    }

    // 步驟 6: 驗證公開查詢（應只顯示已審核通過的）
    console.log('=== 6. 驗證公開查詢（應只顯示已審核通過的） ===')
    const publicJobs = await fetch(`${BASE_URL}/api/v1/jobs?page=1&limit=5`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (publicJobs.status === 200) {
      const publicData = await publicJobs.json()
      if (publicData.success && publicData.data) {
        console.log(`✅ 找到 ${publicData.data.length || 0} 個公開工作`)
        if (publicData.data.length > 0) {
          publicData.data.slice(0, 3).forEach((job, idx) => {
            const status = job.approval_status || job.approvalStatus || 'approved'
            console.log(`   ${idx + 1}. ID: ${job.id}, 標題: ${job.title}, 狀態: ${status}`)
          })
        }
      }
    } else {
      console.error(`❌ 公開查詢失敗，HTTP ${publicJobs.status}`)
    }

    console.log('\n🎉 測試完成！')

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message)
    console.error(error.stack)
  }
}

// 執行測試
testJobApproval().catch(console.error)

