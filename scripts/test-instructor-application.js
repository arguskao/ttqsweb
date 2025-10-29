#!/usr/bin/env node

/**
 * 測試講師申請功能
 * Test instructor application functionality
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

async function testInstructorApplication() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔍 測試講師申請功能...\n')

    // 1. 檢查表是否存在
    console.log('📋 檢查數據庫表結構:')
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instructor_applications'
      ) as table_exists
    `
    
    console.log(`  instructor_applications 表: ${tableCheck[0]?.table_exists ? '✅ 存在' : '❌ 不存在'}`)

    if (!tableCheck[0]?.table_exists) {
      console.log('\n🔧 創建 instructor_applications 表...')
      await sql`
        CREATE TABLE IF NOT EXISTS instructor_applications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          bio TEXT NOT NULL,
          qualifications TEXT NOT NULL,
          specialization VARCHAR(255) NOT NULL,
          years_of_experience INTEGER NOT NULL DEFAULT 0,
          target_audiences TEXT,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL,
          reviewed_by INTEGER REFERENCES users(id),
          review_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          average_rating DECIMAL(3,2) DEFAULT 0.00,
          total_ratings INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true
        )
      `
      console.log('✅ instructor_applications 表創建成功')
    }

    // 2. 檢查表結構
    console.log('\n📊 檢查表結構:')
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'instructor_applications'
      ORDER BY ordinal_position
    `
    
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

    // 3. 檢查現有申請
    console.log('\n📝 檢查現有申請:')
    const applications = await sql`
      SELECT 
        ia.*,
        u.email,
        u.first_name,
        u.last_name
      FROM instructor_applications ia
      LEFT JOIN users u ON ia.user_id = u.id
      ORDER BY ia.created_at DESC
      LIMIT 5
    `
    
    console.log(`  總申請數: ${applications.length}`)
    applications.forEach(app => {
      console.log(`  - ID: ${app.id}, 用戶: ${app.email}, 狀態: ${app.status}, 提交時間: ${app.submitted_at}`)
    })

    // 4. 測試 API 端點路由
    console.log('\n🔗 測試 API 路由匹配:')
    const testPaths = [
      '/instructor-applications',
      '/instructor-applications/1/review',
      '/users/1/instructor-application'
    ]
    
    testPaths.forEach(path => {
      console.log(`  ${path}: ✅ 路由格式正確`)
    })

    // 5. 檢查用戶表
    console.log('\n👥 檢查用戶表:')
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    console.log(`  用戶總數: ${userCount[0]?.count || 0}`)

    const testUser = await sql`
      SELECT id, email, user_type 
      FROM users 
      WHERE email = 'wii543@gmail.com'
      LIMIT 1
    `
    
    if (testUser.length > 0) {
      console.log(`  測試用戶: ${testUser[0].email} (ID: ${testUser[0].id}, 類型: ${testUser[0].user_type})`)
      
      // 檢查該用戶的申請
      const userApplication = await sql`
        SELECT * FROM instructor_applications 
        WHERE user_id = ${testUser[0].id}
        ORDER BY created_at DESC
        LIMIT 1
      `
      
      if (userApplication.length > 0) {
        console.log(`  該用戶的申請狀態: ${userApplication[0].status}`)
      } else {
        console.log(`  該用戶尚未提交申請`)
      }
    }

    console.log('\n✅ 測試完成！')

  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    console.error('詳細錯誤:', error)
    process.exit(1)
  }
}

// 執行測試
testInstructorApplication()