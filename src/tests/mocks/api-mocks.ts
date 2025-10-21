// Mock API service for testing
import { vi } from 'vitest'

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

// Setup default mocks
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
export const resetApiMocks = () => {
  Object.values(mockApiService).forEach(mock => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset()
    }
  })
}
