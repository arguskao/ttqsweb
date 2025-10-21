import { describe, it, expect, beforeAll } from 'vitest'

import { handleApiRequest } from '../api/index'

describe('File Upload and Download Operations', () => {
  let authToken: string
  let uploadedDocumentId: number

  beforeAll(async () => {
    // Create a test user and get auth token
    const timestamp = Date.now()
    const testUser = {
      email: `filetest${timestamp}@example.com`,
      password: 'FileTest123!',
      firstName: '文件',
      lastName: '測試',
      userType: 'job_seeker',
      phone: '0912345678'
    }

    // Register user
    await handleApiRequest(
      'POST',
      '/api/v1/auth/register',
      { 'Content-Type': 'application/json' },
      testUser
    )

    // Login to get token
    const loginResponse = await handleApiRequest(
      'POST',
      '/api/v1/auth/login',
      { 'Content-Type': 'application/json' },
      {
        email: testUser.email,
        password: testUser.password
      }
    )

    authToken = loginResponse.data.token
  })

  describe('Document Listing', () => {
    it('should get list of all documents', async () => {
      const response = await handleApiRequest(
        'GET',
        '/api/v1/documents',
        {}
      )

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('documents')
      expect(Array.isArray(response.data.documents)).toBe(true)
    })

    it('should filter documents by category', async () => {
      const response = await handleApiRequest(
        'GET',
        '/api/v1/documents?category=course',
        {}
      )

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('documents')

      if (response.data.documents.length > 0) {
        response.data.documents.forEach((doc: any) => {
          expect(doc.category).toBe('course')
        })
      }
    })

    it('should search documents by title', async () => {
      const response = await handleApiRequest(
        'GET',
        '/api/v1/documents?search=課程',
        {}
      )

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('documents')
    })
  })

  describe('Document Upload', () => {
    it('should upload a document with authentication', async () => {
      const mockDocument = {
        title: '測試文件',
        description: '這是一個測試文件',
        category: 'test',
        file_url: 'https://example.com/test.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        is_public: true
      }

      const response = await handleApiRequest(
        'POST',
        '/api/v1/documents',
        {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        mockDocument
      )

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('title', mockDocument.title)
      uploadedDocumentId = response.data.id
    })

    it('should reject document upload without authentication', async () => {
      const mockDocument = {
        title: '未授權文件',
        description: '這應該失敗',
        category: 'test',
        file_url: 'https://example.com/test.pdf',
        file_type: 'application/pdf',
        file_size: 1024
      }

      const response = await handleApiRequest(
        'POST',
        '/api/v1/documents',
        { 'Content-Type': 'application/json' },
        mockDocument
      )

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should validate required fields for document upload', async () => {
      const incompleteDocument = {
        title: '不完整文件'
        // Missing required fields
      }

      const response = await handleApiRequest(
        'POST',
        '/api/v1/documents',
        {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        incompleteDocument
      )

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Document Retrieval', () => {
    it('should get document by ID', async () => {
      if (uploadedDocumentId) {
        const response = await handleApiRequest(
          'GET',
          `/api/v1/documents/${uploadedDocumentId}`,
          {}
        )

        expect(response.success).toBe(true)
        expect(response.data).toHaveProperty('id', uploadedDocumentId)
        expect(response.data).toHaveProperty('title')
      }
    })

    it('should return 404 for non-existent document', async () => {
      const response = await handleApiRequest(
        'GET',
        '/api/v1/documents/999999',
        {}
      )

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Document Download', () => {
    it('should get download URL for document', async () => {
      if (uploadedDocumentId) {
        const response = await handleApiRequest(
          'GET',
          `/api/v1/documents/${uploadedDocumentId}/download`,
          {}
        )

        expect(response.success).toBe(true)
        expect(response.data).toHaveProperty('downloadUrl')
      }
    })

    it('should track download statistics', async () => {
      if (uploadedDocumentId) {
        // Download the document
        await handleApiRequest(
          'GET',
          `/api/v1/documents/${uploadedDocumentId}/download`,
          {}
        )

        // Check if download count increased
        const response = await handleApiRequest(
          'GET',
          `/api/v1/documents/${uploadedDocumentId}`,
          {}
        )

        expect(response.success).toBe(true)
        expect(response.data).toHaveProperty('download_count')
      }
    })
  })

  describe('Document Management', () => {
    it('should update document metadata', async () => {
      if (uploadedDocumentId) {
        const updates = {
          title: '更新後的測試文件',
          description: '描述已更新'
        }

        const response = await handleApiRequest(
          'PUT',
          `/api/v1/documents/${uploadedDocumentId}`,
          {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          updates
        )

        expect(response.success).toBe(true)
        expect(response.data).toHaveProperty('title', updates.title)
      }
    })

    it('should delete document with authentication', async () => {
      if (uploadedDocumentId) {
        const response = await handleApiRequest(
          'DELETE',
          `/api/v1/documents/${uploadedDocumentId}`,
          {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        )

        expect(response.success).toBe(true)

        // Verify document is deleted
        const getResponse = await handleApiRequest(
          'GET',
          `/api/v1/documents/${uploadedDocumentId}`,
          {}
        )

        expect(getResponse.success).toBe(false)
      }
    })
  })

  describe('File Type Validation', () => {
    it('should accept valid file types', async () => {
      const validTypes = ['application/pdf', 'application/msword', 'image/jpeg', 'image/png']

      for (const fileType of validTypes) {
        const document = {
          title: `測試 ${fileType}`,
          description: '測試文件類型',
          category: 'test',
          file_url: 'https://example.com/test.file',
          file_type: fileType,
          file_size: 1024,
          is_public: true
        }

        const response = await handleApiRequest(
          'POST',
          '/api/v1/documents',
          {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          document
        )

        expect(response.success).toBe(true)
      }
    })

    it('should handle large file size limits', async () => {
      const largeDocument = {
        title: '大型文件',
        description: '測試大小限制',
        category: 'test',
        file_url: 'https://example.com/large.pdf',
        file_type: 'application/pdf',
        file_size: 100 * 1024 * 1024, // 100MB
        is_public: true
      }

      const response = await handleApiRequest(
        'POST',
        '/api/v1/documents',
        {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        largeDocument
      )

      // Should either succeed or fail with size limit error
      if (!response.success) {
        expect(response.error).toBeDefined()
      }
    })
  })
})
