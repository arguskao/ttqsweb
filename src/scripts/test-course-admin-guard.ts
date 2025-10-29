import jwt from 'jsonwebtoken'

import { requireRole } from '../api/auth-middleware'
import type { ApiRequest, ApiResponse } from '../api/types'

function createToken(userType: string) {
  const secret = process.env.JWT_SECRET || '3939889'
  return jwt.sign(
    {
      userId: 1,
      email: 'admin@example.com',
      userType
    },
    secret,
    { expiresIn: '1h', issuer: 'pharmacy-assistant-academy', audience: 'pharmacy-assistant-academy-users' }
  )
}

async function run() {
  const mw = requireRole(['admin'])

  const makeReq = (token?: string): ApiRequest => ({
    method: 'GET',
    url: '/api/v1/course-applications',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: undefined,
    query: {},
    params: {}
  })

  const next = async (): Promise<ApiResponse> => ({ success: true, data: { ok: true } })

  // Admin token should pass
  const adminToken = createToken('admin')
  const adminReq = makeReq(adminToken)
  const adminRes = await mw(adminReq as any, next)
  console.log('adminRes:', adminRes)

  // Non-admin should fail
  const userToken = createToken('job_seeker')
  const userReq = makeReq(userToken)
  try {
    await mw(userReq as any, next)
    console.log('nonAdminRes: unexpectedly passed')
  } catch (e: any) {
    console.log('nonAdminRes error:', e?.message || e)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
