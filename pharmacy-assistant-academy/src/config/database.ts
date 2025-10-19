import { Pool, PoolConfig } from 'pg'

// Database configuration interface
export interface DatabaseConfig extends PoolConfig {
    connectionString?: string
}

// Default database configuration
const defaultConfig: DatabaseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
}

// Create database connection pool
let pool: Pool | null = null

export const createDatabasePool = (config: DatabaseConfig = defaultConfig): Pool => {
    if (!pool) {
        pool = new Pool(config)

        // Handle pool errors
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err)
            process.exit(-1)
        })

        // Handle pool connection
        pool.on('connect', () => {
            console.log('Database connected successfully')
        })
    }

    return pool
}

// Get existing pool or create new one
export const getDatabasePool = (): Pool => {
    if (!pool) {
        pool = createDatabasePool()
    }
    return pool
}

// Close database connection pool
export const closeDatabasePool = async (): Promise<void> => {
    if (pool) {
        await pool.end()
        pool = null
        console.log('Database connection pool closed')
    }
}

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
    try {
        const client = await getDatabasePool().connect()
        const result = await client.query('SELECT NOW()')
        client.release()
        console.log('Database connection test successful:', result.rows[0])
        return true
    } catch (error) {
        console.error('Database connection test failed:', error)
        return false
    }
}