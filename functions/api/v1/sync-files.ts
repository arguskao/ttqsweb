/**
 * 同步 R2 存儲桶中的現有文件到數據庫
 * 使用優化後的 documents 表
 */

interface Env {
    DATABASE_URL?: string
    JWT_SECRET?: string
    R2_BUCKET?: R2Bucket
}

interface Context {
    request: Request
    env: Env
}

// 驗證JWT token
async function verifyToken(token: string, secret: string): Promise<any> {
    try {
        const jwt = await import('jsonwebtoken')
        return jwt.verify(token, secret)
    } catch (error) {
        throw new Error('Invalid token')
    }
}

// 從文件名推測文件類型
function getMimeTypeFromFileName(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop()
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogv': 'video/ogg',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json'
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
}

// 從文件路徑推測分類
function getCategoryFromPath(filePath: string): string {
    const path = filePath.toLowerCase()
    if (path.includes('image') || path.includes('img') || /\.(jpg|jpeg|png|gif|webp)$/.test(path)) {
        return 'images'
    }
    if (path.includes('video') || /\.(mp4|webm|ogv)$/.test(path)) {
        return 'videos'
    }
    if (path.includes('document') || path.includes('doc') || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/.test(path)) {
        return 'documents'
    }
    if (path.includes('course') || path.includes('material')) {
        return 'course_materials'
    }
    if (path.includes('avatar') || path.includes('profile')) {
        return 'user_avatars'
    }
    return 'general'
}

export async function onRequestPost(context: Context): Promise<Response> {
    const { request, env } = context

    try {
        console.log('[Sync] 開始同步 R2 文件到數據庫')

        // 檢查認證
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '需要認證'
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        const token = authHeader.substring(7)
        let decoded
        try {
            decoded = await verifyToken(token, env.JWT_SECRET!)
        } catch (error) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '無效的認證令牌'
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        // 檢查用戶權限
        if (decoded.userType !== 'admin') {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '只有管理員可以同步文件'
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        if (!env.R2_BUCKET) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'R2 存儲桶未配置'
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        // 連接數據庫
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(env.DATABASE_URL!)

        // 列出 R2 存儲桶中的所有文件
        console.log('[Sync] 正在列出 R2 存儲桶中的文件...')
        const objects = await env.R2_BUCKET.list()

        console.log(`[Sync] 找到 ${objects.objects.length} 個文件`)

        let syncedCount = 0
        let skippedCount = 0
        const errors: string[] = []

        for (const object of objects.objects) {
            try {
                // 推測文件信息
                const fileName = object.key.split('/').pop() || object.key
                const mimeType = getMimeTypeFromFileName(fileName)
                const category = getCategoryFromPath(object.key)
                const fileUrl = `https://ttqs.8f754ad5f3f5a1d1596d4f54626327b0.r2.cloudflarestorage.com/${object.key}`

                // 檢查文件是否已經在數據庫中
                const existingFile = await sql`
                    SELECT id FROM documents 
                    WHERE file_url = ${fileUrl}
                    LIMIT 1
                `

                if (existingFile.length > 0) {
                    console.log(`[Sync] 跳過已存在的文件: ${object.key}`)
                    skippedCount++
                    continue
                }

                // 插入到數據庫
                await sql`
                    INSERT INTO documents (
                        title, 
                        description, 
                        file_url, 
                        file_type, 
                        file_size, 
                        category, 
                        original_name,
                        file_path,
                        uploaded_by, 
                        created_at
                    ) VALUES (
                        ${fileName},
                        ${'從 R2 存儲桶同步的現有文件'},
                        ${fileUrl},
                        ${mimeType},
                        ${object.size},
                        ${category},
                        ${fileName},
                        ${object.key},
                        ${decoded.userId},
                        ${object.uploaded ? new Date(object.uploaded).toISOString() : new Date().toISOString()}
                    )
                `

                console.log(`[Sync] 已同步文件: ${object.key}`)
                syncedCount++

            } catch (error: any) {
                console.error(`[Sync] 同步文件失敗 ${object.key}:`, error)
                errors.push(`${object.key}: ${error.message}`)
            }
        }

        console.log(`[Sync] 同步完成: ${syncedCount} 個新文件, ${skippedCount} 個跳過`)

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    totalFiles: objects.objects.length,
                    syncedCount,
                    skippedCount,
                    errors
                },
                message: `成功同步 ${syncedCount} 個文件到數據庫`
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )

    } catch (error: any) {
        console.error('[Sync] 同步失敗:', error)
        return new Response(
            JSON.stringify({
                success: false,
                message: '同步失敗',
                details: error.message
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
}

// 處理 OPTIONS 請求（CORS 預檢）
export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    })
}