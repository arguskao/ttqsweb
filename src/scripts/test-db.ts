
import 'dotenv/config'
import { testDatabaseConnection } from '../config/database'

async function main() {
  try {
    console.log('Testing Neon database connection...')

    const isConnected = await testDatabaseConnection()

    if (isConnected) {
      console.log('✓ Database connection successful!')
    } else {
      console.log('✗ Database connection failed')
      process.exit(1)
    }

  } catch (error) {
    console.error('✗ Database connection failed:', error)
    process.exit(1)
  }
}

main()
