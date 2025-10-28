import { vi } from 'vitest'

// Mock test data
export const mockTestData = {
  users: [
    {
      id: 1,
      email: 'test@example.com',
      password_hash: '$2b$10$mockhash',
      user_type: 'job_seeker',
      first_name: 'Test',
      last_name: 'User',
      phone: '0912345678',
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    },
    {
      id: 2,
      email: 'employer@example.com',
      password_hash: '$2b$10$mockhash',
      user_type: 'employer',
      first_name: 'Employer',
      last_name: 'User',
      phone: '0987654321',
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    }
  ],
  courses: [
    {
      id: 1,
      title: '藥學入門',
      description: '基礎藥學知識課程',
      course_type: '基礎課程',
      duration_hours: 40,
      price: 5000,
      instructor_id: 1,
      is_active: true,
      created_at: new Date()
    },
    {
      id: 2,
      title: '藥劑學進階',
      description: '進階藥劑學課程',
      course_type: '進階課程',
      duration_hours: 60,
      price: 8000,
      instructor_id: 2,
      is_active: true,
      created_at: new Date()
    }
  ],
  jobs: [
    {
      id: 1,
      title: '藥局助理',
      company: '測試藥局',
      location: '台北市',
      salary: '30000-35000',
      description: '協助藥師處理藥品相關事務',
      requirements: '具備基本藥學知識',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 2,
      title: '藥師',
      company: '大型連鎖藥局',
      location: '新北市',
      salary: '50000-60000',
      description: '負責藥品調劑和諮詢服務',
      requirements: '具備藥師執照',
      is_active: true,
      created_at: new Date()
    }
  ],
  instructors: [
    {
      id: 1,
      first_name: '張',
      last_name: '老師',
      email: 'instructor@example.com',
      phone: '0912345678',
      specialization: '藥學',
      experience_years: 10,
      is_active: true,
      created_at: new Date()
    },
    {
      id: 2,
      first_name: '李',
      last_name: '教授',
      email: 'professor@example.com',
      phone: '0987654321',
      specialization: '藥劑學',
      experience_years: 15,
      is_active: true,
      created_at: new Date()
    }
  ],
  documents: [
    {
      id: 1,
      title: '測試文件',
      description: '這是一個測試文件',
      file_url: 'https://example.com/test.pdf',
      file_type: 'application/pdf',
      file_size: 1024,
      category: 'course',
      is_public: true,
      uploaded_by: 1,
      download_count: 0,
      created_at: new Date()
    },
    {
      id: 2,
      title: '藥學手冊',
      description: '藥學基礎知識手冊',
      file_url: 'https://example.com/handbook.pdf',
      file_type: 'application/pdf',
      file_size: 2048,
      category: 'reference',
      is_public: true,
      uploaded_by: 1,
      download_count: 0,
      created_at: new Date()
    }
  ]
}

// Mock database functions
export const createMockDatabase = () => {
  const mockQuery = vi.fn(async (query: string, values?: any[]) => {
    // Mock responses based on query content
    if (query.includes('SELECT * FROM users WHERE email')) {
      const email = values?.[0]
      const user = mockTestData.users.find(u => u.email === email)
      return user ? [user] : []
    }

    if (query.includes('SELECT * FROM users WHERE id')) {
      const id = values?.[0]
      const user = mockTestData.users.find(u => u.id === id)
      return user ? [user] : []
    }

    if (query.includes('INSERT INTO users')) {
      const newUser = {
        id: Date.now(),
        email: values?.[0] || 'newuser@example.com',
        user_type: values?.[2] || 'job_seeker',
        first_name: values?.[3] || 'New',
        last_name: values?.[4] || 'User',
        phone: values?.[5] || '0912345678',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true
      }
      mockTestData.users.push(newUser)
      return [newUser]
    }

    if (query.includes('UPDATE users SET')) {
      const id = values?.[values.length - 1]
      const user = mockTestData.users.find(u => u.id === id)
      if (user) {
        user.phone = values?.[0] || user.phone
        user.updated_at = new Date()
        return [user]
      }
      return []
    }

    if (query.includes('SELECT * FROM courses')) {
      return mockTestData.courses
    }

    if (query.includes('SELECT * FROM jobs')) {
      return mockTestData.jobs
    }

    if (query.includes('SELECT * FROM instructors') || query.includes('FROM instructor_applications')) {
      return mockTestData.instructors
    }

    if (query.includes('SELECT * FROM documents')) {
      return mockTestData.documents
    }

    return []
  })

  const mockQueryOne = vi.fn(async (query: string, values?: any[]) => {
    const results = await mockQuery(query, values)
    return results[0] || null
  })

  const mockQueryMany = vi.fn(async (query: string, values?: any[]) => {
    return await mockQuery(query, values)
  })

  const mockTransaction = vi.fn(async (callback: any) => {
    return await callback({
      query: mockQuery,
      queryOne: mockQueryOne,
      queryMany: mockQueryMany
    })
  })

  return {
    query: mockQuery,
    queryOne: mockQueryOne,
    queryMany: mockQueryMany,
    transaction: mockTransaction,
    tableExists: vi.fn(async () => true),
    getTableRowCount: vi.fn(async () => 1),
    executeRaw: vi.fn(async (sqlText: string, values?: any[]) => {
      const result = await mockQuery(sqlText, values)
      return { rows: result, rowCount: result.length }
    })
  }
}

// Setup all mocks
export const setupAllMocks = () => {
  const mockDb = createMockDatabase()

  // Mock @neondatabase/serverless's neon function
  vi.mock('@neondatabase/serverless', () => ({
    neon: vi.fn(() => mockDb.query)
  }))

  // Mock @/utils/cloudflare-database
  vi.mock('@/utils/cloudflare-database', () => ({
    cloudflareDb: mockDb,
    db: mockDb,
    query: mockDb.query,
    queryOne: mockDb.queryOne,
    queryMany: mockDb.queryMany,
    transaction: mockDb.transaction
  }))

  // Mock @/utils/neon-database
  vi.mock('@/utils/neon-database', () => ({
    NeonDatabaseManager: vi.fn().mockImplementation(() => mockDb),
    neonDb: mockDb,
    query: mockDb.query,
    queryOne: mockDb.queryOne,
    queryMany: mockDb.queryMany,
    transaction: mockDb.transaction,
    db: mockDb
  }))

  // Mock @/config/database
  vi.mock('@/config/database', () => ({
    getDatabasePool: vi.fn(() => ({
      connect: vi.fn(() => Promise.resolve({
        query: mockDb.query,
        release: vi.fn()
      })),
      query: mockDb.query,
      end: vi.fn(() => Promise.resolve())
    })),
    createDatabasePool: vi.fn(),
    getDatabase: vi.fn(),
    closeDatabasePool: vi.fn(),
    testDatabaseConnection: vi.fn()
  }))

  // Mock @/utils/database
  vi.mock('@/utils/database', () => ({
    DatabaseUtils: vi.fn().mockImplementation(() => mockDb),
    db: mockDb,
    query: mockDb.query,
    queryOne: mockDb.queryOne,
    queryMany: mockDb.queryMany,
    transaction: mockDb.transaction,
    tableExists: mockDb.tableExists,
    getTableRowCount: mockDb.getTableRowCount,
    executeRaw: mockDb.executeRaw
  }))
}

// Reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks()
}


