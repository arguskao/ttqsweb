import { Pool, PoolClient, QueryResult } from 'pg'
import { getDatabasePool } from '../config/database'

// Database query interface
export interface QueryOptions {
    text: string
    values?: unknown[]
}

// Database transaction interface
export interface TransactionCallback<T> {
    (client: PoolClient): Promise<T>
}

// Database utility class
export class DatabaseUtils {
    private pool: Pool

    constructor() {
        this.pool = getDatabasePool()
    }

    // Execute a single query
    async query<T = unknown>(queryOptions: QueryOptions): Promise<QueryResult<T>> {
        const client = await this.pool.connect()
        try {
            const result = await client.query<T>(queryOptions.text, queryOptions.values)
            return result
        } catch (error) {
            console.error('Database query error:', error)
            throw error
        } finally {
            client.release()
        }
    }

    // Execute a query and return the first row
    async queryOne<T = unknown>(queryOptions: QueryOptions): Promise<T | null> {
        const result = await this.query<T>(queryOptions)
        return result.rows.length > 0 ? result.rows[0] : null
    }

    // Execute a query and return all rows
    async queryMany<T = unknown>(queryOptions: QueryOptions): Promise<T[]> {
        const result = await this.query<T>(queryOptions)
        return result.rows
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

    // Get table row count
    async getTableRowCount(tableName: string): Promise<number> {
        const result = await this.queryOne<{ count: string }>({
            text: `SELECT COUNT(*) as count FROM ${tableName}`
        })
        return parseInt(result?.count || '0', 10)
    }

    // Execute raw SQL (use with caution)
    async executeRaw(sql: string, values?: unknown[]): Promise<QueryResult> {
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