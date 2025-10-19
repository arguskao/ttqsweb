import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../utils/database'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Migration interface
export interface Migration {
    id: string
    filename: string
    executed_at?: Date
}

// Migration runner class
export class DatabaseMigrator {
    private migrationsPath: string

    constructor() {
        this.migrationsPath = join(__dirname, 'migrations')
    }

    // Create migrations tracking table
    async createMigrationsTable(): Promise<void> {
        const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
        await db.executeRaw(sql)
    }

    // Get list of executed migrations
    async getExecutedMigrations(): Promise<Migration[]> {
        try {
            return await db.queryMany<Migration>({
                text: 'SELECT * FROM migrations ORDER BY executed_at ASC'
            })
        } catch (error) {
            // If migrations table doesn't exist, return empty array
            return []
        }
    }

    // Get list of pending migrations
    async getPendingMigrations(): Promise<string[]> {
        const executedMigrations = await this.getExecutedMigrations()
        const executedIds = new Set(executedMigrations.map(m => m.id))

        // List of migration files in order
        const allMigrations = [
            '001_create_users_table.sql',
            '002_create_courses_table.sql',
            '003_create_course_enrollments_table.sql',
            '004_create_jobs_table.sql',
            '005_create_job_applications_table.sql',
            '006_create_documents_table.sql'
        ]

        return allMigrations.filter(filename => {
            const id = filename.replace('.sql', '')
            return !executedIds.has(id)
        })
    }

    // Execute a single migration
    async executeMigration(filename: string): Promise<void> {
        const filePath = join(this.migrationsPath, filename)
        const sql = readFileSync(filePath, 'utf-8')
        const id = filename.replace('.sql', '')

        await db.transaction(async (client) => {
            // Execute the migration SQL
            await client.query(sql)

            // Record the migration as executed
            await client.query(
                'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
                [id, filename]
            )
        })

        console.log(`Migration executed: ${filename}`)
    }

    // Run all pending migrations
    async runMigrations(): Promise<void> {
        console.log('Starting database migrations...')

        // Ensure migrations table exists
        await this.createMigrationsTable()

        // Get pending migrations
        const pendingMigrations = await this.getPendingMigrations()

        if (pendingMigrations.length === 0) {
            console.log('No pending migrations found.')
            return
        }

        console.log(`Found ${pendingMigrations.length} pending migrations:`)
        pendingMigrations.forEach(filename => console.log(`  - ${filename}`))

        // Execute each pending migration
        for (const filename of pendingMigrations) {
            await this.executeMigration(filename)
        }

        console.log('All migrations completed successfully!')
    }

    // Reset database (drop all tables and re-run migrations)
    async resetDatabase(): Promise<void> {
        console.log('Resetting database...')

        // Drop all tables in reverse order
        const dropTables = [
            'DROP TABLE IF EXISTS job_applications CASCADE;',
            'DROP TABLE IF EXISTS jobs CASCADE;',
            'DROP TABLE IF EXISTS course_enrollments CASCADE;',
            'DROP TABLE IF EXISTS courses CASCADE;',
            'DROP TABLE IF EXISTS documents CASCADE;',
            'DROP TABLE IF EXISTS users CASCADE;',
            'DROP TABLE IF EXISTS migrations CASCADE;',
            'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;'
        ]

        for (const sql of dropTables) {
            await db.executeRaw(sql)
        }

        console.log('All tables dropped. Running migrations...')
        await this.runMigrations()
    }

    // Check migration status
    async getMigrationStatus(): Promise<{ executed: Migration[], pending: string[] }> {
        await this.createMigrationsTable()
        const executed = await this.getExecutedMigrations()
        const pending = await this.getPendingMigrations()

        return { executed, pending }
    }
}

// Create singleton instance
export const migrator = new DatabaseMigrator()