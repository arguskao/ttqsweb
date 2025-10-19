import { config } from 'dotenv'

// Load environment variables for testing
config()

// Set test environment
process.env.NODE_ENV = 'test'
