#!/usr/bin/env node

import { CloudflareDatabase, getDatabaseConnection } from '@/config/cloudflare-database'

// Migration files content (embedded for Cloudflare Workers)
const migrations = [
  {
    id: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('job_seeker', 'employer')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `
  }
]

// Run migrations for Cloudflare Workers
export async function runCloudflaremigrations(env: any): Promise<void> {
  const db = getDatabaseConnection(env)

  console.log('Starting Cloudflare migrations...')

  // Create migrations table
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Get executed migrations
  const executedMigrations = await db.queryMany<{ id: string }>(`
    SELECT id FROM migrations ORDER BY executed_at ASC
  `)

  const executedIds = new Set(executedMigrations.map(m => m.id))

  // Run pending migrations
  for (const migration of migrations) {
    if (!executedIds.has(migration.id)) {
      console.log(`Running migration: ${migration.id}`)

      await db.transaction(async (db) => {
        await db.query(migration.sql)
        await db.query(
          'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
          [migration.id, `${migration.id}.sql`]
        )
      })

      console.log(`✓ Migration completed: ${migration.id}`)
    }
  }

  console.log('All migrations completed!')
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const env = { DATABASE_URL: process.env.DATABASE_URL }
  runCloudflaremigrations(env).catch(console.error)
}