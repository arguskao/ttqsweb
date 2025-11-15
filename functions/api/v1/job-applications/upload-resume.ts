/**
 * 履歷上傳 API 端點
 * 用於工作申請時上傳履歷到 R2
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

// 允許的履歷文件類型
const ALLOWED_RESUME_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

const MAX_RESUME_SIZE = 10 * 1024 * 1024 // 10MB，履歷文件應該更小

// 驗證JWT token
async function verifyToken(token: string, secret: string | undefined): Promise<any> {
  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }
  
  try {
    const jwt = await import('jsonwebtoken')
    return jwt.verify(token, secret)
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new Error('Token expired')
    }
    throw new Error('Invalid token')
  }
}

// 生成唯一文件名
function generateUniqueFileName(originalName: string, userId: number): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))

  return `${nameWithoutExt}_u${userId}_${timestamp}_${random}${extension}`
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
    const decoded = await verifyToken(token, env.JWT_SECRET)

    // 所有登入用戶都可以上傳履歷
    if (!decoded.userId) {
      return new Response(
        JSON.stringify({ success: false, message: '無效的用戶ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 解析表單數據
    const formData = await request.formData()
    const file = formData.get('resume') as File

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: '沒有選擇文件' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 檢查文件大小
    if (file.size > MAX_RESUME_SIZE) {
      return new Response(
        JSON.stringify({ success: false, message: `履歷文件大小不能超過 ${MAX_RESUME_SIZE / 1024 / 1024}MB` }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 檢查文件類型
    if (!ALLOWED_RESUME_TYPES[file.type as keyof typeof ALLOWED_RESUME_TYPES]) {
      return new Response(
        JSON.stringify({ success: false, message: '只支持 PDF、DOC、DOCX 格式的履歷文件' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    if (!env.R2_BUCKET) {
      return new Response(
        JSON.stringify({ success: false, message: 'R2 存儲桶未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 生成文件路徑（使用 job_applications 分類）
    const uniqueFileName = generateUniqueFileName(file.name, decoded.userId)
    const filePath = `uploads/job_applications/${uniqueFileName}`

    // 上傳到 R2
    const fileBuffer = await file.arrayBuffer()
    await env.R2_BUCKET.put(filePath, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${file.name}"`
      }
    })

    const fileUrl = `https://ttqs.8f754ad5f3f5a1d1596d4f54626327b0.r2.cloudflarestorage.com/${filePath}`

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error: any) {
    console.error('Upload resume error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message || '上傳履歷失敗' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

