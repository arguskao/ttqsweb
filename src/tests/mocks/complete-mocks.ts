// Complete test environment mocks
import { vi } from 'vitest'

// Mock Neon database
export const mockNeonDatabase = {
  query: vi.fn(),
  queryOne: vi.fn(),
  queryMany: vi.fn(),
  transaction: vi.fn()
}

// Mock API service
export const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn()
}

// Mock successful responses
export const mockSuccessResponse = (data: any) => ({
  success: true,
  data,
  error: null
})

// Mock error responses
export const mockErrorResponse = (message: string, code = 'ERROR') => ({
  success: false,
  data: null,
  error: {
    code,
    message,
    statusCode: 400
  }
})

// Setup database mocks
export const setupDatabaseMocks = () => {
  // Mock successful database queries
  mockNeonDatabase.query.mockImplementation(async (query: any) => {
    if (typeof query === 'string' && query.includes('SELECT * FROM users WHERE email')) {
      return [
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

    if (typeof query === 'string' && query.includes('SELECT * FROM courses')) {
      return [
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

    if (typeof query === 'string' && query.includes('SELECT * FROM jobs')) {
      return [
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

    if (typeof query === 'string' && query.includes('SELECT * FROM instructors')) {
      return [
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

    if (typeof query === 'string' && query.includes('SELECT * FROM documents')) {
      return [
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

    return []
  })

  mockNeonDatabase.queryOne.mockImplementation(async (query: any) => {
    const results = await mockNeonDatabase.query(query)
    return results[0] || null
  })

  mockNeonDatabase.queryMany.mockImplementation(async (query: any) => {
    return await mockNeonDatabase.query(query)
  })

  mockNeonDatabase.transaction.mockImplementation(async (callback: any) => {
    return await callback(mockNeonDatabase)
  })
}

// Setup API mocks
export const setupApiMocks = () => {
  // Mock successful auth responses
  mockApiService.post.mockImplementation((url: string, data: any) => {
    if (url === '/auth/login') {
      return Promise.resolve(
        mockSuccessResponse({
          user: {
            id: 1,
            email: data.email,
            userType: 'job_seeker',
            firstName: 'Test',
            lastName: 'User'
          },
          token: 'mock-jwt-token'
        })
      )
    }

    if (url === '/auth/register') {
      return Promise.resolve(
        mockSuccessResponse({
          user: {
            id: 1,
            email: data.email,
            userType: data.userType,
            firstName: data.firstName,
            lastName: data.lastName
          },
          token: 'mock-jwt-token'
        })
      )
    }

    if (url === '/auth/logout') {
      return Promise.resolve(mockSuccessResponse({ message: '登出成功' }))
    }

    // Default success response
    return Promise.resolve(mockSuccessResponse({}))
  })

  // Mock successful GET responses
  mockApiService.get.mockImplementation((url: string) => {
    if (url === '/auth/profile') {
      return Promise.resolve(
        mockSuccessResponse({
          user: {
            id: 1,
            email: 'test@example.com',
            userType: 'job_seeker',
            firstName: 'Test',
            lastName: 'User'
          }
        })
      )
    }

    if (url === '/courses') {
      return Promise.resolve(
        mockSuccessResponse({
          courses: [
            {
              id: 1,
              title: '藥學入門',
              description: '基礎藥學知識課程',
              course_type: '基礎課程',
              duration_hours: 40,
              price: 5000,
              instructor_id: 1,
              is_active: true
            }
          ]
        })
      )
    }

    if (url === '/jobs') {
      return Promise.resolve(
        mockSuccessResponse({
          jobs: [
            {
              id: 1,
              title: '藥局助理',
              company: '測試藥局',
              location: '台北市',
              salary: '30000-35000',
              is_active: true
            }
          ]
        })
      )
    }

    if (url === '/instructors') {
      return Promise.resolve(
        mockSuccessResponse({
          instructors: [
            {
              id: 1,
              first_name: '張',
              last_name: '老師',
              email: 'instructor@example.com',
              specialization: '藥學',
              experience_years: 10,
              is_active: true
            }
          ]
        })
      )
    }

    if (url === '/documents') {
      return Promise.resolve(
        mockSuccessResponse({
          documents: [
            {
              id: 1,
              title: '測試文件',
              description: '這是一個測試文件',
              file_url: 'https://example.com/test.pdf',
              file_type: 'application/pdf',
              category: 'course',
              is_public: true,
              download_count: 0
            }
          ]
        })
      )
    }

    // Default success response
    return Promise.resolve(mockSuccessResponse({}))
  })

  // Mock successful PUT responses
  mockApiService.put.mockImplementation((url: string, data: any) => {
    if (url === '/auth/profile' || url === '/users/profile') {
      return Promise.resolve(
        mockSuccessResponse({
          user: {
            id: 1,
            email: 'test@example.com',
            userType: 'job_seeker',
            firstName: 'Test',
            lastName: 'User',
            phone: data.phone || '0912345678'
          }
        })
      )
    }

    return Promise.resolve(mockSuccessResponse({}))
  })

  // Mock successful DELETE responses
  mockApiService.delete.mockImplementation(() => {
    return Promise.resolve(mockSuccessResponse({ message: '刪除成功' }))
  })
}

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockApiService).forEach(mock => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset()
    }
  })

  Object.values(mockNeonDatabase).forEach(mock => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset()
    }
  })
}

// Setup all mocks
export const setupAllMocks = () => {
  setupDatabaseMocks()
  setupApiMocks()
}
