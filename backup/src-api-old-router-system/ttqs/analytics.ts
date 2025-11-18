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
  // 添加訓練計畫相關的API端點
  
  // 獲取所有訓練計畫
  router.get(
    '/ttqs/plans',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const { status, page = '1', limit = '10' } = req.query || {}
        const { query } = await import('../database')
        
        let queryText = 'SELECT * FROM training_plans'
        const queryParams: any[] = []
        
        if (status) {
          queryText += ' WHERE status = $1'
          queryParams.push(status)
        }
        
        queryText += ' ORDER BY created_at DESC'
        
        // 添加分頁
        const offset = (parseInt(page) - 1) * parseInt(limit)
        queryText += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
        queryParams.push(parseInt(limit), offset)
        
        const plans = await query(queryText, queryParams)
        
        // 獲取總數
        let countQuery = 'SELECT COUNT(*) as total FROM training_plans'
        const countParams: any[] = []
        if (status) {
          countQuery += ' WHERE status = $1'
          countParams.push(status)
        }
        const countResult = await query(countQuery, countParams)
        const total = parseInt(countResult[0]?.total || '0')
        
        return {
          success: true,
          data: plans,
          meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      } catch (error) {
        console.error('載入訓練計畫失敗:', error)
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '載入訓練計畫失敗',
            statusCode: 500
          }
        }
      }
    })
  )
  
  // 創建新的訓練計畫
  router.post(
    '/ttqs/plans',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const {
          title,
          description,
          objectives,
          target_audience,
          duration_weeks,
          start_date,
          end_date
        } = req.body as any
        
        if (!title || !objectives) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '標題和目標為必填項',
              statusCode: 400
            }
          }
        }
        
        const { query } = await import('../database')
        const result = await query(
          `INSERT INTO training_plans (title, description, objectives, target_audience, duration_weeks, start_date, end_date, created_by, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
           RETURNING *`,
          [
            title,
            description,
            objectives,
            target_audience,
            duration_weeks ? parseInt(duration_weeks) : null,
            start_date,
            end_date,
            req.user?.id
          ]
        )
        
        return {
          success: true,
          data: result[0]
        }
      } catch (error) {
        console.error('創建訓練計畫失敗:', error)
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '創建訓練計畫失敗',
            statusCode: 500
          }
        }
      }
    })
  )
  
  // 更新訓練計畫
  router.put(
    '/ttqs/plans/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const id = parseInt(req.params?.id || '0')
        if (!id) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '無效的計畫ID',
              statusCode: 400
            }
          }
        }
        
        const {
          title,
          description,
          objectives,
          target_audience,
          duration_weeks,
          start_date,
          end_date,
          status
        } = req.body as any
        
        const { query } = await import('../database')
        const result = await query(
          `UPDATE training_plans 
           SET title = COALESCE($1, title),
               description = COALESCE($2, description),
               objectives = COALESCE($3, objectives),
               target_audience = COALESCE($4, target_audience),
               duration_weeks = COALESCE($5, duration_weeks),
               start_date = COALESCE($6, start_date),
               end_date = COALESCE($7, end_date),
               status = COALESCE($8, status),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $9
           RETURNING *`,
          [
            title,
            description,
            objectives,
            target_audience,
            duration_weeks ? parseInt(duration_weeks) : null,
            start_date,
            end_date,
            status,
            id
          ]
        )
        
        if (result.length === 0) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '訓練計畫不存在',
              statusCode: 404
            }
          }
        }
        
        return {
          success: true,
          data: result[0]
        }
      } catch (error) {
        console.error('更新訓練計畫失敗:', error)
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '更新訓練計畫失敗',
            statusCode: 500
          }
        }
      }
    })
  )
  
  // 獲取單個訓練計畫
  router.get(
    '/ttqs/plans/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const id = parseInt(req.params?.id || '0')
        if (!id) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '無效的計畫ID',
              statusCode: 400
            }
          }
        }
        
        const { query } = await import('../database')
        const result = await query('SELECT * FROM training_plans WHERE id = $1', [id])
        
        if (result.length === 0) {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '訓練計畫不存在',
              statusCode: 404
            }
          }
        }
        
        return {
          success: true,
          data: result[0]
        }
      } catch (error) {
        console.error('獲取訓練計畫失敗:', error)
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '獲取訓練計畫失敗',
            statusCode: 500
          }
        }
      }
    })
  )
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
