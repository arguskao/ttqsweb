/**
 * 文件上傳 API 端點
 * 使用現有的 documents 表
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

// 允許的文件類型
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm']
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// 驗證JWT token
async function verifyToken(token: string, secret: string): Promise<any> {
  try {
    const jwt = await import('jsonwebtoken')
    return jwt.verify(token, secret)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// 生成唯一文件名
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))

  return `${nameWithoutExt}_${timestamp}_${random}${extension}`
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    // 檢查認證
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: '需要認證' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token, env.JWT_SECRET!)

    // 檢查用戶權限
    if (decoded.userType !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, message: '只有管理員可以上傳文件' }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 解析表單數據
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'general'
    const description = formData.get('description') as string || ''

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: '沒有選擇文件' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 檢查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ success: false, message: `文件大小不能超過 ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 檢查文件類型
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      return new Response(
        JSON.stringify({ success: false, message: '不支持的文件類型' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    if (!env.R2_BUCKET) {
      return new Response(
        JSON.stringify({ success: false, message: 'R2 存儲桶未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 生成文件路徑
    const uniqueFileName = generateUniqueFileName(file.name)
    const filePath = `uploads/${category}/${uniqueFileName}`

    // 上傳到 R2
    const fileBuffer = await file.arrayBuffer()
    await env.R2_BUCKET.put(filePath, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${file.name}"`
      }
    })

    const fileUrl = `https://ttqs.8f754ad5f3f5a1d1596d4f54626327b0.r2.cloudflarestorage.com/${filePath}`

    // 保存到數據庫
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(env.DATABASE_URL!)

    const fileRecord = await sql`
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
                ${file.name},
                ${description || ''},
                ${fileUrl},
                ${file.type},
                ${file.size},
                ${category},
                ${file.name},
                ${filePath},
                ${decoded.userId},
                NOW()
            ) RETURNING *
        `

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: fileRecord[0].id,
          title: file.name,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.type,
          category: category,
          description: description,
          uploadedAt: fileRecord[0].created_at
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (error: any) {
    console.error('[Upload] 上傳失敗:', error)
    return new Response(
      JSON.stringify({ success: false, message: '上傳失敗', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

// 獲取文件列表
export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: '需要認證' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token, env.JWT_SECRET!)

    if (decoded.userType !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, message: '只有管理員可以查看文件列表' }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(env.DATABASE_URL!)

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const category = url.searchParams.get('category')
    const offset = (page - 1) * limit

    let files, total

    if (category) {
      files = await sql`
                SELECT d.*, u.first_name, u.last_name 
                FROM documents d
                LEFT JOIN users u ON d.uploaded_by = u.id
                WHERE d.category = ${category}
                ORDER BY d.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `
      const countResult = await sql`
                SELECT COUNT(*) as count FROM documents WHERE category = ${category}
            `
      total = parseInt(countResult[0].count)
    } else {
      files = await sql`
                SELECT d.*, u.first_name, u.last_name 
                FROM documents d
                LEFT JOIN users u ON d.uploaded_by = u.id
                ORDER BY d.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `
      const countResult = await sql`
                SELECT COUNT(*) as count FROM documents
            `
      total = parseInt(countResult[0].count)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: files,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (error: any) {
    console.error('[Upload] 獲取文件列表失敗:', error)
    return new Response(
      JSON.stringify({ success: false, message: '獲取文件列表失敗', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
