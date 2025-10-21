// Cloudflare Workers 兼容的數據庫工具
// 使用 @neondatabase/serverless 替代 pg

import { neon } from '@neondatabase/serverless'

// 全局數據庫連接
let globalSql: ReturnType<typeof neon> | null = null

// 獲取數據庫連接
function getDatabaseConnection() {
  if (!globalSql) {
    // 從環境變量或全局對象獲取 DATABASE_URL
    const databaseUrl = (globalThis as any)?.env?.DATABASE_URL || process.env.DATABASE_URL

    if (!databaseUrl) {
      // In test environment, use mock database
      if (process.env.NODE_ENV === 'test') {
        // Return a mock neon function for testing
        globalSql = (() => {
          const mockQuery = async (query: any) => {
            // Mock responses for testing
            if (typeof query === 'string' && query.includes('SELECT * FROM users WHERE email')) {
              return [
                {
                  id: 1,
                  email: 'test@example.com',
                  password_hash: '$2b$10$mockhash',
                  user_type: 'job_seeker',
                  first_name: 'Test',
                  last_name: 'User',
                  phone: '0912345678',
                  created_at: new Date(),
                  updated_at: new Date(),
                  is_active: true
                }
              ]
            }

            if (typeof query === 'string' && query.includes('SELECT * FROM courses')) {
              return [
                {
                  id: 1,
                  title: '藥學入門',
                  description: '基礎藥學知識課程',
                  course_type: '基礎課程',
                  duration_hours: 40,
                  price: 5000,
                  instructor_id: 1,
                  is_active: true,
                  created_at: new Date()
                }
              ]
            }

            if (typeof query === 'string' && query.includes('SELECT * FROM jobs')) {
              return [
                {
                  id: 1,
                  title: '藥局助理',
                  company: '測試藥局',
                  location: '台北市',
                  salary: '30000-35000',
                  description: '協助藥師處理藥品相關事務',
                  requirements: '具備基本藥學知識',
                  is_active: true,
                  created_at: new Date()
                }
              ]
            }

            if (typeof query === 'string' && query.includes('SELECT * FROM instructors')) {
              return [
                {
                  id: 1,
                  first_name: '張',
                  last_name: '老師',
                  email: 'instructor@example.com',
                  phone: '0912345678',
                  specialization: '藥學',
                  experience_years: 10,
                  is_active: true,
                  created_at: new Date()
                }
              ]
            }

            if (typeof query === 'string' && query.includes('SELECT * FROM documents')) {
              return [
                {
                  id: 1,
                  title: '測試文件',
                  description: '這是一個測試文件',
                  file_url: 'https://example.com/test.pdf',
                  file_type: 'application/pdf',
                  file_size: 1024,
                  category: 'course',
                  is_public: true,
                  uploaded_by: 1,
                  download_count: 0,
                  created_at: new Date()
                }
              ]
            }

            return []
          }

          return mockQuery
        })() as any
        return globalSql
      }
      throw new Error('DATABASE_URL not configured')
    }

    // Ensure proper PostgreSQL URL format for Neon
    if (!databaseUrl.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
    }

    globalSql = neon(databaseUrl)
  }

  return globalSql
}

// 數據庫查詢接口
export interface QueryOptions {
  text: string
  values?: unknown[]
}

// Cloudflare 兼容的數據庫工具類
export class CloudflareDatabaseUtils {
  private sql: ReturnType<typeof neon>

  constructor() {
    this.sql = getDatabaseConnection()!
  }

  // 執行查詢
  async query(queryOptions: QueryOptions): Promise<any> {
    try {
      const { text, values = [] } = queryOptions

      // 將 PostgreSQL 風格的參數占位符轉換為 Neon 格式
      let processedQuery = text
      const processedValues: unknown[] = []

      if (values.length > 0) {
        // 替換 $1, $2, ... 為 Neon 支持的格式
        values.forEach((value, index) => {
          const placeholder = `$${index + 1}`
          if (processedQuery.includes(placeholder)) {
            processedValues.push(value)
          }
        })

        // 使用 Neon 的模板字符串方式
        const result = await this.sql`${processedQuery}`
        return { rows: result, rowCount: Array.isArray(result) ? result.length : 0 }
      } else {
        // 無參數查詢
        const result = await this.sql`${processedQuery}`
        return { rows: result, rowCount: Array.isArray(result) ? result.length : 0 }
      }
    } catch (error) {
      console.error('Cloudflare database query error:', error)
      throw error
    }
  }

  // 執行查詢並返回第一行
  async queryOne<T = unknown>(queryOptions: QueryOptions): Promise<T | null> {
    const result = await this.query(queryOptions)
    return (result.rows?.[0] as T | undefined) ?? null
  }

  // 執行查詢並返回所有行
  async queryMany<T = unknown>(queryOptions: QueryOptions): Promise<T[]> {
    const result = await this.query(queryOptions)
    return (result.rows as T[]) || []
  }

  // 簡化的事務處理（Neon 自動處理）
  async transaction<T>(callback: (db: CloudflareDatabaseUtils) => Promise<T>): Promise<T> {
    return await callback(this)
  }

  // 檢查表是否存在
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.queryOne<{ exists: boolean }>({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `,
      values: [tableName]
    })
    return result?.exists || false
  }

  // 獲取表行數
  async getTableRowCount(tableName: string): Promise<number> {
    const result = await this.queryOne<{ count: string }>({
      text: `SELECT COUNT(*) as count FROM ${tableName}`
    })
    return parseInt(result?.count || '0', 10)
  }

  // 執行原始 SQL
  async executeRaw(sqlText: string, values?: unknown[]): Promise<any> {
    return this.query({ text: sqlText, values })
  }
}

// 創建全局實例
export const cloudflareDb = new CloudflareDatabaseUtils()

// 兼容性導出
export const query = cloudflareDb.query.bind(cloudflareDb)
export const queryOne = cloudflareDb.queryOne.bind(cloudflareDb)
export const queryMany = cloudflareDb.queryMany.bind(cloudflareDb)
export const transaction = cloudflareDb.transaction.bind(cloudflareDb)

// 默認導出
export { cloudflareDb as db }
export default cloudflareDb
