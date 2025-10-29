#!/usr/bin/env node

/**
 * 檢查特定用戶的講師申請狀態
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

async function checkUserStatus() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔍 檢查用戶狀態...\n')

    // 檢查用戶基本信息
    const user = await sql`
      SELECT id, email, user_type, first_name, last_name, created_at
      FROM users 
      WHERE email = 'wii543@gmail.com'
    `

    if (user.length === 0) {
      console.log('❌ 用戶不存在')
      return
    }

    console.log('👤 用戶信息:')
    console.log(`  ID: ${user[0].id}`)
    console.log(`  Email: ${user[0].email}`)
    console.log(`  用戶類型: ${user[0].user_type}`)
    console.log(`  姓名: ${user[0].first_name} ${user[0].last_name}`)
    console.log(`  註冊時間: ${user[0].created_at}`)

    // 檢查講師申請
    const applications = await sql`
      SELECT * FROM instructor_applications 
      WHERE user_id = ${user[0].id}
      ORDER BY created_at DESC
    `

    console.log(`\n📝 講師申請記錄 (${applications.length} 筆):`)
    applications.forEach((app, index) => {
      console.log(`  ${index + 1}. ID: ${app.id}`)
      console.log(`     狀態: ${app.status}`)
      console.log(`     提交時間: ${app.submitted_at}`)
      console.log(`     審核時間: ${app.reviewed_at || '未審核'}`)
      console.log(`     專業領域: ${app.specialization}`)
      console.log(`     工作經驗: ${app.years_of_experience} 年`)
      console.log(`     是否活躍: ${app.is_active}`)
      console.log('')
    })

    // 分析狀態
    console.log('📊 狀態分析:')
    if (user[0].user_type === 'instructor') {
      console.log('  ✅ 用戶已經是講師')
      
      const approvedApp = applications.find(app => app.status === 'approved')
      if (approvedApp) {
        console.log('  ✅ 有已批准的申請')
        console.log('  💡 用戶不需要再次申請，已經可以使用講師功能')
      } else {
        console.log('  ⚠️  用戶類型是講師但沒有已批准的申請記錄')
      }
    } else {
      console.log('  ❌ 用戶還不是講師')
      
      const pendingApp = applications.find(app => app.status === 'pending')
      if (pendingApp) {
        console.log('  ⏳ 有待審核的申請')
      } else {
        console.log('  💡 用戶可以提交新的講師申請')
      }
    }

  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
    process.exit(1)
  }
}

checkUserStatus()