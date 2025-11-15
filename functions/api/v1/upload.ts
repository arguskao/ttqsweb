/**
 * 文件上傳 API 端點 - 使用統一錯誤處理
 */
import {
  ApiError,
  ErrorCode,
  createSuccessResponse,
  withErrorHandler,
  validateToken,
  parseJwtToken,
  checkPermission,
  validateDatabaseUrl,
  handleDatabaseError
} from '../../utils/error-handler'

interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
  R2_BUCKET?: any // Cloudflare R2 Bucket
}

interface Context {
  request: Request
  env: Env
}

// 允許的文件類型
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
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

// 生成唯一文件名
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))

  return `${nameWithoutExt}_${timestamp}_${random}${extension}`
}

// POST - 上傳文件
async function handleUpload(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證 token 和權限
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  checkPermission(payload.userType, ['admin'])

  // 解析表單數據
  const formData = await request.formData()
  const file = formData.get('file') as File
  const category = (formData.get('category') as string) || 'general'
  const description = (formData.get('description') as string) || ''

  if (!file) {
    throw new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, '沒有選擇文件')
  }

  // 檢查文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      `文件大小不能超過 ${MAX_FILE_SIZE / 1024 / 1024}MB`
    )
  }

  // 檢查文件類型
  if (!ALLOWED_FILE_TYPES[file.type]) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '不支持的文件類型')
  }

  // 檢查 R2 存儲桶
  if (!env.R2_BUCKET) {
    throw new ApiError(ErrorCode.INTERNAL_ERROR, 'R2 存儲桶未配置')
  }

  // 生成文件路徑
  const uniqueFileName = generateUniqueFileName(file.name)
  const filePath = `uploads/${category}/${uniqueFileName}`

  try {
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
    const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(databaseUrl)

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
        ${description},
        ${fileUrl},
        ${file.type},
        ${file.size},
        ${category},
        ${file.name},
        ${filePath},
        ${payload.userId},
        NOW()
      ) RETURNING *
    `

    return createSuccessResponse(
      {
        id: fileRecord[0].id,
        title: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type,
        category: category,
        description: description,
        uploadedAt: fileRecord[0].created_at
      },
      '文件上傳成功'
    )

  } catch (error) {
    // R2 上傳錯誤或資料庫錯誤
    if (error instanceof ApiError) throw error
    handleDatabaseError(error, 'File Upload')
  }
}

// GET - 獲取文件列表
async function handleGetFiles(context: Context): Promise<Response> {
  const { request, env } = context

  // 驗證 token 和權限
  const token = validateToken(request.headers.get('Authorization'))
  const payload = parseJwtToken(token)
  checkPermission(payload.userType, ['admin'])

  // 驗證資料庫連接
  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL)
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

  // 解析查詢參數
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)
  const category = url.searchParams.get('category')
  const offset = (page - 1) * limit

  // 驗證分頁參數
  if (page < 1 || limit < 1 || limit > 100) {
    throw new ApiError(ErrorCode.INVALID_INPUT, '無效的分頁參數')
  }

  try {
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

    return createSuccessResponse(files, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })

  } catch (dbError) {
    handleDatabaseError(dbError, 'Files Query')
  }
}

// 導出處理函數
export const onRequestPost = withErrorHandler(handleUpload, 'File Upload')
export const onRequestGet = withErrorHandler(handleGetFiles, 'Files List')

// OPTIONS 請求處理
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
