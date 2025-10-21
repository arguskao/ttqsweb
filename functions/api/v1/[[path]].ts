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

  // Database fix endpoint
  if (path === '/db/fix') {
    return handleDatabaseFix(context.env, url)
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
