/**
 * 檢查並建立講師評價表
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(DATABASE_URL)

async function main() {
  try {
    console.log('🔍 檢查現有表...')

    // 檢查 instructors 表
    const instructorsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'instructors'
      )
    `
    console.log('instructors 表存在:', instructorsExists[0].exists)

    // 檢查 users 表
    const usersExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `
    console.log('users 表存在:', usersExists[0].exists)

    // 檢查 courses 表
    const coursesExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'courses'
      )
    `
    console.log('courses 表存在:', coursesExists[0].exists)

    // 檢查 instructor_ratings 表
    const ratingsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'instructor_ratings'
      )
    `
    console.log('instructor_ratings 表存在:', ratingsExists[0].exists)

    if (!ratingsExists[0].exists) {
      console.log('\n🔧 建立 instructor_ratings 表...')

      // 建立表
      await sql`
        CREATE TABLE instructor_ratings (
          id SERIAL PRIMARY KEY,
          instructor_id INTEGER NOT NULL,
          student_id INTEGER NOT NULL,
          course_id INTEGER,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(instructor_id, student_id, course_id)
        )
      `

      console.log('✅ 表建立成功')

      // 建立索引
      await sql`CREATE INDEX idx_instructor_ratings_instructor ON instructor_ratings(instructor_id)`
      await sql`CREATE INDEX idx_instructor_ratings_student ON instructor_ratings(student_id)`
      await sql`CREATE INDEX idx_instructor_ratings_course ON instructor_ratings(course_id)`

      console.log('✅ 索引建立成功')

      // 如果相關表存在，添加外鍵約束
      if (instructorsExists[0].exists) {
        try {
          await sql`ALTER TABLE instructor_ratings ADD CONSTRAINT fk_instructor_ratings_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE`
          console.log('✅ instructors 外鍵約束添加成功')
        } catch (e) {
          console.log('⚠️ instructors 外鍵約束添加失敗:', e.message)
        }
      }

      if (usersExists[0].exists) {
        try {
          await sql`ALTER TABLE instructor_ratings ADD CONSTRAINT fk_instructor_ratings_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE`
          console.log('✅ users 外鍵約束添加成功')
        } catch (e) {
          console.log('⚠️ users 外鍵約束添加失敗:', e.message)
        }
      }

      if (coursesExists[0].exists) {
        try {
          await sql`ALTER TABLE instructor_ratings ADD CONSTRAINT fk_instructor_ratings_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE`
          console.log('✅ courses 外鍵約束添加成功')
        } catch (e) {
          console.log('⚠️ courses 外鍵約束添加失敗:', e.message)
        }
      }
    }

    // 最終檢查
    const finalCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'instructor_ratings'
      )
    `

    console.log('\n🎉 最終檢查 - instructor_ratings 表存在:', finalCheck[0].exists)

    if (finalCheck[0].exists) {
      // 檢查表結構
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'instructor_ratings'
        ORDER BY ordinal_position
      `

      console.log('\n📋 表結構:')
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
      })
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message)
  }
}

main()
