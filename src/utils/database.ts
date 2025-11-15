import { Pool, type PoolClient } from 'pg'

import { getDatabasePool } from '../config/database'

// Database query interface
export interface QueryOptions {
  text: string
  values?: unknown[]
}

// Database transaction interface
export type TransactionCallback<T> = (client: PoolClient) => Promise<T>

// Database utility class
export class DatabaseUtils {
  private readonly pool: Pool

  constructor() {
    this.pool = getDatabasePool()
  }

  // Execute a single query
  async query(queryOptions: QueryOptions): Promise<any> {
    const client = await this.pool.connect()
    try {
      return await client.query(queryOptions.text, queryOptions.values)
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // Execute a query and return the first row
  async queryOne<T = unknown>(queryOptions: QueryOptions): Promise<T | null> {
    const result = await this.query(queryOptions)
    return (result.rows?.[0] as T | undefined) ?? null
  }

  // Execute a query and return all rows
  async queryMany<T = unknown>(queryOptions: QueryOptions): Promise<T[]> {
    const result = await this.query(queryOptions)
    return (result.rows as T[]) ?? []
  }

  // Execute multiple queries in a transaction
  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Database transaction error:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // Check if a table exists
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

  // Get table row count (with SQL injection protection)
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

    // 驗證表名是否在白名單中
    if (!ALLOWED_TABLES.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}. Table not in whitelist.`)
    }

    // 驗證表名格式（額外的安全檢查）
    if (!/^[a-z_][a-z0-9_]*$/i.test(tableName)) {
      throw new Error(`Invalid table name format: ${tableName}`)
    }

    // 使用參數化查詢檢查表是否存在
    const tableExists = await this.tableExists(tableName)
    if (!tableExists) {
      throw new Error(`Table does not exist: ${tableName}`)
    }

    // 現在可以安全地使用表名（已通過白名單和格式驗證）
    const result = await this.queryOne<{ count: string }>({
      text: `SELECT COUNT(*) as count FROM ${tableName}`
    })
    return parseInt(result?.count || '0', 10)
  }

  // Execute raw SQL (use with caution)
  async executeRaw(sql: string, values?: unknown[]): Promise<any> {
    return this.query({ text: sql, values })
  }
}

// Create singleton instance
export const db = new DatabaseUtils()

// Export commonly used functions
export const query = db.query.bind(db)
export const queryOne = db.queryOne.bind(db)
export const queryMany = db.queryMany.bind(db)
export const transaction = db.transaction.bind(db)
