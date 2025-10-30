/**
 * 登入端點 - Cloudflare Workers兼容版本
 * 使用 @neondatabase/serverless 而不是 pg Pool
 */

export const onRequest = async (context: any) => {
  try {
    const { request, env } = context

    // 處理CORS預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      })
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '只允許POST請求'
        }
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const body = await request.json()
    const { email, password } = body

    // 驗證輸入
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '電子郵件和密碼都必須提供'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 驗證email格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '電子郵件格式不正確'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 連接數據庫
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(env.DATABASE_URL)

    // 查詢用戶
    const result = await sql`
      SELECT id, email, password_hash, user_type, first_name, last_name, phone,
             created_at, updated_at, is_active
      FROM users
      WHERE email = ${email} AND is_active = true
      LIMIT 1
    `

    if (result.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '電子郵件或密碼不正確'
        }
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const user = result[0]

    // 驗證密碼 - 支援 bcrypt 和舊的 SHA-256 格式
    let isPasswordValid = false

    // 檢查密碼格式
    if (user.password_hash.startsWith('$2')) {
      // bcrypt 格式
      const bcrypt = await import('bcryptjs')
      isPasswordValid = await bcrypt.compare(password, user.password_hash)
    } else if (user.password_hash.length === 64 && /^[a-f0-9]+$/.test(user.password_hash)) {
      // SHA-256 格式（舊格式）
      const crypto = await import('crypto')
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
      isPasswordValid = sha256Hash === user.password_hash
    } else {
      // 未知格式
      console.error('未知的密碼格式:', {
        hashLength: user.password_hash.length,
        hashPrefix: user.password_hash.substring(0, 10)
      })
    }

    if (!isPasswordValid) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '電子郵件或密碼不正確'
        }
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 生成JWT token
    const jwt = await import('jsonwebtoken')
    const secret = env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET未設置')
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type
      },
      secret,
      {
        expiresIn: '24h',
        issuer: 'pharmacy-assistant-academy',
        audience: 'pharmacy-assistant-academy-users'
      }
    )

    // 返回成功響應（匹配前端期望的格式）
    return new Response(JSON.stringify({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          userType: user.user_type,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        tokens: {
          accessToken: token,
          refreshToken: token
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error: any) {
    console.error('登入錯誤:', error)

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '登入失敗',
        details: error.message
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
