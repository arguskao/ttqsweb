/**
 * TTQS分析功能類型定義
 * 定義所有TTQS分析相關的TypeScript接口
 */

// TTQS文檔
export interface TTQSDocument {
  id: number
  plan_id: number
  document_type: string
  title: string
  file_url: string
  file_size: number | null
  version: string | null
  uploaded_by: number
  uploaded_by_name?: string
  created_at: Date
  updated_at: Date
}

// TTQS計劃
export interface TTQSPlan {
  id: number
  name: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  start_date: Date | null
  end_date: Date | null
  created_by: number
  created_at: Date
  updated_at: Date
}

// TTQS儀表板數據
export interface TTQSDashboardData {
  totalPlans: number
  activePlans: number
  completedPlans: number
  totalDocuments: number
  recentUploads: TTQSDocument[]
  complianceRate: number
  upcomingDeadlines: any[]
  performanceMetrics: {
    reaction: number
    learning: number
    behavior: number
    results: number
  }
  // 額外的統計屬性
  total_trainees?: number
  completion_rate?: number
  satisfaction_score?: number
  employment_rate?: number
  performance_score?: number
}

// TTQS趨勢數據
export interface TTQSTrendData {
  period: string
  plans: number
  documents: number
  compliance: number
  performance: {
    reaction: number
    learning: number
    behavior: number
    results: number
  }
}

// TTQS報告
export interface TTQSReport {
  id: string
  plan_id?: number
  report_type?: string
  title?: string
  generated_at: Date
  generated_by?: number
  period:
    | string
    | {
        start: Date
        end: Date
      }
  summary: {
    totalPlans?: number
    activePlans?: number
    completedPlans?: number
    totalDocuments?: number
    complianceRate?: number
    total_trainees?: number
    completion_rate?: number
    satisfaction_score?: number
    employment_rate?: number
  }
  performance: {
    reaction: number
    learning: number
    behavior: number
    results: number
  }
  trends: TTQSTrendData[]
  recommendations: string[]
  compliance:
    | TTQSCompliance[]
    | {
        compliant: number
        nonCompliant: number
        pending: number
      }
}

// TTQS合規狀態
export interface TTQSCompliance {
  planId: number
  planName: string
  status: 'compliant' | 'non_compliant' | 'pending'
  lastAudit: Date | null
  nextAudit: Date | null
  issues: string[]
  score: number
}

// 文檔上傳請求
export interface UploadDocumentRequest {
  plan_id: number
  document_type: string
  title: string
  file_url: string
  file_size?: number
  version?: string
}

// 文檔搜索參數
export interface DocumentSearchParams {
  plan_id?: number
  document_type?: string
  uploaded_by?: number
  date_from?: string
  date_to?: string
}

// 趨勢分析參數
export interface TrendAnalysisParams {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | string
  start_date?: string
  end_date?: string
  plan_id?: number
}

// 報告生成參數
export interface ReportGenerationParams {
  plan_id?: number
  report_type?: string
  period?:
    | string
    | {
        start: string
        end: string
      }
  plan_ids?: number[]
  include_trends?: boolean
  include_recommendations?: boolean
}

// 合規檢查參數
export interface ComplianceCheckParams {
  plan_id?: number
  status?: 'compliant' | 'non_compliant' | 'pending'
  date_from?: string
  date_to?: string
}

// 性能指標
export interface PerformanceMetrics {
  reaction: number
  learning: number
  behavior: number
  results: number
}

// 建議
export interface Recommendation {
  type: 'performance' | 'compliance' | 'process'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action_items: string[]
}

// 文檔類型
export type DocumentType =
  | 'training_plan'
  | 'assessment_report'
  | 'evaluation_form'
  | 'compliance_checklist'
  | 'audit_report'
  | 'improvement_plan'
  | 'other'

// 計劃狀態
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived'

// 合規狀態
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending'

// 趨勢期間
export type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

// 建議類型
export type RecommendationType = 'performance' | 'compliance' | 'process'

// 建議優先級
export type RecommendationPriority = 'high' | 'medium' | 'low'
