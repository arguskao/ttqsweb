/**
 * 文檔功能類型定義
 * 定義所有文檔相關的TypeScript接口
 */

// 文檔基本信息
export interface Document {
  id: number
  title: string
  description: string | null
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  category: string
  is_public: boolean
  uploader_id: number
  download_count: number
  created_at: Date
  updated_at: Date
}

// 文檔創建請求
export interface CreateDocumentRequest {
  title: string
  description?: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  category: string
  is_public?: boolean
}

// 文檔更新請求
export interface UpdateDocumentRequest {
  title?: string
  description?: string
  category?: string
  is_public?: boolean
}

// 文檔搜索參數
export interface DocumentSearchParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  isPublic?: boolean
  uploader_id?: number
  file_type?: string
  date_from?: string
  date_to?: string
}

// 文檔統計
export interface DocumentStats {
  totalDocuments: number
  totalDownloads: number
  totalSize: number
  averageSize: number
  documentsByCategory: Record<string, number>
  documentsByType: Record<string, number>
  recentUploads: number
}

// 文檔詳情（包含上傳者信息）
export interface DocumentWithUploader extends Document {
  uploader_name?: string
  uploader_email?: string
}

// 文檔分類
export interface DocumentCategory {
  category: string
  count: number
  description?: string
}

// 文檔下載記錄
export interface DocumentDownload {
  id: number
  document_id: number
  user_id: number | null
  ip_address: string
  user_agent: string
  downloaded_at: Date
}

// 文檔下載統計
export interface DownloadStats {
  totalDownloads: number
  downloadsByDocument: Record<string, number>
  downloadsByUser: Record<string, number>
  downloadsByDate: Record<string, number>
  topDocuments: Array<{
    document_id: number
    title: string
    download_count: number
  }>
}

// 文檔上傳進度
export interface UploadProgress {
  documentId?: number
  fileName: string
  fileSize: number
  uploadedSize: number
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

// 文檔驗證結果
export interface DocumentValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileInfo: {
    size: number
    type: string
    extension: string
  }
}

// 文檔分頁元數據
export interface DocumentPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 文檔列表響應
export interface DocumentListResponse {
  documents: DocumentWithUploader[]
  meta: DocumentPaginationMeta
}

// 文檔操作結果
export interface DocumentOperationResult {
  success: boolean
  document?: Document
  error?: string
  message?: string
}

// 文檔篩選器
export interface DocumentFilters {
  category?: string
  search?: string
  isPublic?: boolean
  uploaderId?: number
  fileType?: string
  dateRange?: {
    from: Date
    to: Date
  }
  sortBy?: 'title' | 'created_at' | 'download_count' | 'file_size'
  sortOrder?: 'asc' | 'desc'
}

// 文檔批量操作
export interface DocumentBatchOperation {
  operation: 'delete' | 'update_category' | 'toggle_public'
  documentIds: number[]
  data?: any
}

// 文檔權限
export interface DocumentPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canDownload: boolean
  reason?: string
}

// 文檔版本
export interface DocumentVersion {
  id: number
  document_id: number
  version: number
  file_name: string
  file_path: string
  file_size: number
  created_at: Date
  created_by: number
  change_notes?: string
}

// 文檔標籤
export interface DocumentTag {
  id: number
  name: string
  color?: string
  description?: string
}

// 文檔標籤關聯
export interface DocumentTagAssociation {
  document_id: number
  tag_id: number
  created_at: Date
}

// 文檔評論
export interface DocumentComment {
  id: number
  document_id: number
  user_id: number
  comment: string
  created_at: Date
  updated_at: Date
}

// 文檔評分
export interface DocumentRating {
  id: number
  document_id: number
  user_id: number
  rating: number
  created_at: Date
  updated_at: Date
}

// 文檔收藏
export interface DocumentFavorite {
  id: number
  document_id: number
  user_id: number
  created_at: Date
}

// 文檔分享
export interface DocumentShare {
  id: number
  document_id: number
  shared_by: number
  shared_with: number
  permission: 'view' | 'download' | 'edit'
  expires_at?: Date
  created_at: Date
}

// 文檔審計日誌
export interface DocumentAuditLog {
  id: number
  document_id: number
  user_id: number
  action: 'create' | 'update' | 'delete' | 'download' | 'view'
  details: any
  ip_address: string
  user_agent: string
  created_at: Date
}

