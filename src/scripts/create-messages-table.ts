/**
 * 創建課程訊息表
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

async function createMessagesTable() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未設置')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔄 開始創建課程訊息表...')

    // 創建訊息表
    await sql`
      CREATE TABLE IF NOT EXISTS course_messages (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_broadcast BOOLEAN DEFAULT FALSE,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        
        CONSTRAINT check_broadcast_or_recipient CHECK (
          (is_broadcast = TRUE AND recipient_id IS NULL) OR
          (is_broadcast = FALSE AND recipient_id IS NOT NULL)
        )
      )
    `

    console.log('✅ 訊息表創建成功')

    // 創建索引
    console.log('🔄 創建索引...')

    await sql`CREATE INDEX IF NOT EXISTS idx_course_messages_course ON course_messages(course_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_course_messages_sender ON course_messages(sender_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_course_messages_recipient ON course_messages(recipient_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_course_messages_created_at ON course_messages(created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_course_messages_unread ON course_messages(recipient_id, is_read) WHERE is_read = FALSE`
    await sql`CREATE INDEX IF NOT EXISTS idx_course_messages_course_recipient ON course_messages(course_id, recipient_id)`

    console.log('✅ 索引創建成功')

    // 檢查表是否存在
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'course_messages'
    `

    if (result.length > 0) {
      console.log('✅ 驗證成功：course_messages 表已存在')
    } else {
      console.log('❌ 驗證失敗：course_messages 表不存在')
    }

    console.log('✅ 所有操作完成')
  } catch (error) {
    console.error('❌ 創建訊息表失敗:', error)
    process.exit(1)
  }
}

createMessagesTable()
