/**
 * TTQS分析功能Repository類別
 * 提供數據庫操作接口
 */

import { query } from '../database'

import type {
  TTQSDocument,
  TTQSPlan,
  TTQSDashboardData,
  TTQSTrendData,
  TTQSCompliance,
  DocumentSearchParams,
  TrendAnalysisParams,
  ComplianceCheckParams
} from './types'

// TTQS文檔Repository
export class TTQSDocumentRepository {
  // 創建文檔
  async create(documentData: Partial<TTQSDocument>): Promise<TTQSDocument> {
    const result = await query(
      `INSERT INTO ttqs_documents (plan_id, document_type, title, file_url, file_size, version, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        documentData.plan_id,
        documentData.document_type,
        documentData.title,
        documentData.file_url,
        documentData.file_size,
        documentData.version,
        documentData.uploaded_by
      ]
    )
    return result[0]
  }

  // 根據ID查找文檔
  async findById(id: number): Promise<TTQSDocument | null> {
    const result = await query(
      `SELECT td.*, u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM ttqs_documents td
       LEFT JOIN users u ON td.uploaded_by = u.id
       WHERE td.id = $1`,
      [id]
    )
    return result[0] || null
  }

  // 根據計劃ID查找文檔
  async findByPlanId(planId: number): Promise<TTQSDocument[]> {
    return await query(
      `SELECT td.*, u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM ttqs_documents td
       LEFT JOIN users u ON td.uploaded_by = u.id
       WHERE td.plan_id = $1
       ORDER BY td.created_at DESC`,
      [planId]
    )
  }

  // 根據類型查找文檔
  async findByType(documentType: string): Promise<TTQSDocument[]> {
    return await query(
      `SELECT td.*, u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM ttqs_documents td
       LEFT JOIN users u ON td.uploaded_by = u.id
       WHERE td.document_type = $1
       ORDER BY td.created_at DESC`,
      [documentType]
    )
  }

  // 搜索文檔
  async search(params: DocumentSearchParams): Promise<TTQSDocument[]> {
    let queryText = `
      SELECT td.*, u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM ttqs_documents td
      LEFT JOIN users u ON td.uploaded_by = u.id
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramIndex = 1

    if (params.plan_id) {
      queryText += ` AND td.plan_id = $${paramIndex}`
      queryParams.push(params.plan_id)
      paramIndex++
    }

    if (params.document_type) {
      queryText += ` AND td.document_type = $${paramIndex}`
      queryParams.push(params.document_type)
      paramIndex++
    }

    if (params.uploaded_by) {
      queryText += ` AND td.uploaded_by = $${paramIndex}`
      queryParams.push(params.uploaded_by)
      paramIndex++
    }

    if (params.date_from) {
      queryText += ` AND td.created_at >= $${paramIndex}`
      queryParams.push(params.date_from)
      paramIndex++
    }

    if (params.date_to) {
      queryText += ` AND td.created_at <= $${paramIndex}`
      queryParams.push(params.date_to)
      paramIndex++
    }

    queryText += ' ORDER BY td.created_at DESC'

    return await query(queryText, queryParams)
  }

  // 獲取最近上傳的文檔
  async getRecentUploads(limit = 10): Promise<TTQSDocument[]> {
    return await query(
      `SELECT td.*, u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM ttqs_documents td
       LEFT JOIN users u ON td.uploaded_by = u.id
       ORDER BY td.created_at DESC
       LIMIT $1`,
      [limit]
    )
  }

  // 更新文檔
  async update(id: number, updateData: Partial<TTQSDocument>): Promise<TTQSDocument> {
    const fields = Object.keys(updateData).filter(key => key !== 'id')
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')

    const result = await query(
      `UPDATE ttqs_documents SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...fields.map(field => updateData[field as keyof TTQSDocument])]
    )
    return result[0]
  }

  // 刪除文檔
  async delete(id: number): Promise<void> {
    await query('DELETE FROM ttqs_documents WHERE id = $1', [id])
  }

  // 搜索文檔（別名方法）
  async searchDocuments(params: DocumentSearchParams): Promise<TTQSDocument[]> {
    return this.search(params)
  }

  // 增加下載次數
  async incrementDownloadCount(id: number): Promise<void> {
    await query(
      'UPDATE ttqs_documents SET download_count = COALESCE(download_count, 0) + 1 WHERE id = $1',
      [id]
    )
  }

  // 獲取文檔統計
  async getDocumentStats(): Promise<{
    totalDocuments: number
    totalDownloads: number
    documentsByType: Record<string, number>
    recentUploads: number
  }> {
    const totalResult = await query('SELECT COUNT(*) as total FROM ttqs_documents')
    const downloadsResult = await query(
      'SELECT SUM(COALESCE(download_count, 0)) as total FROM ttqs_documents'
    )
    const typeResult = await query(
      `SELECT document_type, COUNT(*) as count 
       FROM ttqs_documents 
       GROUP BY document_type`
    )
    const recentResult = await query(
      `SELECT COUNT(*) as recent 
       FROM ttqs_documents 
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    )

    const documentsByType: Record<string, number> = {}
    typeResult.forEach(row => {
      documentsByType[row.document_type] = parseInt(row.count)
    })

    return {
      totalDocuments: parseInt(totalResult[0]?.total || '0'),
      totalDownloads: parseInt(downloadsResult[0]?.total || '0'),
      documentsByType,
      recentUploads: parseInt(recentResult[0]?.recent || '0')
    }
  }
}

// TTQS計劃Repository
export class TTQSPlanRepository {
  // 獲取所有計劃
  async findAll(): Promise<TTQSPlan[]> {
    return await query('SELECT * FROM training_plans ORDER BY created_at DESC')
  }

  // 根據ID查找計劃
  async findById(id: number): Promise<TTQSPlan | null> {
    const result = await query('SELECT * FROM training_plans WHERE id = $1', [id])
    return result[0] || null
  }

  // 根據狀態查找計劃
  async findByStatus(status: string): Promise<TTQSPlan[]> {
    return await query('SELECT * FROM training_plans WHERE status = $1 ORDER BY created_at DESC', [
      status
    ])
  }

  // 獲取計劃統計
  async getStats(): Promise<{
    total: number
    active: number
    completed: number
    draft: number
  }> {
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
         COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft
       FROM training_plans`
    )

    return {
      total: parseInt(result[0]?.total || '0'),
      active: parseInt(result[0]?.active || '0'),
      completed: parseInt(result[0]?.completed || '0'),
      draft: parseInt(result[0]?.draft || '0')
    }
  }

  // 執行原始查詢
  async query(text: string, values?: unknown[]): Promise<any> {
    return await query(text, values ?? [])
  }
}

// TTQS分析Repository
export class TTQSAnalyticsRepository {
  // 獲取儀表板數據
  async getDashboardData(): Promise<TTQSDashboardData> {
    // 獲取計劃統計
    const planStats = await query(
      `SELECT 
         COUNT(*) as total_plans,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_plans,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_plans
       FROM training_plans`
    )

    // 獲取文檔統計
    const documentStats = await query('SELECT COUNT(*) as total_documents FROM ttqs_documents')

    // 獲取最近上傳
    const recentUploads = await query(
      `SELECT td.*, u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM ttqs_documents td
       LEFT JOIN users u ON td.uploaded_by = u.id
       ORDER BY td.created_at DESC
       LIMIT 5`
    )

    // 獲取合規率
    const complianceRate = await query(
      `SELECT 
         COUNT(CASE WHEN status = 'compliant' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(*), 0) as compliance_rate
       FROM ttqs_compliance`
    )

    // 獲取性能指標
    const performanceMetrics = await query(
      `SELECT 
         AVG(reaction_score) as reaction,
         AVG(learning_score) as learning,
         AVG(behavior_score) as behavior,
         AVG(results_score) as results
       FROM ttqs_evaluations
       WHERE created_at >= NOW() - INTERVAL '30 days'`
    )

    return {
      totalPlans: parseInt(planStats[0]?.total_plans || '0'),
      activePlans: parseInt(planStats[0]?.active_plans || '0'),
      completedPlans: parseInt(planStats[0]?.completed_plans || '0'),
      totalDocuments: parseInt(documentStats[0]?.total_documents || '0'),
      recentUploads: recentUploads,
      complianceRate: parseFloat(complianceRate[0]?.compliance_rate || '0'),
      upcomingDeadlines: [], // 可以根據需要實現
      performanceMetrics: {
        reaction: parseFloat(performanceMetrics[0]?.reaction || '0'),
        learning: parseFloat(performanceMetrics[0]?.learning || '0'),
        behavior: parseFloat(performanceMetrics[0]?.behavior || '0'),
        results: parseFloat(performanceMetrics[0]?.results || '0')
      }
    }
  }

  // 獲取趨勢數據
  async getTrendData(params: TrendAnalysisParams): Promise<TTQSTrendData[]> {
    const period = params.period || 'monthly'
    const startDate =
      params.start_date || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = params.end_date || new Date().toISOString()

    let dateFormat: string
    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD'
        break
      case 'weekly':
        dateFormat = 'YYYY-"W"WW'
        break
      case 'monthly':
        dateFormat = 'YYYY-MM'
        break
      case 'yearly':
        dateFormat = 'YYYY'
        break
      default:
        dateFormat = 'YYYY-MM'
    }

    const result = await query(
      `SELECT 
         TO_CHAR(created_at, $1) as period,
         COUNT(DISTINCT tp.id) as plans,
         COUNT(td.id) as documents,
         AVG(tc.compliance_score) as compliance,
         AVG(te.reaction_score) as reaction,
         AVG(te.learning_score) as learning,
         AVG(te.behavior_score) as behavior,
         AVG(te.results_score) as results
       FROM training_plans tp
       LEFT JOIN ttqs_documents td ON tp.id = td.plan_id
       LEFT JOIN improvement_actions ia ON tp.id = ia.plan_id
       LEFT JOIN training_executions te ON tp.id = te.plan_id
       WHERE tp.created_at BETWEEN $2 AND $3
       GROUP BY TO_CHAR(created_at, $1)
       ORDER BY period`,
      [dateFormat, startDate, endDate]
    )

    return result.map(row => ({
      period: row.period,
      plans: parseInt(row.plans || '0'),
      documents: parseInt(row.documents || '0'),
      compliance: parseFloat(row.compliance || '0'),
      performance: {
        reaction: parseFloat(row.reaction || '0'),
        learning: parseFloat(row.learning || '0'),
        behavior: parseFloat(row.behavior || '0'),
        results: parseFloat(row.results || '0')
      }
    }))
  }

  // 獲取合規狀態
  async getComplianceStatus(params: ComplianceCheckParams): Promise<TTQSCompliance[]> {
    let queryText = `
      SELECT 
        tc.plan_id,
        tp.name as plan_name,
        tc.status,
        tc.last_audit,
        tc.next_audit,
        tc.issues,
        tc.score
      FROM improvement_actions tc
      JOIN training_plans tp ON tc.plan_id = tp.id
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramIndex = 1

    if (params.plan_id) {
      queryText += ` AND tc.plan_id = $${paramIndex}`
      queryParams.push(params.plan_id)
      paramIndex++
    }

    if (params.status) {
      queryText += ` AND tc.status = $${paramIndex}`
      queryParams.push(params.status)
      paramIndex++
    }

    if (params.date_from) {
      queryText += ` AND tc.last_audit >= $${paramIndex}`
      queryParams.push(params.date_from)
      paramIndex++
    }

    if (params.date_to) {
      queryText += ` AND tc.last_audit <= $${paramIndex}`
      queryParams.push(params.date_to)
      paramIndex++
    }

    queryText += ' ORDER BY tc.last_audit DESC'

    return await query(queryText, queryParams)
  }

  // 執行原始查詢
  async query(text: string, values?: unknown[]): Promise<any> {
    return await query(text, values ?? [])
  }

  // 獲取性能指標
  async getPerformanceMetrics(params: { period?: string; plan_id?: number }): Promise<any> {
    const period = params.period || '30 days'
    const result = await query(
      `SELECT 
         AVG(reaction_score) as reaction,
         AVG(learning_score) as learning,
         AVG(behavior_score) as behavior,
         AVG(results_score) as results,
         COUNT(*) as total_evaluations
       FROM ttqs_evaluations
       WHERE created_at >= NOW() - INTERVAL '${period}'`,
      []
    )

    return {
      reaction: parseFloat(result[0]?.reaction || '0'),
      learning: parseFloat(result[0]?.learning || '0'),
      behavior: parseFloat(result[0]?.behavior || '0'),
      results: parseFloat(result[0]?.results || '0'),
      totalEvaluations: parseInt(result[0]?.total_evaluations || '0')
    }
  }

  // 獲取培訓效果
  async getTrainingEffectiveness(params: {
    period?: string
    plan_id?: number
    course_id?: number
  }): Promise<any> {
    const period = params.period || '30 days'
    const result = await query(
      `SELECT 
         AVG(pre_score) as pre_training_average,
         AVG(post_score) as post_training_average,
         AVG(post_score - pre_score) as improvement,
         COUNT(*) as total_participants
       FROM ttqs_training_results
       WHERE created_at >= NOW() - INTERVAL '${period}'`,
      []
    )

    return {
      preTrainingAverage: parseFloat(result[0]?.pre_training_average || '0'),
      postTrainingAverage: parseFloat(result[0]?.post_training_average || '0'),
      improvement: parseFloat(result[0]?.improvement || '0'),
      totalParticipants: parseInt(result[0]?.total_participants || '0')
    }
  }

  // 獲取滿意度分析
  async getSatisfactionAnalysis(params: {
    period?: string
    plan_id?: number
    instructor_id?: number
  }): Promise<any> {
    const period = params.period || '30 days'
    const result = await query(
      `SELECT 
         AVG(satisfaction_score) as average_satisfaction,
         COUNT(CASE WHEN satisfaction_score >= 4 THEN 1 END) * 100.0 / COUNT(*) as satisfaction_rate,
         COUNT(*) as total_responses
       FROM ttqs_satisfaction_surveys
       WHERE created_at >= NOW() - INTERVAL '${period}'`,
      []
    )

    return {
      averageSatisfaction: parseFloat(result[0]?.average_satisfaction || '0'),
      satisfactionRate: parseFloat(result[0]?.satisfaction_rate || '0'),
      totalResponses: parseInt(result[0]?.total_responses || '0')
    }
  }

  // 獲取就業成功率
  async getEmploymentSuccessRate(params: {
    period?: string
    plan_id?: number
    course_id?: number
  }): Promise<any> {
    const period = params.period || '30 days'
    const result = await query(
      `SELECT 
         COUNT(CASE WHEN employment_status = 'employed' THEN 1 END) * 100.0 / COUNT(*) as employment_rate,
         COUNT(*) as total_graduates,
         AVG(salary) as average_salary
       FROM ttqs_employment_outcomes
       WHERE graduation_date >= NOW() - INTERVAL '${period}'`,
      []
    )

    return {
      employmentRate: parseFloat(result[0]?.employment_rate || '0'),
      totalGraduates: parseInt(result[0]?.total_graduates || '0'),
      averageSalary: parseFloat(result[0]?.average_salary || '0')
    }
  }

  // 獲取成本效益分析
  async getCostEffectivenessAnalysis(params: { period?: string; plan_id?: number }): Promise<any> {
    const period = params.period || '30 days'
    const result = await query(
      `SELECT 
         SUM(training_cost) as total_cost,
         COUNT(DISTINCT participant_id) as total_participants,
         SUM(training_cost) / COUNT(DISTINCT participant_id) as cost_per_participant,
         AVG(roi_percentage) as average_roi
       FROM ttqs_cost_analysis
       WHERE created_at >= NOW() - INTERVAL '${period}'`,
      []
    )

    return {
      totalCost: parseFloat(result[0]?.total_cost || '0'),
      totalParticipants: parseInt(result[0]?.total_participants || '0'),
      costPerParticipant: parseFloat(result[0]?.cost_per_participant || '0'),
      averageROI: parseFloat(result[0]?.average_roi || '0')
    }
  }

  // 獲取比較分析
  async getComparisonAnalysis(params: {
    period?: string
    plan_ids?: number[]
    metric?: string
  }): Promise<any> {
    const period = params.period || '30 days'
    const currentResult = await query(
      `SELECT 
         AVG(performance_score) as current_performance,
         COUNT(*) as current_count
       FROM ttqs_performance_data
       WHERE created_at >= NOW() - INTERVAL '${period}'`,
      []
    )

    const previousResult = await query(
      `SELECT 
         AVG(performance_score) as previous_performance,
         COUNT(*) as previous_count
       FROM ttqs_performance_data
       WHERE created_at >= NOW() - INTERVAL '${period}' * 2
       AND created_at < NOW() - INTERVAL '${period}'`,
      []
    )

    return {
      currentPeriod: {
        performance: parseFloat(currentResult[0]?.current_performance || '0'),
        count: parseInt(currentResult[0]?.current_count || '0')
      },
      previousPeriod: {
        performance: parseFloat(previousResult[0]?.previous_performance || '0'),
        count: parseInt(previousResult[0]?.previous_count || '0')
      }
    }
  }

  // 獲取預測分析
  async getForecastAnalysis(params: {
    period?: string
    plan_id?: number
    metric?: string
    forecast_period?: string
  }): Promise<any> {
    // 簡化的預測分析，實際應用中可能需要更複雜的算法
    const period = params.period || '30 days'
    const historicalData = await query(
      `SELECT 
         DATE_TRUNC('month', created_at) as month,
         AVG(performance_score) as avg_performance,
         COUNT(*) as count
       FROM ttqs_performance_data
       WHERE created_at >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month`,
      []
    )

    return {
      historicalTrend: historicalData,
      forecast: {
        nextMonth: {
          predictedPerformance: 85.0, // 模擬預測值
          confidence: 0.75
        }
      }
    }
  }

  // 生成自定義報告
  async generateCustomReport(params: any): Promise<any> {
    const { reportType, dateRange, metrics } = params

    let queryText = 'SELECT '
    const selectedMetrics = metrics || ['performance', 'satisfaction', 'compliance']

    const metricSelections = selectedMetrics
      .map((metric: string) => {
        switch (metric) {
          case 'performance':
            return 'AVG(performance_score) as avg_performance'
          case 'satisfaction':
            return 'AVG(satisfaction_score) as avg_satisfaction'
          case 'compliance':
            return 'AVG(compliance_score) as avg_compliance'
          default:
            return '0 as unknown_metric'
        }
      })
      .join(', ')

    queryText += metricSelections
    queryText += ' FROM ttqs_comprehensive_data WHERE 1=1'

    const queryParams: any[] = []
    let paramIndex = 1

    if (dateRange?.start) {
      queryText += ` AND created_at >= $${paramIndex}`
      queryParams.push(dateRange.start)
      paramIndex++
    }

    if (dateRange?.end) {
      queryText += ` AND created_at <= $${paramIndex}`
      queryParams.push(dateRange.end)
      paramIndex++
    }

    const result = await query(queryText, queryParams)

    return {
      reportType,
      dateRange,
      metrics: selectedMetrics,
      data: result[0] ?? {},
      generatedAt: new Date().toISOString()
    }
  }
}
