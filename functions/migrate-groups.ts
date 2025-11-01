/**
 * Cloudflare Pages Function - 群組資料表遷移
 * 創建 groups 資料表
 */

import { neon } from '@neondatabase/serverless'

interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async context => {
  const { request, env } = context

  try {
    // 簡單的安全檢查
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${env.JWT_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const sql = neon(env.DATABASE_URL)

    console.log('🚀 開始執行群組資料表遷移...')

    // 1. 檢查 migrations 表是否存在
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    // 2. 檢查是否已經執行過遷移
    const existingMigrations = await sql`
      SELECT id FROM migrations 
      WHERE id = 'student_groups_migration'
    `

    if (existingMigrations.length > 0) {
      return Response.json({
        success: true,
        message: '群組資料表遷移已經執行過',
        alreadyMigrated: true
      })
    }

    // 3. 創建 student_groups 資料表（如果不存在）
    await sql`
      CREATE TABLE IF NOT EXISTS student_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        group_type VARCHAR(50) DEFAULT 'course',
        created_by INTEGER REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log('✅ student_groups 資料表確認存在')

    // 4. 檢查 group_members 資料表是否存在
    const groupMembersExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'group_members'
      ) as exists
    `

    if (!groupMembersExists[0]?.exists) {
      // 創建 group_members 資料表
      await sql`
        CREATE TABLE group_members (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES student_groups(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'member',
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(group_id, user_id)
        );
      `
      console.log('✅ group_members 資料表創建成功')
    } else {
      console.log('ℹ️  group_members 資料表已存在')
    }

    // 5. 創建索引以提升查詢效能
    await sql`
      CREATE INDEX IF NOT EXISTS idx_student_groups_created_by ON student_groups(created_by);
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_student_groups_is_active ON student_groups(is_active);
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
    `

    console.log('✅ 索引創建成功')

    // 6. 記錄遷移
    await sql`
      INSERT INTO migrations (id, filename) 
      VALUES ('student_groups_migration', 'student_groups_migration.sql')
    `

    // 7. 獲取資料表統計
    const groupsCount = await sql`SELECT COUNT(*) as count FROM student_groups`
    const membersCount = await sql`SELECT COUNT(*) as count FROM group_members`

    return Response.json({
      success: true,
      message: '群組資料表遷移完成',
      data: {
        groupsCount: parseInt(groupsCount[0]?.count || '0', 10),
        membersCount: parseInt(membersCount[0]?.count || '0', 10)
      }
    })
  } catch (error) {
    console.error('遷移失敗:', error)
    return Response.json(
      {
        success: false,
        message: '遷移失敗',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
