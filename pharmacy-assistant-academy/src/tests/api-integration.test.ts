import { describe, it, expect, beforeAll } from 'vitest'
import { handleApiRequest } from '../api/index'
import type { ApiResponse } from '../api/types'

describe('API Integration Tests', () => {
    describe('Health Check Endpoints', () => {
        it('should return healthy status from /api/v1/health', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/health',
                {}
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('status', 'healthy')
            expect(response.data).toHaveProperty('timestamp')
            expect(response.data).toHaveProperty('version')
        })

        it('should return API info from /api/v1/info', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/info',
                {}
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('name')
            expect(response.data).toHaveProperty('version')
            expect(response.data).toHaveProperty('endpoints')
            expect(response.data.endpoints).toHaveProperty('auth')
            expect(response.data.endpoints).toHaveProperty('courses')
            expect(response.data.endpoints).toHaveProperty('jobs')
        })
    })

    describe('Authentication Endpoints', () => {
        const testUser = {
            email: `test${Date.now()}@example.com`,
            password: 'Test123456!',
            firstName: '測試',
            lastName: '用戶',
            userType: 'job_seeker',
            phone: '0912345678'
        }

        let authToken: string

        it('should register a new user', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/register',
                { 'Content-Type': 'application/json' },
                testUser
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('user')
            expect(response.data.user).toHaveProperty('email', testUser.email)
            expect(response.data.user).toHaveProperty('userType', testUser.userType)
        })

        it('should login with valid credentials', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/login',
                { 'Content-Type': 'application/json' },
                {
                    email: testUser.email,
                    password: testUser.password
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('token')
            expect(response.data).toHaveProperty('user')
            authToken = response.data.token
        })

        it('should fail login with invalid credentials', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/login',
                { 'Content-Type': 'application/json' },
                {
                    email: testUser.email,
                    password: 'wrongpassword'
                }
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })

        it('should get user profile with valid token', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/auth/profile',
                {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('email', testUser.email)
        })

        it('should fail to get profile without token', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/auth/profile',
                { 'Content-Type': 'application/json' }
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })
    })

    describe('Course Endpoints', () => {
        it('should get list of courses', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/courses',
                {}
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('courses')
            expect(Array.isArray(response.data.courses)).toBe(true)
        })

        it('should get course by ID', async () => {
            // First get list of courses
            const listResponse = await handleApiRequest(
                'GET',
                '/api/v1/courses',
                {}
            )

            if (listResponse.data.courses && listResponse.data.courses.length > 0) {
                const courseId = listResponse.data.courses[0].id
                const response = await handleApiRequest(
                    'GET',
                    `/api/v1/courses/${courseId}`,
                    {}
                )

                expect(response.success).toBe(true)
                expect(response.data).toHaveProperty('id', courseId)
            }
        })

        it('should handle non-existent course ID', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/courses/99999',
                {}
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })
    })

    describe('Job Endpoints', () => {
        it('should get list of jobs', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/jobs',
                {}
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('jobs')
            expect(Array.isArray(response.data.jobs)).toBe(true)
        })

        it('should filter jobs by location', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/jobs?location=台北',
                {}
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('jobs')
        })

        it('should get job by ID', async () => {
            const listResponse = await handleApiRequest(
                'GET',
                '/api/v1/jobs',
                {}
            )

            if (listResponse.data.jobs && listResponse.data.jobs.length > 0) {
                const jobId = listResponse.data.jobs[0].id
                const response = await handleApiRequest(
                    'GET',
                    `/api/v1/jobs/${jobId}`,
                    {}
                )

                expect(response.success).toBe(true)
                expect(response.data).toHaveProperty('id', jobId)
            }
        })
    })

    describe('Instructor Endpoints', () => {
        it('should get list of instructors', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/instructors',
                {}
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('instructors')
            expect(Array.isArray(response.data.instructors)).toBe(true)
        })

        it('should get instructor by ID', async () => {
            const listResponse = await handleApiRequest(
                'GET',
                '/api/v1/instructors',
                {}
            )

            if (listResponse.data.instructors && listResponse.data.instructors.length > 0) {
                const instructorId = listResponse.data.instructors[0].id
                const response = await handleApiRequest(
                    'GET',
                    `/api/v1/instructors/${instructorId}`,
                    {}
                )

                expect(response.success).toBe(true)
                expect(response.data).toHaveProperty('id', instructorId)
            }
        })
    })

    describe('Document Endpoints', () => {
        it('should get list of documents', async () => {
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
        })
    })

    describe('Error Handling', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/nonexistent',
                {}
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
            expect(response.error?.message).toContain('路由不存在')
        })

        it('should handle invalid JSON in request body', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/login',
                { 'Content-Type': 'application/json' },
                'invalid json'
            )

            expect(response.success).toBe(false)
        })

        it('should handle missing required fields', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/register',
                { 'Content-Type': 'application/json' },
                {
                    email: 'test@example.com'
                    // Missing required fields
                }
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })
    })
})