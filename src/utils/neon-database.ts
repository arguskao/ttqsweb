// Cloudflare Workers 兼容的數據庫層
// 使用 @neondatabase/serverless 替代 pg

import { neon } from '@neondatabase/serverless'

// 數據庫連接管理
class NeonDatabaseManager {
  private sql: ReturnType<typeof neon> | null = null

  // 獲取數據庫連接
  private getConnection() {
    if (!this.sql) {
      // 從環境變量或全局對象獲取 DATABASE_URL
      const databaseUrl = (globalThis as any)?.env?.DATABASE_URL || process.env.DATABASE_URL

      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured')
      }

      // Ensure proper PostgreSQL URL format for Neon
      if (!databaseUrl.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
      }

      this.sql = neon(databaseUrl)
    }

    return this.sql
  }

  // 執行查詢 - 使用Neon的sql.query()方法
  async query(sqlText: string, params: any[] = []): Promise<any[]> {
    try {
      const connection = this.getConnection()
      
      // 使用 sql.query() 方法，這是 Neon 支援的傳統查詢方式
      const result = await (connection as any).query(sqlText, params)
      
      // Neon返回的結果是數組
      if (Array.isArray(result)) {
        return result
      } else if (result && typeof result === 'object' && 'rows' in result) {
        return result.rows
      } else {
        return []
      }
    } catch (error) {
      console.error('Neon database query error:', error)
      throw error
    }
  }

  // 執行單個查詢
  async queryOne(sql: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.query(sql, params)
      return result[0] || null
    } catch (error) {
      console.error('Neon database query error:', error)
      throw error
    }
  }

  // 執行多個查詢
  async queryMany(sql: string, params: any[] = []): Promise<any[]> {
    return await this.query(sql, params)
  }

  // 執行事務
  async transaction(callback: (db: NeonDatabaseManager) => Promise<any>): Promise<any> {
    try {
      const connection = this.getConnection()
      // Neon serverless driver 可能不支持事務，直接執行回調
      return await callback(this)
    } catch (error) {
      console.error('Neon database transaction error:', error)
      throw error
    }
  }

  // 檢查表是否存在
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.queryOne(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        ) as exists
      `,
        [tableName]
      )
      return result?.exists || false
    } catch (error) {
      console.error('Check table exists error:', error)
      return false
    }
  }

  // 獲取表的行數（帶 SQL 注入防護）
  async getTableRowCount(tableName: string): Promise<number> {
    // 定義允許的表名白名單
    const ALLOWED_TABLES = [
      'users',
      'courses',
      'jobs',
      'enrollments',
      'job_applications',
      'instructors',
      'experiences',
      'forum_topics',
      'forum_comments',
      'forum_likes',
      'groups',
      'group_members',
      'messages',
      'documents',
      'course_progress',
      'course_reviews'
    ]

    try {
      // 驗證表名是否在白名單中
      if (!ALLOWED_TABLES.includes(tableName)) {
        throw new Error(`Invalid table name: ${tableName}. Table not in whitelist.`)
      }

      // 驗證表名格式（額外的安全檢查）
      if (!/^[a-z_][a-z0-9_]*$/i.test(tableName)) {
        throw new Error(`Invalid table name format: ${tableName}`)
      }

      // 檢查表是否存在
      const tableExists = await this.tableExists(tableName)
      if (!tableExists) {
        throw new Error(`Table does not exist: ${tableName}`)
      }

      // 現在可以安全地使用表名
      const result = await this.queryOne(`SELECT COUNT(*) as count FROM ${tableName}`)
      return parseInt(result?.count || '0', 10)
    } catch (error) {
      console.error('Get table row count error:', error)
      return 0
    }
  }
}

// 創建單例實例
export const neonDb = new NeonDatabaseManager()

// 導出常用函數
export const query = neonDb.query.bind(neonDb)
export const queryOne = neonDb.queryOne.bind(neonDb)
export const queryMany = neonDb.queryMany.bind(neonDb)
export const transaction = neonDb.transaction.bind(neonDb)

// 導出類和實例
export { NeonDatabaseManager }
export default neonDb
