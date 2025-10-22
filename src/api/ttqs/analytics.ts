/**
 * TTQS分析儀表板路由
 * 處理TTQS分析儀表板數據和趨勢分析
 */

import { ValidationError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { TTQSAnalyticsRepository } from './repositories'
import type { TrendAnalysisParams } from './types'

// Repository實例
const analyticsRepo = new TTQSAnalyticsRepository()

export function setupTTQSAnalyticsRoutes(router: ApiRouter): void {
  // 獲取TTQS儀表板數據
  router.get(
    '/ttqs/dashboard',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const dashboardData = await analyticsRepo.getDashboardData()

      return {
        success: true,
        data: dashboardData
      }
    })
  )

  // 獲取TTQS趨勢數據
  router.get(
    '/ttqs/trends',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { period, start_date, end_date, plan_id } = query

      const trendParams: TrendAnalysisParams = {}
      if (period) trendParams.period = period as any
      if (start_date) trendParams.start_date = start_date as string
      if (end_date) trendParams.end_date = end_date as string
      if (plan_id) trendParams.plan_id = parseInt(plan_id as string)

      const trends = await analyticsRepo.getTrendData(trendParams)

      return {
        success: true,
        data: trends
      }
    })
  )

  // 獲取性能指標
  router.get(
    '/ttqs/performance',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { period, plan_id } = query

      const performanceData = await analyticsRepo.getPerformanceMetrics({
        period: period as string,
        plan_id: plan_id ? parseInt(plan_id as string) : undefined
      })

      return {
        success: true,
        data: performanceData
      }
    })
  )

  // 獲取合規狀態
  router.get(
    '/ttqs/compliance',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { plan_id } = query

      const complianceData = await analyticsRepo.getComplianceStatus({
        plan_id: plan_id ? parseInt(plan_id as string) : undefined
      })

      return {
        success: true,
        data: complianceData
      }
    })
  )

  // 獲取培訓效果分析
  router.get(
    '/ttqs/training-effectiveness',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { period, plan_id, course_id } = query

      const effectivenessData = await analyticsRepo.getTrainingEffectiveness({
        period: period as string,
        plan_id: plan_id ? parseInt(plan_id as string) : undefined,
        course_id: course_id ? parseInt(course_id as string) : undefined
      })

      return {
        success: true,
        data: effectivenessData
      }
    })
  )

  // 獲取學員滿意度分析
  router.get(
    '/ttqs/satisfaction',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { period, plan_id, instructor_id } = query

      const satisfactionData = await analyticsRepo.getSatisfactionAnalysis({
        period: period as string,
        plan_id: plan_id ? parseInt(plan_id as string) : undefined,
        instructor_id: instructor_id ? parseInt(instructor_id as string) : undefined
      })

      return {
        success: true,
        data: satisfactionData
      }
    })
  )

  // 獲取就業成功率分析
  router.get(
    '/ttqs/employment-success',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { period, plan_id, course_id } = query

      const employmentData = await analyticsRepo.getEmploymentSuccessRate({
        period: period as string,
        plan_id: plan_id ? parseInt(plan_id as string) : undefined,
        course_id: course_id ? parseInt(course_id as string) : undefined
      })

      return {
        success: true,
        data: employmentData
      }
    })
  )

  // 獲取成本效益分析
  router.get(
    '/ttqs/cost-effectiveness',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { period, plan_id } = query

      const costData = await analyticsRepo.getCostEffectivenessAnalysis({
        period: period as string,
        plan_id: plan_id ? parseInt(plan_id as string) : undefined
      })

      return {
        success: true,
        data: costData
      }
    })
  )

  // 獲取比較分析
  router.get(
    '/ttqs/compare',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { plan_ids, metric, period } = query

      if (!plan_ids) {
        throw new ValidationError('計劃ID列表為必填項')
      }

      const planIdArray = Array.isArray(plan_ids)
        ? plan_ids.map(id => parseInt(id as string))
        : [parseInt(plan_ids as string)]

      const compareData = await analyticsRepo.getComparisonAnalysis({
        plan_ids: planIdArray,
        metric: metric as string,
        period: period as string
      })

      return {
        success: true,
        data: compareData
      }
    })
  )

  // 獲取預測分析
  router.get(
    '/ttqs/forecast',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const query = req.query as Record<string, string | string[] | undefined>
      const { plan_id, metric, forecast_period } = query

      if (!plan_id || !metric) {
        throw new ValidationError('計劃ID和指標為必填項')
      }

      const forecastData = await analyticsRepo.getForecastAnalysis({
        plan_id: parseInt(plan_id as string),
        metric: metric as string,
        forecast_period: forecast_period ? (forecast_period as string) : '12'
      })

      return {
        success: true,
        data: forecastData
      }
    })
  )

  // 獲取自定義報告
  router.post(
    '/ttqs/custom-report',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const { plan_id, metrics, period, filters } = req.body as {
        plan_id: number
        metrics: string[]
        period: string
        filters?: Record<string, any>
      }

      if (!plan_id || !metrics || !period) {
        throw new ValidationError('計劃ID、指標和期間為必填項')
      }

      const customReport = await analyticsRepo.generateCustomReport({
        plan_id,
        metrics,
        period,
        filters: filters ?? {}
      })

      return {
        success: true,
        data: customReport
      }
    })
  )
}
