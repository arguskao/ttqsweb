/**
 * TTQS報告生成路由
 * 處理TTQS報告的自動生成和管理
 */

import { ValidationError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { TTQSAnalyticsRepository } from './repositories'
import type { ReportGenerationParams, TTQSReport } from './types'

// Repository實例
const analyticsRepo = new TTQSAnalyticsRepository()

// 生成建議的輔助函數
function generateRecommendations(
  reaction: any,
  learning: any,
  behavior: any,
  results: any
): string[] {
  const recommendations: string[] = []

  // 反應層面建議
  if (reaction < 3.0) {
    recommendations.push('建議改善培訓內容的吸引力和相關性')
    recommendations.push('考慮調整培訓時間和地點以提高參與度')
  }

  // 學習層面建議
  if (learning < 3.0) {
    recommendations.push('加強培訓材料的結構化和邏輯性')
    recommendations.push('提供更多實務練習和案例分析')
  }

  // 行為層面建議
  if (behavior < 3.0) {
    recommendations.push('建立更強的工作環境支持系統')
    recommendations.push('提供持續的指導和反饋機制')
  }

  // 結果層面建議
  if (results < 3.0) {
    recommendations.push('設定更明確的績效指標和目標')
    recommendations.push('建立定期評估和調整機制')
  }

  // 綜合建議
  if (reaction >= 4.0 && learning >= 4.0 && behavior >= 4.0 && results >= 4.0) {
    recommendations.push('培訓計劃表現優秀，建議繼續保持現有模式')
    recommendations.push('可考慮將此模式推廣到其他培訓計劃')
  }

  return recommendations
}

export function setupTTQSReportRoutes(router: ApiRouter): void {
  // 生成TTQS報告
  router.post(
    '/ttqs/reports/generate',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const { plan_id, report_type, period, include_recommendations }: ReportGenerationParams =
        req.body as ReportGenerationParams

      if (!plan_id || !report_type) {
        throw new ValidationError('計劃ID和報告類型為必填項')
      }

      // 獲取基礎數據
      const dashboardData = await analyticsRepo.getDashboardData()
      const periodStr = typeof period === 'string' ? period : '12m'
      const trendData = await analyticsRepo.getTrendData({ period: periodStr })
      const performanceData = await analyticsRepo.getPerformanceMetrics({ period: periodStr })
      const complianceData = await analyticsRepo.getComplianceStatus({ plan_id })

      // 生成報告
      const report: TTQSReport = {
        id: Date.now().toString(),
        plan_id,
        report_type,
        period: periodStr,
        generated_at: new Date(),
        generated_by: req.user!.id,
        summary: {
          total_trainees: dashboardData.total_trainees ?? 0,
          completion_rate: dashboardData.completion_rate ?? 0,
          satisfaction_score: dashboardData.satisfaction_score ?? 0,
          employment_rate: dashboardData.employment_rate ?? 0
        },
        trends: trendData,
        performance: performanceData,
        compliance: complianceData,
        recommendations: include_recommendations
          ? generateRecommendations(
            dashboardData.satisfaction_score ?? 0,
            dashboardData.completion_rate ?? 0,
            dashboardData.employment_rate ?? 0,
            dashboardData.performance_score ?? 0
          )
          : []
      }

      return {
        success: true,
        data: report
      }
    })
  )

  // 獲取報告列表
  router.get(
    '/ttqs/reports',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { plan_id, report_type, date_from, date_to } = query

      const searchParams: any = {}
      if (plan_id) searchParams.plan_id = parseInt(plan_id as string)
      if (report_type) searchParams.report_type = report_type as string
      if (date_from) searchParams.date_from = date_from as string
      if (date_to) searchParams.date_to = date_to as string

      // 這裡應該從數據庫獲取報告列表
      // 暫時返回模擬數據
      const reports = await analyticsRepo.query(
        `
      SELECT * FROM ttqs_reports 
      WHERE 1=1
      ${searchParams.plan_id ? 'AND plan_id = $1' : ''}
      ${searchParams.report_type ? 'AND report_type = $2' : ''}
      ORDER BY generated_at DESC
    `,
        [searchParams.plan_id, searchParams.report_type].filter(Boolean)
      )

      return {
        success: true,
        data: reports
      }
    })
  )

  // 獲取報告詳情
  router.get(
    '/ttqs/reports/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params

      // 這裡應該從數據庫獲取報告詳情
      // 暫時返回模擬數據
      const report = await analyticsRepo.query(
        `
      SELECT * FROM ttqs_reports WHERE id = $1
    `,
        [id]
      )

      if (!report || report.length === 0) {
        throw new ValidationError('報告不存在')
      }

      return {
        success: true,
        data: report[0]
      }
    })
  )

  // 下載報告
  router.get(
    '/ttqs/reports/:id/download',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const query = req.query as Record<string, string | string[] | undefined>
      const { format } = query

      // 獲取報告數據
      const report = await analyticsRepo.query(
        `
      SELECT * FROM ttqs_reports WHERE id = $1
    `,
        [id]
      )

      if (!report || report.length === 0) {
        throw new ValidationError('報告不存在')
      }

      const reportData = report[0]

      // 根據格式生成下載鏈接
      let downloadUrl = ''
      if (format === 'pdf') {
        downloadUrl = `/api/v1/ttqs/reports/${id}/pdf`
      } else if (format === 'excel') {
        downloadUrl = `/api/v1/ttqs/reports/${id}/excel`
      } else {
        downloadUrl = `/api/v1/ttqs/reports/${id}/json`
      }

      return {
        success: true,
        data: {
          download_url: downloadUrl,
          report_id: id,
          format: format || 'json'
        }
      }
    })
  )

  // 獲取報告統計
  router.get(
    '/ttqs/reports/stats',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const stats = await analyticsRepo.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN report_type = 'monthly' THEN 1 END) as monthly_reports,
        COUNT(CASE WHEN report_type = 'quarterly' THEN 1 END) as quarterly_reports,
        COUNT(CASE WHEN report_type = 'annual' THEN 1 END) as annual_reports,
        COUNT(CASE WHEN generated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_reports
      FROM ttqs_reports
    `)

      return {
        success: true,
        data: stats[0] ?? {}
      }
    })
  )
}
