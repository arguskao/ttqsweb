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

      this.sql = neon(databaseUrl)
    }

    return this.sql
  }

  // 執行查詢 - Neon 風格
  async query<T = any>(sqlTemplate: string, params: any[] = []): Promise<T[]> {
    try {
      const sql = this.getConnection()

      // 使用 Neon 的查詢方式
      if (params.length === 0) {
        return (await sql`${sqlTemplate}`) as T[]
      } else {
        // 對於帶參數的查詢，使用模板字符串
        const query = sqlTemplate.replace(/\$(\d+)/g, (match, index) => {
          const paramIndex = parseInt(index) - 1
          if (paramIndex < params.length) {
            return `'${params[paramIndex]}'`
          }
          return match
        })
        return (await sql`${query}`) as T[]
      }
    } catch (error) {
      console.error('Neon database query error:', error)
      throw error
    }
  }

  // 執行查詢並返回第一行
  async queryOne<T = any>(sqlTemplate: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sqlTemplate, params)
    return results.length > 0 ? (results[0] ?? null) : null
  }

  // 執行查詢並返回所有行
  async queryMany<T = any>(sqlTemplate: string, params: any[] = []): Promise<T[]> {
    return await this.query<T>(sqlTemplate, params)
  }

  // 事務處理（Neon 自動處理單連接事務）
  async transaction<T>(callback: (db: NeonDatabaseManager) => Promise<T>): Promise<T> {
    return await callback(this)
  }

  // 檢查表是否存在
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    )
    return result?.exists || false
  }

  // 獲取表行數
  async getTableRowCount(tableName: string): Promise<number> {
    const result = await this.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${tableName}`
    )
    return parseInt(result?.count || '0', 10)
  }
}

// 創建全局實例
export const neonDb = new NeonDatabaseManager()

// 兼容舊的 API 接口
export interface QueryOptions {
  text: string
  values?: unknown[]
}

// 包裝函數以兼容舊的 API
export const query = async (options: QueryOptions): Promise<{ rows: any[]; rowCount: number }> => {
  const { text, values = [] } = options
  const rows = await neonDb.query(text, values)
  return { rows, rowCount: rows.length }
}

export const queryOne = async <T>(options: QueryOptions): Promise<T | null> => {
  const { text, values = [] } = options
  return await neonDb.queryOne<T>(text, values)
}

export const queryMany = async <T>(options: QueryOptions): Promise<T[]> => {
  const { text, values = [] } = options
  return await neonDb.queryMany<T>(text, values)
}

export const transaction = async <T>(callback: (db: any) => Promise<T>): Promise<T> => {
  return await neonDb.transaction(callback)
}

// 兼容性導出
export const db = {
  query: async (options: QueryOptions) => query(options),
  queryOne: async <T>(options: QueryOptions) => queryOne<T>(options),
  queryMany: async <T>(options: QueryOptions) => queryMany<T>(options),
  transaction: async <T>(callback: (db: any) => Promise<T>) => transaction(callback),
  tableExists: (tableName: string) => neonDb.tableExists(tableName),
  getTableRowCount: (tableName: string) => neonDb.getTableRowCount(tableName)
}

export default neonDb
