#!/usr/bin/env node

import 'dotenv/config'
import { migrator } from '../database/migrator'
import { testDatabaseConnection, closeDatabasePool } from '../config/database'

async function main() {
    const command = process.argv[2]

    try {
        // Test database connection first
        console.log('Testing database connection...')
        const isConnected = await testDatabaseConnection()

        if (!isConnected) {
            console.error('Failed to connect to database. Please check your DATABASE_URL.')
            process.exit(1)
        }

        switch (command) {
            case 'up':
                await migrator.runMigrations()
                break

            case 'status':
                const status = await migrator.getMigrationStatus()
                console.log('\nMigration Status:')
                console.log('================')
                console.log(`Executed migrations: ${status.executed.length}`)
                status.executed.forEach(m => {
                    console.log(`  ✓ ${m.filename} (${m.executed_at})`)
                })
                console.log(`\nPending migrations: ${status.pending.length}`)
                status.pending.forEach(filename => {
                    console.log(`  - ${filename}`)
                })
                break

            case 'reset':
                console.log('⚠️  This will drop all tables and data!')
                await migrator.resetDatabase()
                break

            default:
                console.log('Usage:')
                console.log('  npm run migrate up     - Run pending migrations')
                console.log('  npm run migrate status  - Show migration status')
                console.log('  npm run migrate reset   - Reset database (⚠️  destructive)')
                break
        }
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    } finally {
        await closeDatabasePool()
    }
}

main()