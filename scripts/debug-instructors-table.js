/**
 * 調試 instructors 表問題
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(DATABASE_URL)

async function main() {
  try {
    console.log('🔍 調試 instructors 表問題...')

    // 檢查 instructors 是否為表還是視圖
    const tableInfo = await sql`
      SELECT
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables
      WHERE table_name = 'instructors'
      AND table_schema = 'public'
    `

    console.log('📋 instructors 資訊:')
    tableInfo.forEach(info => {
      console.log(`   - 名稱: ${info.table_name}`)
      console.log(`   - 類型: ${info.table_type}`)
      console.log(`   - Schema: ${info.table_schema}`)
    })

    // 檢查是否為視圖
    const viewInfo = await sql`
      SELECT
        table_name,
        view_definition
      FROM information_schema.views
      WHERE table_name = 'instructors'
      AND table_schema = 'public'
    `

    if (viewInfo.length > 0) {
      console.log('\n⚠️ instructors 是一個視圖，不是表！')
      console.log('視圖定義:')
      console.log(viewInfo[0].view_definition)
    }

    // 檢查所有包含 instructor 的表
    const instructorTables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_name LIKE '%instructor%'
      AND table_schema = 'public'
      ORDER BY table_name
    `

    console.log('\n📋 所有包含 instructor 的表/視圖:')
    instructorTables.forEach(table => {
      console.log(`   - ${table.table_name} (${table.table_type})`)
    })

    // 檢查 instructor_applications 表結構
    const instructorAppsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'instructor_applications'
        AND table_type = 'BASE TABLE'
      )
    `

    if (instructorAppsExists[0].exists) {
      console.log('\n📋 instructor_applications 表結構:')
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'instructor_applications'
        ORDER BY ordinal_position
      `

      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
      })

      // 檢查是否有 id 欄位
      const hasId = columns.some(col => col.column_name === 'id')
      console.log(`\n   有 id 欄位: ${hasId}`)
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message)
  }
}

main()
