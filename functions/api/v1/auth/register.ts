/**
 * 註冊端點 - Cloudflare Workers兼容版本
 * 使用 @neondatabase/serverless 而不是 pg Pool
 */

export const onRequest = async (context: any) => {
    try {
        const { request, env } = context;

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
            });
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
            });
        }

        const body = await request.json();
        const { email, password, userType, firstName, lastName, phone } = body;

        // 驗證輸入
        if (!email || !password || !userType || !firstName || !lastName) {
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '所有必填欄位都必須提供'
                }
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 驗證email格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
            });
        }

        // 驗證密碼強度
        if (password.length < 8) {
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '密碼必須至少8個字符'
                }
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 驗證用戶類型
        if (!['admin', 'instructor', 'employer', 'job_seeker'].includes(userType)) {
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '用戶類型必須是管理員、講師、雇主或求職者'
                }
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 連接數據庫
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(env.DATABASE_URL);

        // 檢查用戶是否已存在
        const existingUser = await sql`
            SELECT id FROM users WHERE email = ${email} LIMIT 1
        `;

        if (existingUser.length > 0) {
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: '此電子郵件已被註冊'
                }
            }), {
                status: 409,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 加密密碼
        const bcrypt = await import('bcryptjs');
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 插入新用戶
        const result = await sql`
            INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
            VALUES (${email}, ${passwordHash}, ${userType}, ${firstName}, ${lastName}, ${phone || null})
            RETURNING id, email, user_type, first_name, last_name, phone, 
                      created_at, updated_at, is_active
        `;

        if (result.length === 0) {
            throw new Error('創建用戶失敗');
        }

        const user = result[0];

        // 生成JWT token
        const jwt = await import('jsonwebtoken');
        const secret = env.JWT_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET未設置');
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
        );

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
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error: any) {
        console.error('註冊錯誤:', error);

        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: '註冊失敗',
                details: error.message
            }
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
};
