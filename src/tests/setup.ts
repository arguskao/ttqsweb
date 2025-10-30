import { config } from 'vitest/config'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/vue'
import { vi } from 'vitest'
import { neon } from '@neondatabase/serverless'

// 使用Neon雲端數據庫進行測試
const NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

// 測試數據庫設置
const setupTestDatabase = async () => {
  try {
    const sql = neon(NEON_DATABASE_URL)

    // 清理現有表
    console.log('🧹 清理現有表...')
    await sql`DROP TABLE IF EXISTS documents CASCADE`
    await sql`DROP TABLE IF EXISTS courses CASCADE`
    await sql`DROP TABLE IF EXISTS jobs CASCADE`
    await sql`DROP TABLE IF EXISTS instructors CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // 創建表
    console.log('📋 創建測試表...')

    // 創建用戶表
    await sql`
      CREATE TABLE users (
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
      )
    `

    // 創建課程表
    await sql`
      CREATE TABLE courses (
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
      )
    `

    // 創建講師表
    await sql`
      CREATE TABLE instructors (
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
      )
    `

    // 創建職缺表
    await sql`
      CREATE TABLE jobs (
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
      )
    `

    // 創建文件表
    await sql`
      CREATE TABLE documents (
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
      )
    `

    // 插入測試數據
    console.log('📊 插入測試數據...')

    // 插入測試用戶
    await sql`
      INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone) VALUES
      ('test@example.com', '$2b$10$mockhash', 'job_seeker', 'Test', 'User', '0912345678'),
      ('employer@example.com', '$2b$10$mockhash', 'employer', 'Employer', 'User', '0987654321'),
      ('instructor@example.com', '$2b$10$mockhash', 'job_seeker', 'Instructor', 'User', '0911111111')
    `

    // 插入測試講師
    await sql`
      -- 測試講師將通過 instructor_applications 表創建
      -- 這裡不直接插入 instructors 表，因為該表已不存在
    `

    // 插入測試課程
    await sql`
      INSERT INTO courses (title, description, course_type, duration_hours, price, instructor_id) VALUES
      ('藥學入門', '基礎藥學知識課程', '基礎課程', 40, 5000.00, 1),
      ('藥劑學進階', '進階藥劑學課程', '進階課程', 60, 8000.00, 2),
      ('藥品管理', '藥品管理實務課程', '實務課程', 30, 4000.00, 1)
    `

    // 插入測試職缺
    await sql`
      INSERT INTO jobs (title, company, location, salary, description, requirements) VALUES
      ('藥局助理', '測試藥局', '台北市', '30000-35000', '協助藥師處理藥品相關事務', '具備基本藥學知識'),
      ('藥師', '大型連鎖藥局', '新北市', '50000-60000', '負責藥品調劑和諮詢服務', '具備藥師執照'),
      ('藥品業務', '製藥公司', '台中市', '40000-50000', '負責藥品銷售和客戶服務', '具備業務經驗')
    `

    // 插入測試文件
    await sql`
      INSERT INTO documents (title, description, file_url, file_type, file_size, category, uploaded_by) VALUES
      ('測試文件', '這是一個測試文件', 'https://example.com/test.pdf', 'application/pdf', 1024, 'course', 1),
      ('藥學手冊', '藥學基礎知識手冊', 'https://example.com/handbook.pdf', 'application/pdf', 2048, 'reference', 1),
      ('課程大綱', '課程詳細大綱', 'https://example.com/syllabus.pdf', 'application/pdf', 512, 'course', 2)
    `

    console.log('✅ Neon測試數據庫設置完成')
  } catch (error) {
    console.warn('⚠️  Neon測試數據庫設置失敗:', error.message)
  }
}

// 清理測試數據
const cleanupTestDatabase = async () => {
  try {
    const sql = neon(NEON_DATABASE_URL)

    await sql`
      DELETE FROM documents WHERE uploaded_by IN (SELECT id FROM users WHERE email LIKE '%@example.com');
      DELETE FROM courses WHERE instructor_id IN (SELECT u.id FROM instructor_applications ia JOIN users u ON ia.user_id = u.id WHERE u.email LIKE '%@example.com');
      DELETE FROM jobs WHERE company LIKE '%測試%' OR company LIKE '%大型連鎖%' OR company LIKE '%製藥%';
      DELETE FROM instructor_applications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
      DELETE FROM users WHERE email LIKE '%@example.com';
    `

    console.log('✅ Neon測試數據庫清理完成')
  } catch (error) {
    console.warn('⚠️  Neon測試數據庫清理失敗:', error.message)
  }
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    length: 0,
    key: vi.fn()
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    length: 0,
    key: vi.fn()
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock fetch
global.fetch = vi.fn()

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Global test setup
beforeAll(async () => {
  // Set up any global test configuration
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = NEON_DATABASE_URL
  process.env.JWT_SECRET = 'test-secret'

  // Setup Neon test database
  await setupTestDatabase()
})

// Global test teardown
afterAll(async () => {
  // Clean up test data
  await cleanupTestDatabase()
})
