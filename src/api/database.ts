import {
  neonDb as db,
  query as rawQuery,
  queryOne as rawQueryOne,
  queryMany as rawQueryMany
} from '../utils/neon-database'

import { DatabaseError } from './errors'
import type { PaginationOptions, PaginatedResult } from './types'

// Base repository class with common CRUD operations
export abstract class BaseRepository<T> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  // Find by ID
  async findById(id: number): Promise<T | null> {
    try {
      return await db.queryOne(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id])
    } catch (error) {
      throw new DatabaseError(`查詢 ${this.tableName} 失敗`)
    }
  }

  // Find all with optional conditions
  async findAll(conditions?: Record<string, unknown>): Promise<T[]> {
    try {
      let query = `SELECT * FROM ${this.tableName}`
      const values: unknown[] = []

      if (conditions && Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(' AND ')
        query += ` WHERE ${whereClause}`
        values.push(...Object.values(conditions))
      }

      return await db.queryMany(query, values)
    } catch (error) {
      throw new DatabaseError(`查詢 ${this.tableName} 列表失敗`)
    }
  }

  // Find with pagination
  async findPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'DESC' } = options

    const offset = (page - 1) * limit

    try {
      // Get total count
      const countResult = await db.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName}`)
      const total = parseInt(countResult?.count || '0', 10)

      // Get paginated data
      const data = await db.queryMany(
        `
          SELECT * FROM ${this.tableName}
          ORDER BY ${sortBy} ${sortOrder}
          LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      )

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new DatabaseError(`分頁查詢 ${this.tableName} 失敗`)
    }
  }

  // Create new record
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ')
      const columns = keys.join(', ')

      const result = await db.queryOne(
        `
          INSERT INTO ${this.tableName} (${columns})
          VALUES (${placeholders})
          RETURNING *
        `,
        values
      )

      if (!result) {
        throw new Error('創建記錄失敗')
      }

      return result
    } catch (error) {
      throw new DatabaseError(`創建 ${this.tableName} 記錄失敗`)
    }
  }

  // Update record by ID
  async update(id: number, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T | null> {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)

      if (keys.length === 0) {
        return await this.findById(id)
      }

      const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')

      return await db.queryOne(
        `
          UPDATE ${this.tableName}
          SET ${setClause}
          WHERE id = $1
          RETURNING *
        `,
        [id, ...values]
      )
    } catch (error) {
      throw new DatabaseError(`更新 ${this.tableName} 記錄失敗`)
    }
  }

  // Delete record by ID
  async delete(id: number): Promise<boolean> {
    try {
      const result = await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id])

      return result.length > 0
    } catch (error) {
      throw new DatabaseError(`刪除 ${this.tableName} 記錄失敗`)
    }
  }

  // Check if record exists
  async exists(id: number): Promise<boolean> {
    try {
      const result = await db.queryOne(
        `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
        [id]
      )
      return result?.exists || false
    } catch (error) {
      throw new DatabaseError(`檢查 ${this.tableName} 記錄存在性失敗`)
    }
  }

  // Count records with optional conditions
  async count(conditions?: Record<string, unknown>): Promise<number> {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`
      const values: unknown[] = []

      if (conditions && Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(' AND ')
        query += ` WHERE ${whereClause}`
        values.push(...Object.values(conditions))
      }

      const result = await db.queryOne(query, values)
      return parseInt(result?.count || '0', 10)
    } catch (error) {
      throw new DatabaseError(`統計 ${this.tableName} 記錄數失敗`)
    }
  }
}

// Utility functions for common database operations
export const dbUtils = {
  // Execute raw SQL with error handling
  async executeRaw(sql: string, values?: unknown[]): Promise<any> {
    try {
      return await db.query(sql, values || [])
    } catch (error) {
      throw new DatabaseError('執行 SQL 查詢失敗')
    }
  },

  // Check if table exists
  async tableExists(tableName: string): Promise<boolean> {
    try {
      return await db.tableExists(tableName)
    } catch (error) {
      throw new DatabaseError('檢查資料表存在性失敗')
    }
  },

  // Get table row count
  async getTableRowCount(tableName: string): Promise<number> {
    try {
      return await db.getTableRowCount(tableName)
    } catch (error) {
      throw new DatabaseError('獲取資料表行數失敗')
    }
  },

  // Execute in transaction
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    try {
      return await db.transaction(callback)
    } catch (error) {
      throw new DatabaseError('執行資料庫事務失敗')
    }
  }
}

// Re-export low-level helpers for routes expecting them
export const query = (text: string, values?: unknown[]) => rawQuery(text, values || [])
export const queryOne = (text: string, values?: unknown[]) => rawQueryOne(text, values || [])
export const queryMany = (text: string, values?: unknown[]) => rawQueryMany(text, values || [])
