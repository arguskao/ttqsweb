// 創建文檔下載記錄表
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()
const sql = neon(process.env.DATABASE_URL)

async function createDownloadsTable() {
  try {
    console.log('🔧 創建 document_downloads 表...')

    // 創建表
    await sql`
      CREATE TABLE IF NOT EXISTS document_downloads (
          id SERIAL PRIMARY KEY,
          document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          ip_address VARCHAR(45) NOT NULL,
          user_agent TEXT,
          downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // 創建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_document_downloads_document_id ON document_downloads(document_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_document_downloads_user_id ON document_downloads(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_document_downloads_downloaded_at ON document_downloads(downloaded_at)`

    console.log('✅ document_downloads 表創建成功')

    // 檢查表結構
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'document_downloads'
      ORDER BY ordinal_position
    `
    console.log('📋 表結構:', columns)
  } catch (error) {
    console.error('❌ 創建表失敗:', error)
  }
}

createDownloadsTable()
