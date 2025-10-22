
/**
 * 測試數據庫初始化腳本
 * 用於設置測試環境的數據庫和測試數據
 */

import { neon } from '@neondatabase/serverless'

// 檢查是否在測試環境
if (process.env.NODE_ENV !== 'test') {
  console.log('⚠️  此腳本僅用於測試環境')
  process.exit(1)
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'

async function setupTestDatabase() {
  console.log('🚀 開始設置測試數據庫...')

  try {
    // 使用Neon serverless連接
    const sql = neon(DATABASE_URL)

    // 創建表
    console.log('📋 創建測試表...')
    await sql`
      -- 創建用戶表
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('job_seeker', 'employer')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 創建課程表
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        course_type VARCHAR(100) NOT NULL,
        duration_hours INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        instructor_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 創建講師表
      CREATE TABLE IF NOT EXISTS instructors (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        specialization VARCHAR(100),
        experience_years INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 創建職缺表
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        salary VARCHAR(100),
        description TEXT,
        requirements TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 創建文件表
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        category VARCHAR(100),
        is_public BOOLEAN DEFAULT true,
        uploaded_by INTEGER REFERENCES users(id),
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    // 插入測試數據
    console.log('📊 插入測試數據...')
    await sql`
      -- 插入測試用戶
      INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone) VALUES
      ('test@example.com', '$2b$10$mockhash', 'job_seeker', 'Test', 'User', '0912345678'),
      ('employer@example.com', '$2b$10$mockhash', 'employer', 'Employer', 'User', '0987654321'),
      ('instructor@example.com', '$2b$10$mockhash', 'job_seeker', 'Instructor', 'User', '0911111111')
      ON CONFLICT (email) DO NOTHING;

      -- 插入測試講師
      INSERT INTO instructors (first_name, last_name, email, phone, specialization, experience_years) VALUES
      ('張', '老師', 'instructor@example.com', '0912345678', '藥學', 10),
      ('李', '教授', 'professor@example.com', '0987654321', '藥劑學', 15)
      ON CONFLICT (email) DO NOTHING;

      -- 插入測試課程
      INSERT INTO courses (title, description, course_type, duration_hours, price, instructor_id) VALUES
      ('藥學入門', '基礎藥學知識課程', '基礎課程', 40, 5000.00, 1),
      ('藥劑學進階', '進階藥劑學課程', '進階課程', 60, 8000.00, 2),
      ('藥品管理', '藥品管理實務課程', '實務課程', 30, 4000.00, 1)
      ON CONFLICT DO NOTHING;

      -- 插入測試職缺
      INSERT INTO jobs (title, company, location, salary, description, requirements) VALUES
      ('藥局助理', '測試藥局', '台北市', '30000-35000', '協助藥師處理藥品相關事務', '具備基本藥學知識'),
      ('藥師', '大型連鎖藥局', '新北市', '50000-60000', '負責藥品調劑和諮詢服務', '具備藥師執照'),
      ('藥品業務', '製藥公司', '台中市', '40000-50000', '負責藥品銷售和客戶服務', '具備業務經驗')
      ON CONFLICT DO NOTHING;

      -- 插入測試文件
      INSERT INTO documents (title, description, file_url, file_type, file_size, category, uploaded_by) VALUES
      ('測試文件', '這是一個測試文件', 'https://example.com/test.pdf', 'application/pdf', 1024, 'course', 1),
      ('藥學手冊', '藥學基礎知識手冊', 'https://example.com/handbook.pdf', 'application/pdf', 2048, 'reference', 1),
      ('課程大綱', '課程詳細大綱', 'https://example.com/syllabus.pdf', 'application/pdf', 512, 'course', 2)
      ON CONFLICT DO NOTHING;
    `

    console.log('✅ 測試數據庫設置完成！')

    // 驗證數據
    const userCount = await sql`SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com'`
    const courseCount = await sql`SELECT COUNT(*) FROM courses`
    const jobCount = await sql`SELECT COUNT(*) FROM jobs`
    const instructorCount = await sql`SELECT COUNT(*) FROM instructors`
    const documentCount = await sql`SELECT COUNT(*) FROM documents`

    console.log('📈 測試數據統計:')
    console.log(`   - 用戶: ${userCount[0].count}`)
    console.log(`   - 課程: ${courseCount[0].count}`)
    console.log(`   - 職缺: ${jobCount[0].count}`)
    console.log(`   - 講師: ${instructorCount[0].count}`)
    console.log(`   - 文件: ${documentCount[0].count}`)

  } catch (error) {
    console.error('❌ 測試數據庫設置失敗:', error)
    process.exit(1)
  }
}

async function cleanupTestDatabase() {
  console.log('🧹 清理測試數據庫...')

  try {
    const sql = neon(DATABASE_URL)

    await sql`
      DELETE FROM documents WHERE uploaded_by IN (SELECT id FROM users WHERE email LIKE '%@example.com');
      DELETE FROM courses WHERE instructor_id IN (SELECT id FROM instructors WHERE email LIKE '%@example.com');
      DELETE FROM jobs WHERE company LIKE '%測試%' OR company LIKE '%大型連鎖%' OR company LIKE '%製藥%';
      DELETE FROM instructors WHERE email LIKE '%@example.com';
      DELETE FROM users WHERE email LIKE '%@example.com';
    `

    console.log('✅ 測試數據庫清理完成！')
  } catch (error) {
    console.error('❌ 測試數據庫清理失敗:', error)
    process.exit(1)
  }
}

// 命令行參數處理
const command = process.argv[2]

if (command === 'cleanup') {
  cleanupTestDatabase()
} else {
  setupTestDatabase()
}

