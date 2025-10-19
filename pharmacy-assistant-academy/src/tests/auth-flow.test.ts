import { describe, it, expect } from 'vitest'
import { handleApiRequest } from '../api/index'

describe('User Authentication Flow', () => {
    const timestamp = Date.now()
    const jobSeekerUser = {
        email: `jobseeker${timestamp}@example.com`,
        password: 'JobSeeker123!',
        firstName: '求職者',
        lastName: '測試',
        userType: 'job_seeker',
        phone: '0912345678'
    }

    const employerUser = {
        email: `employer${timestamp}@example.com`,
        password: 'Employer123!',
        firstName: '雇主',
        lastName: '測試',
        userType: 'employer',
        phone: '0923456789'
    }

    let jobSeekerToken: string
    let employerToken: string

    describe('Job Seeker Registration and Login Flow', () => {
        it('should register a job seeker successfully', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/register',
                { 'Content-Type': 'application/json' },
                jobSeekerUser
            )

            expect(response.success).toBe(true)
            expect(response.data.user).toHaveProperty('email', jobSeekerUser.email)
            expect(response.data.user).toHaveProperty('userType', 'job_seeker')
            expect(response.data.user).toHaveProperty('firstName', jobSeekerUser.firstName)
        })

        it('should prevent duplicate email registration', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/register',
                { 'Content-Type': 'application/json' },
                jobSeekerUser
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })

        it('should login job seeker and receive token', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/login',
                { 'Content-Type': 'application/json' },
                {
                    email: jobSeekerUser.email,
                    password: jobSeekerUser.password
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('token')
            expect(response.data).toHaveProperty('user')
            expect(response.data.user.userType).toBe('job_seeker')
            jobSeekerToken = response.data.token
        })

        it('should access protected profile endpoint with token', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/auth/profile',
                {
                    'Authorization': `Bearer ${jobSeekerToken}`,
                    'Content-Type': 'application/json'
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('email', jobSeekerUser.email)
            expect(response.data).toHaveProperty('userType', 'job_seeker')
        })

        it('should update job seeker profile', async () => {
            const response = await handleApiRequest(
                'PUT',
                '/api/v1/users/profile',
                {
                    'Authorization': `Bearer ${jobSeekerToken}`,
                    'Content-Type': 'application/json'
                },
                {
                    phone: '0987654321'
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('user')
            expect(response.data.user).toHaveProperty('phone', '0987654321')
        })
    })

    describe('Employer Registration and Login Flow', () => {
        it('should register an employer successfully', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/register',
                { 'Content-Type': 'application/json' },
                employerUser
            )

            expect(response.success).toBe(true)
            expect(response.data.user).toHaveProperty('email', employerUser.email)
            expect(response.data.user).toHaveProperty('userType', 'employer')
        })

        it('should login employer and receive token', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/login',
                { 'Content-Type': 'application/json' },
                {
                    email: employerUser.email,
                    password: employerUser.password
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('token')
            expect(response.data.user.userType).toBe('employer')
            employerToken = response.data.token
        })

        it('should access employer-specific endpoints', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/jobs/employer',
                {
                    'Authorization': `Bearer ${employerToken}`,
                    'Content-Type': 'application/json'
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).toHaveProperty('jobs')
        })
    })

    describe('Token Validation and Security', () => {
        it('should reject invalid token format', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/auth/profile',
                {
                    'Authorization': 'Bearer invalid-token',
                    'Content-Type': 'application/json'
                }
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })

        it('should reject expired or malformed tokens', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/auth/profile',
                {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
                    'Content-Type': 'application/json'
                }
            )

            expect(response.success).toBe(false)
        })

        it('should reject requests without authorization header', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/auth/profile',
                { 'Content-Type': 'application/json' }
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })
    })

    describe('Password Security', () => {
        it('should reject weak passwords', async () => {
            const response = await handleApiRequest(
                'POST',
                '/api/v1/auth/register',
                { 'Content-Type': 'application/json' },
                {
                    email: `weak${timestamp}@example.com`,
                    password: '123',
                    firstName: '測試',
                    lastName: '用戶',
                    userType: 'job_seeker',
                    phone: '0912345678'
                }
            )

            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
        })

        it('should not return password in user data', async () => {
            const response = await handleApiRequest(
                'GET',
                '/api/v1/auth/profile',
                {
                    'Authorization': `Bearer ${jobSeekerToken}`,
                    'Content-Type': 'application/json'
                }
            )

            expect(response.success).toBe(true)
            expect(response.data).not.toHaveProperty('password')
            expect(response.data).not.toHaveProperty('passwordHash')
        })
    })
})