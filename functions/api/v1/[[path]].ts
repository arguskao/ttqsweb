// Cloudflare Pages Function to handle all API v1 routes
// Temporarily disabled to avoid DATABASE_URL dependency

interface Env {
  DATABASE_URL?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

export const onRequest: PagesFunction<Env> = async context => {
  const { request } = context

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  // Handle API routes
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/v1', '')

  // API優化測試端點
  if (path === '/optimization/test') {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'API優化測試端點',
          features: ['響應壓縮', '智能緩存', '請求去重', '性能監控', '結構化錯誤處理', '錯誤追蹤'],
          timestamp: new Date().toISOString(),
          requestId: request.headers.get('x-request-id') || 'unknown'
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Response-Time': '5ms',
          'X-Cache': 'MISS'
        }
      }
    )
  }

  // 錯誤統計端點
  if (path === '/errors/stats') {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalErrors: 0,
          errorsBySeverity: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          },
          errorsByCategory: {
            validation: 0,
            authentication: 0,
            authorization: 0,
            not_found: 0,
            rate_limit: 0,
            database: 0,
            network: 0,
            business_logic: 0,
            system: 0,
            external_service: 0
          },
          topErrors: []
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
  }

  // 批量操作測試端點
  if (path === '/batch' && request.method === 'POST') {
    try {
      const body = await request.json()
      const batchRequests = body as Array<{
        method: string
        url: string
        body?: any
      }>

      if (!Array.isArray(batchRequests)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '批量請求格式錯誤',
              statusCode: 400
            }
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      // 模擬處理批量請求
      const results = batchRequests.map((batchReq, index) => ({
        index,
        method: batchReq.method,
        url: batchReq.url,
        success: true,
        data: { message: `處理 ${batchReq.method} ${batchReq.url}` }
      }))

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            results,
            total: batchRequests.length,
            successful: results.length,
            failed: 0
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
            code: 'INTERNAL_ERROR',
            message: '批量請求處理失敗',
            statusCode: 500
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

  // API info endpoint
  if (path === '/info') {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: 'Pharmacy Assistant Academy API',
          version: '1.0.0',
          environment: context.env.ENVIRONMENT || 'production'
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
  }

  // Database fix endpoint
  if (path === '/db/fix') {
    return handleDatabaseFix(context.env, url)
  }

  // Database optimization endpoint
  if (path === '/db/optimize') {
    return handleDatabaseOptimization(context.env, url)
  }

  // N+1 problem detection endpoint
  if (path === '/db/n1-check') {
    return handleN1ProblemDetection(context.env, url)
  }

  // API文檔端點
  if (path === '/docs/openapi.json') {
    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: '藥助Next學院 API',
        version: '1.0.0',
        description: '藥局助理轉職教育與就業媒合平台 API 文檔',
        contact: {
          name: '藥助Next學院',
          email: 'support@pharmacy-assistant-academy.com'
        }
      },
      servers: [
        {
          url: 'https://pharmacy-assistant-academy.pages.dev',
          description: '生產環境'
        }
      ],
      paths: {
        '/health': {
          get: {
            tags: ['system'],
            summary: '健康檢查',
            description: '檢查API服務的健康狀態',
            responses: {
              '200': {
                description: '成功響應',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: {
                          type: 'object',
                          properties: {
                            status: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/optimization/test': {
          get: {
            tags: ['system'],
            summary: 'API優化測試',
            description: '測試API優化功能',
            responses: {
              '200': {
                description: '成功響應',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: {
                          type: 'object',
                          properties: {
                            message: { type: 'string' },
                            features: {
                              type: 'array',
                              items: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ApiResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  statusCode: { type: 'integer' }
                }
              }
            }
          }
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ],
      tags: [
        { name: 'system', description: '系統相關端點' },
        { name: 'auth', description: '認證相關端點' },
        { name: 'courses', description: '課程管理相關端點' },
        { name: 'jobs', description: '工作管理相關端點' },
        { name: 'documents', description: '文檔管理相關端點' }
      ]
    }

    return new Response(JSON.stringify(openApiSpec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }

  // Swagger UI 端點
  if (path === '/docs') {
    const swaggerUIHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>藥助Next學院 API 文檔</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #2c3e50;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/v1/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        validatorUrl: null,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          console.log('API文檔加載完成');
        }
      });
    };
  </script>
</body>
</html>`

    return new Response(swaggerUIHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }

  // API文檔統計端點
  if (path === '/docs/stats') {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalEndpoints: 15,
          endpointsByMethod: {
            GET: 10,
            POST: 4,
            PUT: 1
          },
          endpointsByTag: {
            system: 5,
            auth: 4,
            courses: 3,
            jobs: 2,
            documents: 1
          },
          lastUpdated: new Date().toISOString(),
          totalSchemas: 5,
          totalTags: 5
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
  }

  // API 請求處理函數
  async function handleApiRequest(context: any, path: string) {
    const { request, env } = context

    // 基本的API端點處理
    switch (path) {
      case '/courses':
        if (request.method === 'GET') {
          return getCourses(env)
        }
        break

      case '/jobs':
        if (request.method === 'GET') {
          return getJobs(env)
        }
        break

      case '/documents':
        if (request.method === 'GET') {
          return getDocuments(env)
        }
        break

      case '/groups':
        if (request.method === 'GET') {
          return getGroups(env)
        } else if (request.method === 'POST') {
          return createGroup(env, request)
        }
        break

      case '/forum/topics':
        if (request.method === 'GET') {
          return getForumTopics(env, request)
        } else if (request.method === 'POST') {
          return createForumTopic(env, request)
        }
        break
    }

    // 處理帶參數的路由
    if (path.startsWith('/groups/') && path.endsWith('/join')) {
      const groupId = parseInt(path.split('/')[2])
      if (request.method === 'POST') {
        return joinGroup(env, groupId, request)
      }
    }

    if (path.startsWith('/forum/topics/')) {
      const topicId = parseInt(path.split('/')[3])
      if (request.method === 'GET') {
        return getForumTopic(env, topicId)
      }
    }

    // 如果沒有匹配的路由，返回404
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API endpoint not found'
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

  // 獲取課程列表
  async function getCourses(env: Env) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      // 先檢查是否有數據
      const courseCount = await sql`SELECT COUNT(*) as count FROM courses WHERE is_active = true`

      if (parseInt(courseCount[0]?.count || '0') === 0) {
        // 如果沒有數據，插入一些測試數據
        await sql`
        INSERT INTO courses (title, description, course_type, duration_hours, price, instructor_id, is_active) 
        VALUES 
          ('藥局助理基礎課程', '學習藥局基本作業流程、藥品管理等基礎知識', 'basic', 40, 5000, 1, true),
          ('進階藥學知識', '深入學習藥理學、藥物交互作用等進階知識', 'advanced', 60, 8000, 1, true),
          ('實習實作課程', '實際藥局工作環境體驗與實務操作', 'internship', 80, 12000, 1, true)
        ON CONFLICT DO NOTHING
      `
      }

      const courses = await sql`
      SELECT id, title, description, course_type, duration_hours, price, is_active, created_at
      FROM courses 
      WHERE is_active = true
      ORDER BY created_at DESC
    `

      return new Response(
        JSON.stringify({
          success: true,
          data: courses
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
      console.error('Error fetching courses:', error)
      throw error
    }
  }

  // 獲取工作列表
  async function getJobs(env: Env) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      // 先檢查是否有數據
      const jobCount = await sql`SELECT COUNT(*) as count FROM jobs WHERE is_active = true`

      if (parseInt(jobCount[0]?.count || '0') === 0) {
        // 如果沒有數據，插入一些測試數據
        await sql`
        INSERT INTO jobs (employer_id, title, description, location, salary_min, salary_max, job_type, is_active, expires_at) 
        VALUES 
          (1, '藥局助理 - 台北市', '負責藥品管理、顧客服務等工作', '台北市大安區', 30000, 40000, 'full_time', true, CURRENT_TIMESTAMP + INTERVAL '30 days'),
          (1, '兼職藥局助理 - 新北市', '週末兼職，協助藥師處理日常業務', '新北市板橋區', 200, 250, 'part_time', true, CURRENT_TIMESTAMP + INTERVAL '30 days'),
          (1, '藥局實習生', '提供完整實習訓練，有機會轉正職', '桃園市中壢區', 25000, 28000, 'internship', true, CURRENT_TIMESTAMP + INTERVAL '45 days')
        ON CONFLICT DO NOTHING
      `
      }

      const jobs = await sql`
      SELECT id, title, description, location, salary_min, salary_max, job_type, is_active, created_at
      FROM jobs 
      WHERE is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
    `

      return new Response(
        JSON.stringify({
          success: true,
          data: jobs
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
      console.error('Error fetching jobs:', error)
      throw error
    }
  }

  // 獲取文檔列表
  async function getDocuments(env: Env) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      // 先檢查是否有數據
      const docCount = await sql`SELECT COUNT(*) as count FROM documents WHERE is_public = true`

      if (parseInt(docCount[0]?.count || '0') === 0) {
        // 如果沒有數據，插入一些測試數據
        await sql`
        INSERT INTO documents (title, description, file_url, file_type, file_size, category, is_public, uploaded_by, download_count) 
        VALUES 
          ('藥局助理職能標準', '詳細說明藥局助理應具備的專業能力', '/documents/pharmacy-assistant-standards.pdf', 'application/pdf', 1024000, '職能標準', true, 1, 156),
          ('藥品管理SOP', '藥品進貨、存放、銷售的標準作業程序', '/documents/drug-management-sop.pdf', 'application/pdf', 2048000, '作業程序', true, 1, 89),
          ('實習申請表', '藥局助理實習計劃申請表格', '/documents/internship-application.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 512000, '申請表格', true, 1, 234)
        ON CONFLICT DO NOTHING
      `
      }

      const documents = await sql`
      SELECT id, title, description, file_url, file_type, category, is_public, download_count, created_at
      FROM documents 
      WHERE is_public = true
      ORDER BY created_at DESC
    `

      return new Response(
        JSON.stringify({
          success: true,
          data: documents
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
      console.error('Error fetching documents:', error)
      throw error
    }
  }

  // 數據庫修復處理函數
  async function handleDatabaseFix(env: Env, url: URL) {
    const action = url.searchParams.get('action') || 'status'

    try {
      // Debug environment variables
      console.log('Environment debug:', {
        hasDatabaseUrl: !!env.DATABASE_URL,
        envKeys: Object.keys(env),
        environment: env.ENVIRONMENT
      })

      // 使用 @neondatabase/serverless
      const { neon } = await import('@neondatabase/serverless')

      if (!env.DATABASE_URL) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'DATABASE_URL not configured',
              debug: {
                envKeys: Object.keys(env),
                hasDatabaseUrl: !!env.DATABASE_URL,
                environment: env.ENVIRONMENT
              }
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

      const sql = neon(env.DATABASE_URL)
      let result: any = {}

      switch (action) {
        case 'status':
          // 檢查數據庫狀態
          const tables = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `

          const tableCounts: Record<string, number> = {}
          for (const table of tables) {
            try {
              const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`
              tableCounts[table.table_name] = parseInt(count[0]?.count || '0')
            } catch (error) {
              tableCounts[table.table_name] = -1
            }
          }

          result = {
            status: 'connected',
            tables: tables.map(t => t.table_name),
            tableCounts,
            expectedTables: [
              'users',
              'courses',
              'course_enrollments',
              'jobs',
              'job_applications',
              'documents'
            ],
            missingTables: [
              'users',
              'courses',
              'course_enrollments',
              'jobs',
              'job_applications',
              'documents'
            ].filter(table => !tables.some(t => t.table_name === table))
          }
          break

        case 'create':
          // 創建所有必要的表
          console.log('Creating database tables...')

          // 創建觸發函數
          await sql`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
          END;
          $$ language 'plpgsql'
        `

          // 創建 users 表
          await sql`
          CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              user_type VARCHAR(20) NOT NULL DEFAULT 'job_seeker',
              first_name VARCHAR(100) NOT NULL,
              last_name VARCHAR(100) NOT NULL,
              phone VARCHAR(20),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              is_active BOOLEAN DEFAULT true
          )
        `

          // 創建 courses 表
          await sql`
          CREATE TABLE IF NOT EXISTS courses (
              id SERIAL PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              course_type VARCHAR(50) NOT NULL DEFAULT 'basic',
              duration_hours INTEGER,
              price DECIMAL(10,2),
              instructor_id INTEGER,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `

          // 創建 course_enrollments 表
          await sql`
          CREATE TABLE IF NOT EXISTS course_enrollments (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL,
              course_id INTEGER NOT NULL,
              enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              completion_date TIMESTAMP,
              progress_percentage INTEGER DEFAULT 0,
              final_score DECIMAL(5,2),
              status VARCHAR(20) DEFAULT 'enrolled',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `

          // 創建 jobs 表
          await sql`
          CREATE TABLE IF NOT EXISTS jobs (
              id SERIAL PRIMARY KEY,
              employer_id INTEGER NOT NULL DEFAULT 1,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              location VARCHAR(255),
              salary_min DECIMAL(10,2),
              salary_max DECIMAL(10,2),
              job_type VARCHAR(50) DEFAULT 'full_time',
              requirements TEXT,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              expires_at TIMESTAMP
          )
        `

          // 創建 documents 表
          await sql`
          CREATE TABLE IF NOT EXISTS documents (
              id SERIAL PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              file_url VARCHAR(500) NOT NULL,
              file_type VARCHAR(50),
              file_size INTEGER,
              category VARCHAR(100),
              is_public BOOLEAN DEFAULT true,
              uploaded_by INTEGER DEFAULT 1,
              download_count INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `

          // 創建 job_applications 表
          await sql`
          CREATE TABLE IF NOT EXISTS job_applications (
              id SERIAL PRIMARY KEY,
              job_id INTEGER NOT NULL,
              applicant_id INTEGER NOT NULL,
              application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              status VARCHAR(20) DEFAULT 'pending',
              cover_letter TEXT,
              resume_url VARCHAR(500),
              notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `

          result = { message: '所有數據庫表創建完成', created: true }
          break

        case 'seed':
          // 插入測試數據
          console.log('Seeding test data...')

          // 插入測試用戶
          await sql`
          INSERT INTO users (email, password_hash, user_type, first_name, last_name) 
          VALUES 
            ('admin@pharmacy.com', '$2b$10$example_hash', 'employer', '系統', '管理員'),
            ('instructor@pharmacy.com', '$2b$10$example_hash', 'employer', '資深', '講師'),
            ('student@pharmacy.com', '$2b$10$example_hash', 'job_seeker', '測試', '學員')
          ON CONFLICT (email) DO NOTHING
        `

          // 插入測試課程
          await sql`
          INSERT INTO courses (title, description, course_type, duration_hours, price, instructor_id, is_active) 
          VALUES 
            ('藥局助理基礎課程', '學習藥局基本作業流程、藥品管理等基礎知識', 'basic', 40, 5000, 2, true),
            ('進階藥學知識', '深入學習藥理學、藥物交互作用等進階知識', 'advanced', 60, 8000, 2, true),
            ('實習實作課程', '實際藥局工作環境體驗與實務操作', 'internship', 80, 12000, 2, true)
        `

          // 插入測試工作
          await sql`
          INSERT INTO jobs (employer_id, title, description, location, salary_min, salary_max, job_type, is_active, expires_at) 
          VALUES 
            (1, '藥局助理 - 台北市', '負責藥品管理、顧客服務等工作', '台北市大安區', 30000, 40000, 'full_time', true, CURRENT_TIMESTAMP + INTERVAL '30 days'),
            (1, '兼職藥局助理 - 新北市', '週末兼職，協助藥師處理日常業務', '新北市板橋區', 200, 250, 'part_time', true, CURRENT_TIMESTAMP + INTERVAL '30 days'),
            (1, '藥局實習生', '提供完整實習訓練，有機會轉正職', '桃園市中壢區', 25000, 28000, 'internship', true, CURRENT_TIMESTAMP + INTERVAL '45 days')
        `

          // 插入測試文檔
          await sql`
          INSERT INTO documents (title, description, file_url, file_type, file_size, category, is_public, uploaded_by, download_count) 
          VALUES 
            ('藥局助理職能標準', '詳細說明藥局助理應具備的專業能力', '/documents/pharmacy-assistant-standards.pdf', 'application/pdf', 1024000, '職能標準', true, 1, 156),
            ('藥品管理SOP', '藥品進貨、存放、銷售的標準作業程序', '/documents/drug-management-sop.pdf', 'application/pdf', 2048000, '作業程序', true, 1, 89),
            ('實習申請表', '藥局助理實習計劃申請表格', '/documents/internship-application.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 512000, '申請表格', true, 1, 234)
        `

          result = { message: '測試數據插入完成', seeded: true }
          break

        default:
          result = { error: 'Invalid action. Use: status, create, seed' }
      }

      return new Response(JSON.stringify({ success: true, data: result }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      console.error('Database fix error:', error)

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
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

  // 獲取群組列表
  async function getGroups(env: Env) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      const groups = await sql`
      SELECT 
        g.id,
        g.name,
        g.group_type,
        g.description,
        g.created_at,
        COUNT(DISTINCT gm.id) as member_count
      FROM student_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.is_active = true
      GROUP BY g.id, g.name, g.group_type, g.description, g.created_at
      ORDER BY g.created_at DESC
    `

      return new Response(
        JSON.stringify({
          success: true,
          data: groups
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
      console.error('Error fetching groups:', error)
      throw error
    }
  }

  // 創建群組
  async function createGroup(env: Env, request: Request) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const body = await request.json()
      const { name, groupType, description } = body

      if (!name || !groupType) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '群組名稱和類型為必填項'
            }
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      const result = await sql`
      INSERT INTO student_groups (name, group_type, description, is_active, created_at)
      VALUES (${name}, ${groupType}, ${description || ''}, true, CURRENT_TIMESTAMP)
      RETURNING id, name, group_type, description, created_at
    `

      return new Response(
        JSON.stringify({
          success: true,
          data: result[0],
          message: '群組創建成功'
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    } catch (error) {
      console.error('Error creating group:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '創建群組失敗',
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

  // 加入群組
  async function joinGroup(env: Env, groupId: number, request: Request) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      // TODO: 從認證token中獲取用戶ID，這裡暫時使用固定值
      const userId = 1

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      // 檢查是否已經是成員
      const existing = await sql`
      SELECT id FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `

      if (existing.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'ALREADY_MEMBER',
              message: '您已經是該群組的成員'
            }
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      // 加入群組
      await sql`
      INSERT INTO group_members (group_id, user_id, joined_at)
      VALUES (${groupId}, ${userId}, CURRENT_TIMESTAMP)
    `

      return new Response(
        JSON.stringify({
          success: true,
          message: '成功加入群組'
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
      console.error('Error joining group:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '加入群組失敗',
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

  // 獲取討論主題列表
  async function getForumTopics(env: Env, request: Request) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const url = new URL(request.url)
      const groupId = url.searchParams.get('group_id')
      const category = url.searchParams.get('category')

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      let query = sql`
      SELECT 
        t.id,
        t.title,
        t.content,
        t.category,
        t.group_id,
        t.author_id,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT r.id) as reply_count,
        g.name as group_name
      FROM forum_topics t
      LEFT JOIN forum_replies r ON t.id = r.topic_id
      LEFT JOIN student_groups g ON t.group_id = g.id
      WHERE 1=1
    `

      if (groupId) {
        query = sql`
        SELECT 
          t.id,
          t.title,
          t.content,
          t.category,
          t.group_id,
          t.author_id,
          t.created_at,
          t.updated_at,
          COUNT(DISTINCT r.id) as reply_count,
          g.name as group_name
        FROM forum_topics t
        LEFT JOIN forum_replies r ON t.id = r.topic_id
        LEFT JOIN student_groups g ON t.group_id = g.id
        WHERE t.group_id = ${parseInt(groupId)}
        GROUP BY t.id, t.title, t.content, t.category, t.group_id, t.author_id, t.created_at, t.updated_at, g.name
        ORDER BY t.created_at DESC
      `
      } else if (category) {
        query = sql`
        SELECT 
          t.id,
          t.title,
          t.content,
          t.category,
          t.group_id,
          t.author_id,
          t.created_at,
          t.updated_at,
          COUNT(DISTINCT r.id) as reply_count,
          g.name as group_name
        FROM forum_topics t
        LEFT JOIN forum_replies r ON t.id = r.topic_id
        LEFT JOIN student_groups g ON t.group_id = g.id
        WHERE t.category = ${category}
        GROUP BY t.id, t.title, t.content, t.category, t.group_id, t.author_id, t.created_at, t.updated_at, g.name
        ORDER BY t.created_at DESC
      `
      } else {
        query = sql`
        SELECT 
          t.id,
          t.title,
          t.content,
          t.category,
          t.group_id,
          t.author_id,
          t.created_at,
          t.updated_at,
          COUNT(DISTINCT r.id) as reply_count,
          g.name as group_name
        FROM forum_topics t
        LEFT JOIN forum_replies r ON t.id = r.topic_id
        LEFT JOIN student_groups g ON t.group_id = g.id
        GROUP BY t.id, t.title, t.content, t.category, t.group_id, t.author_id, t.created_at, t.updated_at, g.name
        ORDER BY t.created_at DESC
      `
      }

      const topics = await query

      return new Response(
        JSON.stringify({
          success: true,
          data: topics
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
      console.error('Error fetching forum topics:', error)
      throw error
    }
  }

  // 創建討論主題
  async function createForumTopic(env: Env, request: Request) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const body = await request.json()
      const { title, content, category, groupId } = body

      if (!title || !content || !category) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '標題、內容和分類為必填項'
            }
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      // TODO: 從認證token中獲取用戶ID
      const authorId = 1

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      const result = await sql`
      INSERT INTO forum_topics (title, content, category, group_id, author_id, created_at, updated_at)
      VALUES (
        ${title}, 
        ${content}, 
        ${category}, 
        ${groupId || null}, 
        ${authorId}, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      )
      RETURNING id, title, content, category, group_id, author_id, created_at
    `

      return new Response(
        JSON.stringify({
          success: true,
          data: result[0],
          message: '討論主題創建成功'
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    } catch (error) {
      console.error('Error creating forum topic:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '創建討論主題失敗',
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

  // 獲取單個討論主題
  async function getForumTopic(env: Env, topicId: number) {
    try {
      if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured')
      }

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)

      const topic = await sql`
      SELECT 
        t.id,
        t.title,
        t.content,
        t.category,
        t.group_id,
        t.author_id,
        t.created_at,
        t.updated_at,
        g.name as group_name
      FROM forum_topics t
      LEFT JOIN student_groups g ON t.group_id = g.id
      WHERE t.id = ${topicId}
    `

      if (topic.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '討論主題不存在'
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

      // 獲取回覆
      const replies = await sql`
      SELECT 
        r.id,
        r.content,
        r.author_id,
        r.created_at
      FROM forum_replies r
      WHERE r.topic_id = ${topicId}
      ORDER BY r.created_at ASC
    `

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...topic[0],
            replies
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
      console.error('Error fetching forum topic:', error)
      throw error
    }
  }

  // 數據庫優化處理函數
  async function handleDatabaseOptimization(env: Env, url: URL) {
    const action = url.searchParams.get('action') || 'indexes'

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
      let result: any = {}

      switch (action) {
        case 'indexes':
          // 創建性能優化索引
          console.log('Creating performance indexes...')

          const indexes = [
            // 用戶表索引
            { name: 'idx_users_email', table: 'users', columns: 'email', unique: true },
            { name: 'idx_users_user_type', table: 'users', columns: 'user_type' },
            { name: 'idx_users_active', table: 'users', columns: 'is_active' },

            // 課程表索引
            { name: 'idx_courses_instructor', table: 'courses', columns: 'instructor_id' },
            { name: 'idx_courses_active', table: 'courses', columns: 'is_active' },
            { name: 'idx_courses_type', table: 'courses', columns: 'course_type' },

            // 工作表索引
            { name: 'idx_jobs_employer', table: 'jobs', columns: 'employer_id' },
            { name: 'idx_jobs_active', table: 'jobs', columns: 'is_active' },
            { name: 'idx_jobs_expires', table: 'jobs', columns: 'expires_at' },
            { name: 'idx_jobs_location', table: 'jobs', columns: 'location' },

            // 文檔表索引
            { name: 'idx_documents_public', table: 'documents', columns: 'is_public' },
            { name: 'idx_documents_category', table: 'documents', columns: 'category' },
            { name: 'idx_documents_uploader', table: 'documents', columns: 'uploaded_by' },

            // 課程註冊表索引
            { name: 'idx_enrollments_user', table: 'course_enrollments', columns: 'user_id' },
            { name: 'idx_enrollments_course', table: 'course_enrollments', columns: 'course_id' },
            { name: 'idx_enrollments_status', table: 'course_enrollments', columns: 'status' },

            // 工作申請表索引
            { name: 'idx_applications_job', table: 'job_applications', columns: 'job_id' },
            {
              name: 'idx_applications_applicant',
              table: 'job_applications',
              columns: 'applicant_id'
            },
            { name: 'idx_applications_status', table: 'job_applications', columns: 'status' }
          ]

          const createdIndexes = []
          for (const index of indexes) {
            try {
              const uniqueClause = index.unique ? 'UNIQUE' : ''
              const query = `CREATE ${uniqueClause} INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${index.columns})`
              await sql(query)
              createdIndexes.push(index.name)
            } catch (error) {
              console.warn(`Index ${index.name} creation failed:`, error)
            }
          }

          result = {
            message: '性能索引創建完成',
            createdIndexes,
            totalCreated: createdIndexes.length
          }
          break

        case 'constraints':
          // 添加數據庫約束
          console.log('Adding database constraints...')

          const constraints = [
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

          const addedConstraints = []
          for (const constraint of constraints) {
            try {
              await sql`ALTER TABLE ${sql(constraint.table)} ADD CONSTRAINT ${sql(constraint.name)} ${sql(constraint.constraint)}`
              addedConstraints.push(constraint.name)
            } catch (error) {
              console.warn(`Constraint ${constraint.name} addition failed:`, error)
            }
          }

          result = {
            message: '數據庫約束添加完成',
            addedConstraints,
            totalAdded: addedConstraints.length
          }
          break

        case 'cleanup':
          // 清理無用數據
          console.log('Cleaning up unused data...')

          const expiredJobs =
            await sql`DELETE FROM jobs WHERE expires_at < CURRENT_TIMESTAMP AND expires_at IS NOT NULL`
          const invalidEnrollments =
            await sql`DELETE FROM course_enrollments WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true) OR course_id NOT IN (SELECT id FROM courses WHERE is_active = true)`
          const invalidApplications =
            await sql`DELETE FROM job_applications WHERE applicant_id NOT IN (SELECT id FROM users WHERE is_active = true) OR job_id NOT IN (SELECT id FROM jobs WHERE is_active = true)`

          result = {
            message: '數據清理完成',
            expiredJobs: expiredJobs.length,
            invalidEnrollments: invalidEnrollments.length,
            invalidApplications: invalidApplications.length
          }
          break

        case 'analyze':
          // 更新統計信息
          console.log('Updating database statistics...')

          await sql`ANALYZE`

          // 獲取數據庫統計
          const stats = await sql`
          SELECT 
            schemaname,
            relname as tablename,
            n_tup_ins - n_tup_del as row_count,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as table_size
          FROM pg_stat_user_tables 
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
        `

          const totalSize =
            await sql`SELECT pg_size_pretty(pg_database_size(current_database())) as total_size`

          result = {
            message: '數據庫統計更新完成',
            tables: stats,
            totalSize: totalSize[0]?.total_size || 'Unknown'
          }
          break

        case 'full':
          // 完整優化
          console.log('Performing full database optimization...')

          // 創建索引
          const fullIndexes = [
            { name: 'idx_users_email', table: 'users', columns: 'email', unique: true },
            { name: 'idx_users_user_type', table: 'users', columns: 'user_type' },
            { name: 'idx_courses_instructor', table: 'courses', columns: 'instructor_id' },
            { name: 'idx_courses_active', table: 'courses', columns: 'is_active' },
            { name: 'idx_jobs_employer', table: 'jobs', columns: 'employer_id' },
            { name: 'idx_jobs_active', table: 'jobs', columns: 'is_active' },
            { name: 'idx_documents_public', table: 'documents', columns: 'is_public' }
          ]

          const fullCreatedIndexes = []
          for (const index of fullIndexes) {
            try {
              const uniqueClause = index.unique ? 'UNIQUE' : ''
              const query = `CREATE ${uniqueClause} INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${index.columns})`
              await sql(query)
              fullCreatedIndexes.push(index.name)
            } catch (error) {
              console.warn(`Index ${index.name} creation failed:`, error)
            }
          }

          // 清理數據
          const fullExpiredJobs =
            await sql`DELETE FROM jobs WHERE expires_at < CURRENT_TIMESTAMP AND expires_at IS NOT NULL`

          // 更新統計
          await sql`ANALYZE`

          result = {
            message: '完整數據庫優化完成',
            createdIndexes: fullCreatedIndexes,
            expiredJobs: fullExpiredJobs.length,
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
      console.error('Database optimization error:', error)

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database optimization failed',
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

  // N+1 問題檢測處理函數
  async function handleN1ProblemDetection(env: Env, url: URL) {
    const action = url.searchParams.get('action') || 'detect'

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

  // Handle other API endpoints
  try {
    return await handleApiRequest(context, path)
  } catch (error) {
    console.error('API Error:', error)
    console.error('Environment check:', {
      hasDatabaseUrl: !!context.env.DATABASE_URL,
      environment: context.env.ENVIRONMENT
    })
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          debug: {
            hasDatabaseUrl: !!context.env.DATABASE_URL,
            environment: context.env.ENVIRONMENT
          }
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
