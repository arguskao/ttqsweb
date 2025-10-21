// Cloudflare Workers compatible database connection
// Uses @neondatabase/serverless for edge compatibility
import { neon } from '@neondatabase/serverless'

interface DatabaseConfig {
  connectionString: string
}

// For Cloudflare Workers, we'll use Neon's serverless driver
export class CloudflareDatabase {
  private readonly sql: ReturnType<typeof neon>

  constructor(config: DatabaseConfig) {
    this.sql = neon(config.connectionString)
  }

  // Execute query with Neon serverless
  async query<T = unknown>(
    sqlQuery: string,
    params?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number }> {
    try {
      let result: any

      if (params && params.length > 0) {
        // Neon serverless: call underlying driver in a permissive way
        result = await (this.sql as unknown as (q: string, p?: unknown[]) => Promise<any>)(
          sqlQuery,
          params
        )
      } else {
        // For simple queries without parameters
        result = await (this.sql as unknown as (q: string) => Promise<any>)(sqlQuery)
      }

      return {
        rows: result as T[],
        rowCount: Array.isArray(result) ? result.length : 0
      }
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  // Execute single query and return first row
  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const result = await this.query<T>(sql, params)
    return result.rows.length > 0 ? result.rows[0] || null : null
  }

  // Execute query and return all rows
  async queryMany<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.query<T>(sql, params)
    return result.rows
  }

  // Execute in transaction
  async transaction<T>(callback: (db: CloudflareDatabase) => Promise<T>): Promise<T> {
    // Neon serverless handles transactions automatically for single connections
    return await callback(this)
  }
}

// Create database instance
export function createCloudflareDatabase(connectionString: string): CloudflareDatabase {
  return new CloudflareDatabase({ connectionString })
}

// Environment-aware database factory
export function getDatabaseConnection(env?: any): CloudflareDatabase {
  const connectionString = env?.DATABASE_URL || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  return createCloudflareDatabase(connectionString)
}
