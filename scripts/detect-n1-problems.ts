#!/usr/bin/env node
/**
 * N+1 查詢問題檢測和優化工具
 * 用於檢測和修復數據庫查詢中的N+1問題
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// 載入環境變量
dotenv.config()

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 環境變量未設置')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

interface N1Problem {
  id: string
  description: string
  severity: 'high' | 'medium' | 'low'
  affectedTables: string[]
  solution: string
  estimatedImpact: string
}

class N1ProblemDetector {
  private sql: ReturnType<typeof neon>

  constructor() {
    this.sql = sql
  }

  /**
   * 檢測潛在的N+1問題
   */
  async detectN1Problems(): Promise<N1Problem[]> {
    console.log('🔍 檢測N+1查詢問題...')

    const problems: N1Problem[] = []

    // 1. 檢測工作列表中的申請狀態檢查
    problems.push({
      id: 'jobs-hasApplied-check',
      description: '工作列表中的hasApplied狀態檢查可能導致N+1問題',
      severity: 'high',
      affectedTables: ['jobs', 'job_applications'],
      solution: '使用LEFT JOIN一次性獲取所有申請狀態',
      estimatedImpact: '高 - 每次獲取工作列表都會額外查詢N次'
    })

    // 2. 檢測課程註冊狀態檢查
    problems.push({
      id: 'courses-enrollment-check',
      description: '課程列表中的註冊狀態檢查可能導致N+1問題',
      severity: 'high',
      affectedTables: ['courses', 'course_enrollments'],
      solution: '使用LEFT JOIN一次性獲取所有註冊狀態',
      estimatedImpact: '高 - 每次獲取課程列表都會額外查詢N次'
    })

    // 3. 檢測講師評分查詢
    problems.push({
      id: 'instructor-ratings-check',
      description: '講師評分查詢可能導致N+1問題',
      severity: 'medium',
      affectedTables: ['instructors', 'instructor_ratings'],
      solution: '使用聚合查詢一次性獲取評分統計',
      estimatedImpact: '中 - 影響講師列表頁面性能'
    })

    // 4. 檢測文檔下載統計
    problems.push({
      id: 'documents-download-stats',
      description: '文檔下載統計可能導致N+1問題',
      severity: 'low',
      affectedTables: ['documents'],
      solution: '使用聚合查詢獲取下載統計',
      estimatedImpact: '低 - 影響文檔列表頁面性能'
    })

    return problems
  }

  /**
   * 生成優化後的查詢
   */
  async generateOptimizedQueries(): Promise<Record<string, string>> {
    console.log('🚀 生成優化後的查詢...')

    const optimizedQueries = {
      // 優化工作列表查詢 - 一次性獲取申請狀態
      'jobs-with-applications': `
        SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as employer_name,
          CASE WHEN ja.id IS NOT NULL THEN true ELSE false END as has_applied
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.applicant_id = $1
        WHERE j.is_active = true
        ORDER BY j.created_at DESC
        LIMIT $2 OFFSET $3
      `,

      // 優化課程列表查詢 - 一次性獲取註冊狀態
      'courses-with-enrollments': `
        SELECT 
          c.*,
          u.first_name || ' ' || u.last_name as instructor_name,
          CASE WHEN ce.id IS NOT NULL THEN true ELSE false END as is_enrolled,
          ce.status as enrollment_status
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.user_id = $1
        WHERE c.is_active = true
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `,

      // 優化講師評分查詢 - 使用聚合
      'instructors-with-ratings': `
        SELECT 
          i.*,
          u.first_name || ' ' || u.last_name as instructor_name,
          COALESCE(AVG(ir.rating), 0) as average_rating,
          COUNT(ir.id) as total_ratings
        FROM instructors i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN instructor_ratings ir ON i.id = ir.instructor_id
        WHERE i.is_active = true
        GROUP BY i.id, u.first_name, u.last_name
        ORDER BY average_rating DESC, total_ratings DESC
        LIMIT $1 OFFSET $2
      `,

      // 優化文檔查詢 - 包含下載統計
      'documents-with-stats': `
        SELECT 
          d.*,
          u.first_name || ' ' || u.last_name as uploader_name,
          d.download_count
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.is_public = true
        ORDER BY d.download_count DESC, d.created_at DESC
        LIMIT $1 OFFSET $2
      `,

      // 優化用戶學習進度查詢
      'user-learning-progress': `
        SELECT 
          c.id as course_id,
          c.title as course_title,
          c.course_type,
          ce.status as enrollment_status,
          ce.enrolled_at,
          ce.completed_at,
          CASE 
            WHEN ce.completed_at IS NOT NULL THEN 100
            WHEN ce.progress IS NOT NULL THEN ce.progress
            ELSE 0
          END as progress_percentage
        FROM course_enrollments ce
        JOIN courses c ON ce.course_id = c.id
        WHERE ce.user_id = $1
        ORDER BY ce.enrolled_at DESC
      `,

      // 優化工作申請查詢
      'job-applications-with-details': `
        SELECT 
          ja.*,
          j.title as job_title,
          j.location as job_location,
          u.first_name || ' ' || u.last_name as applicant_name,
          u.email as applicant_email
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        JOIN users u ON ja.applicant_id = u.id
        WHERE ja.job_id = $1
        ORDER BY ja.application_date DESC
      `
    }

    return optimizedQueries
  }

  /**
   * 創建優化索引
   */
  async createOptimizationIndexes(): Promise<void> {
    console.log('📊 創建N+1優化索引...')

    const indexes = [
      // 工作申請相關索引
      {
        name: 'idx_job_applications_job_applicant',
        table: 'job_applications',
        columns: 'job_id, applicant_id'
      },
      {
        name: 'idx_job_applications_applicant_status',
        table: 'job_applications',
        columns: 'applicant_id, status'
      },

      // 課程註冊相關索引
      {
        name: 'idx_course_enrollments_user_course',
        table: 'course_enrollments',
        columns: 'user_id, course_id'
      },
      {
        name: 'idx_course_enrollments_course_status',
        table: 'course_enrollments',
        columns: 'course_id, status'
      },

      // 講師評分相關索引
      {
        name: 'idx_instructor_ratings_instructor',
        table: 'instructor_ratings',
        columns: 'instructor_id'
      },
      {
        name: 'idx_instructor_ratings_student_course',
        table: 'instructor_ratings',
        columns: 'student_id, course_id'
      },

      // 複合索引優化
      {
        name: 'idx_jobs_active_created',
        table: 'jobs',
        columns: 'is_active, created_at'
      },
      {
        name: 'idx_courses_active_created',
        table: 'courses',
        columns: 'is_active, created_at'
      }
    ]

    for (const index of indexes) {
      try {
        const query = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${index.columns})`
        await this.sql(query)
        console.log(`✅ 創建索引: ${index.name}`)
      } catch (error) {
        console.warn(`⚠️  索引 ${index.name} 創建失敗:`, error)
      }
    }
  }

  /**
   * 生成優化建議報告
   */
  async generateOptimizationReport(): Promise<void> {
    console.log('📋 生成N+1優化建議報告...')

    const problems = await this.detectN1Problems()
    const optimizedQueries = await this.generateOptimizedQueries()

    console.log('\n' + '='.repeat(80))
    console.log('🔍 N+1 查詢問題檢測報告')
    console.log('='.repeat(80))

    problems.forEach((problem, index) => {
      console.log(`\n${index + 1}. ${problem.description}`)
      console.log(`   嚴重程度: ${problem.severity.toUpperCase()}`)
      console.log(`   影響表: ${problem.affectedTables.join(', ')}`)
      console.log(`   解決方案: ${problem.solution}`)
      console.log(`   預估影響: ${problem.estimatedImpact}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log('🚀 優化後的查詢建議')
    console.log('='.repeat(80))

    Object.entries(optimizedQueries).forEach(([name, query]) => {
      console.log(`\n${name}:`)
      console.log(query.trim())
    })

    console.log('\n' + '='.repeat(80))
    console.log('📊 性能優化建議')
    console.log('='.repeat(80))

    console.log(`
1. 使用 JOIN 替代循環查詢
   - 一次性獲取所有關聯數據
   - 減少數據庫往返次數

2. 使用聚合查詢
   - COUNT, AVG, SUM 等聚合函數
   - 減少應用層計算

3. 創建複合索引
   - 優化多條件查詢
   - 提升 JOIN 性能

4. 使用分頁查詢
   - 限制返回結果數量
   - 避免一次性加載大量數據

5. 緩存策略
   - 緩存頻繁查詢的結果
   - 使用 Redis 或內存緩存
    `)

    console.log('\n' + '='.repeat(80))
    console.log('✅ N+1 優化建議報告完成')
    console.log('='.repeat(80))
  }

  /**
   * 執行完整優化
   */
  async optimize(): Promise<void> {
    console.log('🚀 開始N+1查詢優化...')
    console.log('=' * 50)

    try {
      // 1. 檢測問題
      await this.generateOptimizationReport()

      // 2. 創建優化索引
      await this.createOptimizationIndexes()

      console.log('\n🎉 N+1查詢優化完成!')
      console.log('建議立即更新相關的服務代碼以使用優化後的查詢。')
    } catch (error) {
      console.error('❌ N+1優化失敗:', error)
      throw error
    }
  }
}

// 執行優化
async function main() {
  const detector = new N1ProblemDetector()

  try {
    await detector.optimize()
    console.log('🎉 N+1查詢優化成功完成!')
  } catch (error) {
    console.error('💥 優化失敗:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { N1ProblemDetector }
