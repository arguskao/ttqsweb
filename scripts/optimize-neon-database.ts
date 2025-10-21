#!/usr/bin/env node
/**
 * Neon 數據庫優化腳本
 * 用於優化數據庫結構、索引和性能
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

interface TableInfo {
  table_name: string
  row_count: number
  table_size: string
  index_size: string
}

interface IndexInfo {
  indexname: string
  tablename: string
  indexdef: string
}

class NeonDatabaseOptimizer {
  private sql: ReturnType<typeof neon>

  constructor() {
    this.sql = sql
  }

  /**
   * 獲取數據庫統計信息
   */
  async getDatabaseStats(): Promise<{
    tables: TableInfo[]
    indexes: IndexInfo[]
    totalSize: string
  }> {
    console.log('📊 獲取數據庫統計信息...')

    try {
      // 獲取表信息
      const tables = await this.sql`
        SELECT 
          schemaname,
          tablename as table_name,
          n_tup_ins - n_tup_del as row_count,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `

      // 獲取索引信息
      const indexes = await this.sql`
        SELECT 
          indexname,
          tablename,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `

      // 獲取總大小
      const totalSize = await this.sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as total_size
      `

      return {
        tables: tables as TableInfo[],
        indexes: indexes as IndexInfo[],
        totalSize: totalSize[0]?.total_size || 'Unknown'
      }
    } catch (error) {
      console.error('❌ 獲取數據庫統計信息失敗:', error)
      throw error
    }
  }

  /**
   * 創建性能優化索引
   */
  async createPerformanceIndexes(): Promise<void> {
    console.log('🚀 創建性能優化索引...')

    const indexes = [
      // 用戶表索引
      {
        name: 'idx_users_email',
        table: 'users',
        columns: 'email',
        unique: true
      },
      {
        name: 'idx_users_user_type',
        table: 'users',
        columns: 'user_type'
      },
      {
        name: 'idx_users_active',
        table: 'users',
        columns: 'is_active'
      },

      // 課程表索引
      {
        name: 'idx_courses_instructor',
        table: 'courses',
        columns: 'instructor_id'
      },
      {
        name: 'idx_courses_active',
        table: 'courses',
        columns: 'is_active'
      },
      {
        name: 'idx_courses_type',
        table: 'courses',
        columns: 'course_type'
      },

      // 工作表索引
      {
        name: 'idx_jobs_employer',
        table: 'jobs',
        columns: 'employer_id'
      },
      {
        name: 'idx_jobs_active',
        table: 'jobs',
        columns: 'is_active'
      },
      {
        name: 'idx_jobs_expires',
        table: 'jobs',
        columns: 'expires_at'
      },
      {
        name: 'idx_jobs_location',
        table: 'jobs',
        columns: 'location'
      },

      // 文檔表索引
      {
        name: 'idx_documents_public',
        table: 'documents',
        columns: 'is_public'
      },
      {
        name: 'idx_documents_category',
        table: 'documents',
        columns: 'category'
      },
      {
        name: 'idx_documents_uploader',
        table: 'documents',
        columns: 'uploaded_by'
      },

      // 課程註冊表索引
      {
        name: 'idx_enrollments_user',
        table: 'course_enrollments',
        columns: 'user_id'
      },
      {
        name: 'idx_enrollments_course',
        table: 'course_enrollments',
        columns: 'course_id'
      },
      {
        name: 'idx_enrollments_status',
        table: 'course_enrollments',
        columns: 'status'
      },

      // 工作申請表索引
      {
        name: 'idx_applications_job',
        table: 'job_applications',
        columns: 'job_id'
      },
      {
        name: 'idx_applications_applicant',
        table: 'job_applications',
        columns: 'applicant_id'
      },
      {
        name: 'idx_applications_status',
        table: 'job_applications',
        columns: 'status'
      },

      // 複合索引
      {
        name: 'idx_courses_instructor_active',
        table: 'courses',
        columns: 'instructor_id, is_active'
      },
      {
        name: 'idx_jobs_employer_active',
        table: 'jobs',
        columns: 'employer_id, is_active'
      },
      {
        name: 'idx_enrollments_user_status',
        table: 'course_enrollments',
        columns: 'user_id, status'
      }
    ]

    for (const index of indexes) {
      try {
        const uniqueClause = index.unique ? 'UNIQUE' : ''
        await this.sql`
          CREATE ${this.sql(uniqueClause)} INDEX IF NOT EXISTS ${this.sql(index.name)} 
          ON ${this.sql(index.table)} (${this.sql(index.columns)})
        `
        console.log(`✅ 創建索引: ${index.name}`)
      } catch (error) {
        console.warn(`⚠️  索引 ${index.name} 創建失敗:`, error)
      }
    }
  }

  /**
   * 優化數據庫配置
   */
  async optimizeDatabaseConfig(): Promise<void> {
    console.log('⚙️  優化數據庫配置...')

    try {
      // 更新表統計信息
      await this.sql`ANALYZE`
      console.log('✅ 更新表統計信息')

      // 清理未使用的空間
      await this.sql`VACUUM ANALYZE`
      console.log('✅ 清理數據庫空間')

      // 重建索引（如果支持）
      try {
        await this.sql`REINDEX DATABASE ${this.sql('neondb')}`
        console.log('✅ 重建數據庫索引')
      } catch (error) {
        console.warn('⚠️  重建索引失敗（可能不支持）:', error)
      }
    } catch (error) {
      console.error('❌ 數據庫配置優化失敗:', error)
      throw error
    }
  }

  /**
   * 清理無用數據
   */
  async cleanupUnusedData(): Promise<void> {
    console.log('🧹 清理無用數據...')

    try {
      // 清理過期的工作
      const expiredJobs = await this.sql`
        DELETE FROM jobs 
        WHERE expires_at < CURRENT_TIMESTAMP 
        AND expires_at IS NOT NULL
      `
      console.log(`✅ 清理過期工作: ${expiredJobs.length} 條`)

      // 清理無效的課程註冊
      const invalidEnrollments = await this.sql`
        DELETE FROM course_enrollments 
        WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true)
        OR course_id NOT IN (SELECT id FROM courses WHERE is_active = true)
      `
      console.log(`✅ 清理無效註冊: ${invalidEnrollments.length} 條`)

      // 清理無效的工作申請
      const invalidApplications = await this.sql`
        DELETE FROM job_applications 
        WHERE applicant_id NOT IN (SELECT id FROM users WHERE is_active = true)
        OR job_id NOT IN (SELECT id FROM jobs WHERE is_active = true)
      `
      console.log(`✅ 清理無效申請: ${invalidApplications.length} 條`)
    } catch (error) {
      console.error('❌ 清理無用數據失敗:', error)
      throw error
    }
  }

  /**
   * 添加數據庫約束
   */
  async addDatabaseConstraints(): Promise<void> {
    console.log('🔒 添加數據庫約束...')

    const constraints = [
      // 外鍵約束
      {
        name: 'fk_courses_instructor',
        table: 'courses',
        constraint: 'FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL'
      },
      {
        name: 'fk_jobs_employer',
        table: 'jobs',
        constraint: 'FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_enrollments_user',
        table: 'course_enrollments',
        constraint: 'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_enrollments_course',
        table: 'course_enrollments',
        constraint: 'FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_applications_job',
        table: 'job_applications',
        constraint: 'FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_applications_applicant',
        table: 'job_applications',
        constraint: 'FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE'
      },
      {
        name: 'fk_documents_uploader',
        table: 'documents',
        constraint: 'FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL'
      }
    ]

    for (const constraint of constraints) {
      try {
        await this.sql`
          ALTER TABLE ${this.sql(constraint.table)} 
          ADD CONSTRAINT ${this.sql(constraint.name)} 
          ${this.sql(constraint.constraint)}
        `
        console.log(`✅ 添加約束: ${constraint.name}`)
      } catch (error) {
        console.warn(`⚠️  約束 ${constraint.name} 添加失敗:`, error)
      }
    }
  }

  /**
   * 執行完整優化
   */
  async optimize(): Promise<void> {
    console.log('🚀 開始Neon數據庫優化...')
    console.log('=' * 50)

    try {
      // 1. 獲取當前狀態
      const stats = await this.getDatabaseStats()
      console.log(`📊 數據庫總大小: ${stats.totalSize}`)
      console.log(`📋 表數量: ${stats.tables.length}`)
      console.log(`🔍 索引數量: ${stats.indexes.length}`)

      // 2. 創建性能索引
      await this.createPerformanceIndexes()

      // 3. 添加約束
      await this.addDatabaseConstraints()

      // 4. 清理無用數據
      await this.cleanupUnusedData()

      // 5. 優化配置
      await this.optimizeDatabaseConfig()

      // 6. 獲取優化後狀態
      const finalStats = await this.getDatabaseStats()
      console.log('=' * 50)
      console.log('✅ 數據庫優化完成!')
      console.log(`📊 優化後總大小: ${finalStats.totalSize}`)
      console.log(`📋 表數量: ${finalStats.tables.length}`)
      console.log(`🔍 索引數量: ${finalStats.indexes.length}`)
    } catch (error) {
      console.error('❌ 數據庫優化失敗:', error)
      throw error
    }
  }
}

// 執行優化
async function main() {
  const optimizer = new NeonDatabaseOptimizer()

  try {
    await optimizer.optimize()
    console.log('🎉 Neon數據庫優化成功完成!')
  } catch (error) {
    console.error('💥 優化失敗:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { NeonDatabaseOptimizer }
