import { neon } from '@neondatabase/serverless'
import { getDatabasePool } from '@/config/database'

// 測試數據庫設置
export class TestDatabaseSetup {
  private sql: ReturnType<typeof neon> | null = null
  private pool: any = null

  constructor() {
    // 根據環境選擇數據庫連接方式
    if (process.env.NODE_ENV === 'test') {
      // 使用Neon serverless for testing
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
      this.sql = neon(databaseUrl)
    } else {
      // 使用傳統連接池
      this.pool = getDatabasePool()
    }
  }

  // 創建測試表
  async createTables(): Promise<void> {
    const createTablesSQL = `
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

    if (this.sql) {
      await this.sql`${createTablesSQL}`
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        await client.query(createTablesSQL)
      } finally {
        client.release()
      }
    }
  }

  // 插入測試數據
  async insertTestData(): Promise<void> {
    const testDataSQL = `
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

    if (this.sql) {
      await this.sql`${testDataSQL}`
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        await client.query(testDataSQL)
      } finally {
        client.release()
      }
    }
  }

  // 清理測試數據
  async cleanupTestData(): Promise<void> {
    const cleanupSQL = `
      DELETE FROM documents WHERE uploaded_by IN (SELECT id FROM users WHERE email LIKE '%@example.com');
      DELETE FROM courses WHERE instructor_id IN (SELECT id FROM instructors WHERE email LIKE '%@example.com');
      DELETE FROM jobs WHERE company LIKE '%測試%' OR company LIKE '%大型連鎖%' OR company LIKE '%製藥%';
      DELETE FROM instructors WHERE email LIKE '%@example.com';
      DELETE FROM users WHERE email LIKE '%@example.com';
    `

    if (this.sql) {
      await this.sql`${cleanupSQL}`
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        await client.query(cleanupSQL)
      } finally {
        client.release()
      }
    }
  }

  // 重置測試數據庫
  async resetTestDatabase(): Promise<void> {
    await this.cleanupTestData()
    await this.insertTestData()
  }

  // 獲取測試用戶
  async getTestUser(email: string = 'test@example.com'): Promise<any> {
    const querySQL = `SELECT * FROM users WHERE email = $1`
    
    if (this.sql) {
      const result = await this.sql`SELECT * FROM users WHERE email = ${email}`
      return result[0] || null
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(querySQL, [email])
        return result.rows[0] || null
      } finally {
        client.release()
      }
    }
    return null
  }

  // 獲取測試課程
  async getTestCourses(): Promise<any[]> {
    const querySQL = `SELECT * FROM courses WHERE is_active = true ORDER BY id`
    
    if (this.sql) {
      return await this.sql`SELECT * FROM courses WHERE is_active = true ORDER BY id`
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(querySQL)
        return result.rows
      } finally {
        client.release()
      }
    }
    return []
  }

  // 獲取測試職缺
  async getTestJobs(): Promise<any[]> {
    const querySQL = `SELECT * FROM jobs WHERE is_active = true ORDER BY id`
    
    if (this.sql) {
      return await this.sql`SELECT * FROM jobs WHERE is_active = true ORDER BY id`
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(querySQL)
        return result.rows
      } finally {
        client.release()
      }
    }
    return []
  }

  // 獲取測試講師
  async getTestInstructors(): Promise<any[]> {
    const querySQL = `SELECT * FROM instructors WHERE is_active = true ORDER BY id`
    
    if (this.sql) {
      return await this.sql`SELECT * FROM instructors WHERE is_active = true ORDER BY id`
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(querySQL)
        return result.rows
      } finally {
        client.release()
      }
    }
    return []
  }

  // 獲取測試文件
  async getTestDocuments(): Promise<any[]> {
    const querySQL = `SELECT * FROM documents ORDER BY id`
    
    if (this.sql) {
      return await this.sql`SELECT * FROM documents ORDER BY id`
    } else if (this.pool) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(querySQL)
        return result.rows
      } finally {
        client.release()
      }
    }
    return []
  }
}

// 導出單例實例
export const testDatabaseSetup = new TestDatabaseSetup()


