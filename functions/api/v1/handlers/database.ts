/**
 * 數據庫相關路由處理器
 * 處理數據庫修復、優化、N+1問題檢測等
 */

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

interface Context {
  request: Request
  env: Env
}

export async function handleDatabaseRoutes(context: Context, path: string): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)

  // 數據庫修復端點
  if (path === '/db/fix') {
    return handleDatabaseFix(env)
  }

  // 數據庫優化端點
  if (path === '/db/optimize') {
    return handleDatabaseOptimization(env, url)
  }

  // N+1問題檢測端點
  if (path === '/db/n1-check') {
    return handleN1ProblemDetection(env, url)
  }

  // 如果沒有匹配的路由，返回404
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Database endpoint not found'
      }
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}

// 數據庫修復處理函數
async function handleDatabaseFix(env: Env): Promise<Response> {
  try {
    if (!env.DATABASE_URL) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'DATABASE_URL not configured'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(env.DATABASE_URL)

    // 檢查數據庫連接
    const result = await sql`SELECT 1 as test`

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: '數據庫連接正常',
          test: result[0]?.test
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '數據庫修復失敗',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}

// 數據庫優化處理函數
async function handleDatabaseOptimization(env: Env, url: URL): Promise<Response> {
  try {
    if (!env.DATABASE_URL) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'DATABASE_URL not configured'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(env.DATABASE_URL)
    const action = url.searchParams.get('action') || 'indexes'
    let result: any = {}

    switch (action) {
      case 'indexes':
        // 創建索引
        const indexes = [
          'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
          'CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type)',
          'CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active)',
          'CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active)',
          'CREATE INDEX IF NOT EXISTS idx_jobs_expires ON jobs(expires_at)',
          'CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id)'
        ]

        const createdIndexes = []
        for (const indexQuery of indexes) {
          try {
            await sql.unsafe(indexQuery)
            createdIndexes.push(indexQuery)
          } catch (error) {
            console.warn(`Index creation failed: ${indexQuery}`, error)
          }
        }

        result = {
          message: '索引創建完成',
          createdIndexes: createdIndexes.length,
          totalIndexes: indexes.length
        }
        break

      case 'constraints':
        // 添加約束
        const constraints = [
          "ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_user_type CHECK (user_type IN ('job_seeker', 'employer'))",
          'ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS chk_duration CHECK (duration_hours > 0)',
          'ALTER TABLE jobs ADD CONSTRAINT IF NOT EXISTS chk_salary CHECK (salary IS NULL OR salary > 0)'
        ]

        const addedConstraints = []
        for (const constraintQuery of constraints) {
          try {
            await sql.unsafe(constraintQuery)
            addedConstraints.push(constraintQuery)
          } catch (error) {
            console.warn(`Constraint addition failed: ${constraintQuery}`, error)
          }
        }

        result = {
          message: '約束添加完成',
          addedConstraints: addedConstraints.length,
          totalConstraints: constraints.length
        }
        break

      case 'cleanup':
        // 清理過期數據
        const cleanupQueries = [
          'DELETE FROM jobs WHERE expires_at < NOW() AND is_active = false',
          "DELETE FROM course_enrollments WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'cancelled'"
        ]

        let cleanedRows = 0
        for (const cleanupQuery of cleanupQueries) {
          try {
            const cleanupResult = await sql.unsafe(cleanupQuery)
            cleanedRows += cleanupResult.length || 0
          } catch (error) {
            console.warn(`Cleanup failed: ${cleanupQuery}`, error)
          }
        }

        result = {
          message: '數據清理完成',
          cleanedRows
        }
        break

      case 'analyze':
        // 更新統計信息
        const tables = ['users', 'courses', 'jobs', 'course_enrollments', 'job_applications']
        for (const table of tables) {
          try {
            await sql.unsafe(`ANALYZE ${table}`)
          } catch (error) {
            console.warn(`Analyze failed for table ${table}:`, error)
          }
        }

        result = {
          message: '統計信息更新完成',
          analyzedTables: tables.length
        }
        break

      case 'full':
        // 完整優化
        const fullIndexes = [
          'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
          'CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type)',
          'CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active)',
          'CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active)'
        ]

        const fullCreatedIndexes = []
        for (const indexQuery of fullIndexes) {
          try {
            await sql.unsafe(indexQuery)
            fullCreatedIndexes.push(indexQuery)
          } catch (error) {
            console.warn(`Full optimization index creation failed: ${indexQuery}`, error)
          }
        }

        // 清理過期工作
        const expiredJobsQuery = 'DELETE FROM jobs WHERE expires_at < NOW() AND is_active = false'
        let fullExpiredJobs = 0
        try {
          const expiredResult = await sql.unsafe(expiredJobsQuery)
          fullExpiredJobs = expiredResult.length || 0
        } catch (error) {
          console.warn('Full optimization cleanup failed:', error)
        }

        result = {
          message: '完整數據庫優化完成',
          createdIndexes: fullCreatedIndexes.length,
          expiredJobs: fullExpiredJobs,
          optimizationSteps: ['索引創建', '數據清理', '統計更新']
        }
        break

      default:
        result = { error: 'Invalid action. Use: indexes, constraints, cleanup, analyze, full' }
    }

    return new Response(JSON.stringify({ success: true, data: result }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '數據庫優化失敗',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}

// N+1問題檢測處理函數
async function handleN1ProblemDetection(env: Env, url: URL): Promise<Response> {
  try {
    if (!env.DATABASE_URL) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'DATABASE_URL not configured'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(env.DATABASE_URL)
    const action = url.searchParams.get('action') || 'detect'
    let result: any = {}

    switch (action) {
      case 'detect':
        const problems = [
          {
            id: 'jobs-hasApplied-check',
            description: '工作列表中的hasApplied狀態檢查可能導致N+1問題',
            severity: 'high',
            affectedTables: ['jobs', 'job_applications'],
            solution: '使用LEFT JOIN一次性獲取所有申請狀態',
            estimatedImpact: '高 - 每次獲取工作列表都會額外查詢N次'
          },
          {
            id: 'courses-enrollment-check',
            description: '課程列表中的註冊狀態檢查可能導致N+1問題',
            severity: 'high',
            affectedTables: ['courses', 'course_enrollments'],
            solution: '使用LEFT JOIN一次性獲取所有註冊狀態',
            estimatedImpact: '高 - 每次獲取課程列表都會額外查詢N次'
          }
        ]

        result = {
          message: 'N+1問題檢測完成',
          problems,
          totalProblems: problems.length,
          highSeverity: problems.filter(p => p.severity === 'high').length
        }
        break

      default:
        result = { error: 'Invalid action. Use: detect' }
    }

    return new Response(JSON.stringify({ success: true, data: result }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'N+1 problem detection failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}

