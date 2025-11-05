/**
 * 測試評價 API 功能
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(DATABASE_URL)

async function main() {
  try {
    console.log('🧪 測試評價功能...')

    // 1. 檢查是否有講師申請記錄
    console.log('\n🔍 檢查講師申請記錄...')
    const instructors = await sql`
      SELECT id, user_id, status, bio, average_rating, total_ratings
      FROM instructor_applications
      WHERE status = 'approved'
      LIMIT 3
    `

    console.log('📋 已核准的講師:')
    instructors.forEach(instructor => {
      console.log(`   - ID: ${instructor.id}, User ID: ${instructor.user_id}, 評分: ${instructor.average_rating || 0} (${instructor.total_ratings || 0} 評價)`)
    })

    if (instructors.length === 0) {
      console.log('❌ 沒有找到已核准的講師')
      return
    }

    // 2. 檢查是否有學生用戶
    console.log('\n🔍 檢查學生用戶...')
    const students = await sql`
      SELECT id, first_name, last_name, email
      FROM users
      WHERE user_type = 'student'
      LIMIT 3
    `

    console.log('📋 學生用戶:')
    students.forEach(student => {
      console.log(`   - ID: ${student.id}, 姓名: ${student.first_name} ${student.last_name}`)
    })

    if (students.length === 0) {
      console.log('❌ 沒有找到學生用戶')
      return
    }

    // 3. 測試插入評價
    const testInstructor = instructors[0]
    const testStudent = students[0]

    console.log(`\n🧪 測試為講師 ${testInstructor.id} 添加評價...`)

    try {
      const insertResult = await sql`
        INSERT INTO instructor_ratings (
          instructor_id,
          student_id,
          rating,
          comment
        ) VALUES (
          ${testInstructor.id},
          ${testStudent.id},
          5,
          '測試評價 - 講師教學很棒！'
        )
        ON CONFLICT (instructor_id, student_id, course_id) DO NOTHING
        RETURNING id
      `

      if (insertResult.length > 0) {
        console.log(`   ✅ 評價插入成功，ID: ${insertResult[0].id}`)

        // 4. 測試查詢評價
        console.log('\n🔍 測試查詢評價...')
        const ratings = await sql`
          SELECT ir.*, u.first_name as student_first_name, u.last_name as student_last_name
          FROM instructor_ratings ir
          LEFT JOIN users u ON u.id = ir.student_id
          WHERE ir.instructor_id = ${testInstructor.id}
          ORDER BY ir.created_at DESC
        `

        console.log('📋 講師評價:')
        ratings.forEach(rating => {
          console.log(`   - 評分: ${rating.rating}/5, 學生: ${rating.student_first_name} ${rating.student_last_name}`)
          console.log(`     評論: ${rating.comment}`)
        })

        // 5. 測試更新講師統計
        console.log('\n🔄 測試更新講師統計...')
        await sql`
          UPDATE instructor_applications
          SET average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM instructor_ratings
            WHERE instructor_id = ${testInstructor.id}
          ),
          total_ratings = (
            SELECT COUNT(*)
            FROM instructor_ratings
            WHERE instructor_id = ${testInstructor.id}
          ),
          updated_at = NOW()
          WHERE id = ${testInstructor.id}
        `

        // 6. 檢查更新後的統計
        const updatedInstructor = await sql`
          SELECT id, user_id, average_rating, total_ratings
          FROM instructor_applications
          WHERE id = ${testInstructor.id}
        `

        console.log('📊 更新後的講師統計:')
        console.log(`   - 平均評分: ${updatedInstructor[0].average_rating}`)
        console.log(`   - 總評價數: ${updatedInstructor[0].total_ratings}`)

        // 7. 清理測試數據
        console.log('\n🧹 清理測試數據...')
        await sql`DELETE FROM instructor_ratings WHERE id = ${insertResult[0].id}`
        console.log('   ✅ 測試數據已清理')

      } else {
        console.log('   ℹ️ 評價已存在，跳過插入')
      }

    } catch (error) {
      console.error('❌ 測試評價功能失敗:', error.message)
    }

    console.log('\n🎉 評價功能測試完成！')

  } catch (error) {
    console.error('❌ 錯誤:', error.message)
  }
}

main()
