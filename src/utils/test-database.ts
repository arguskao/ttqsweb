// Test database utilities
export const getTestDatabaseConnection = () => {
  // Mock database connection for testing
  return {
    query: async (text: string, params?: any[]) => {
      // Mock query responses for testing
      if (text.includes('SELECT * FROM users WHERE email')) {
        return {
          rows: [
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
            }
          ]
        }
      }

      if (text.includes('SELECT * FROM courses')) {
        return {
          rows: [
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
            }
          ]
        }
      }

      if (text.includes('SELECT * FROM jobs')) {
        return {
          rows: [
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
            }
          ]
        }
      }

      if (text.includes('SELECT * FROM instructors')) {
        return {
          rows: [
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
            }
          ]
        }
      }

      if (text.includes('SELECT * FROM documents')) {
        return {
          rows: [
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
            }
          ]
        }
      }

      // Default response
      return { rows: [] }
    },

    queryOne: async (text: string, params?: any[]) => {
      const result = await (async (text: string, params?: any[]) => {
        // Mock query responses for testing
        if (text.includes('SELECT * FROM users WHERE email')) {
          return {
            rows: [
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
              }
            ]
          }
        }
        return { rows: [] }
      })(text, params)
      return (result as any)?.rows?.[0] || null
    },

    queryMany: async (text: string, params?: any[]) => {
      const result = await (async (text: string, params?: any[]) => {
        // Mock query responses for testing
        if (text.includes('SELECT * FROM users WHERE email')) {
          return {
            rows: [
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
              }
            ]
          }
        }
        return { rows: [] }
      })(text, params)
      return (result as any)?.rows ?? []
    }
  }
}

// Mock database pool for testing
export const getTestDatabasePool = () => ({
  connect: async () => getTestDatabaseConnection(),
  end: async () => {}
})
