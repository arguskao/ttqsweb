import { query } from './database'
import type { ApiRequest, RouteHandler } from './types'

// TTQS Document Management
export const uploadTTQSDocument: RouteHandler = async (req: ApiRequest) => {
  try {
    const { plan_id, document_type, title, file_url, file_size, version } = req.body as any

    if (!plan_id || !document_type || !title || !file_url) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '計劃ID、文件類型、標題和文件URL為必填項',
          statusCode: 400
        }
      }
    }

    const result = await query(
      `INSERT INTO ttqs_documents (plan_id, document_type, title, file_url, file_size, version, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [plan_id, document_type, title, file_url, file_size, version, req.user?.id]
    )

    return {
      success: true,
      data: result[0]
    }
  } catch (error) {
    console.error('Upload TTQS document error:', error)
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '上傳TTQS文件失敗',
        statusCode: 500
      }
    }
  }
}

export const getTTQSDocuments: RouteHandler = async (req: ApiRequest) => {
  try {
    const planId = req.query?.plan_id
    const documentType = req.query?.document_type

    let queryText = `
      SELECT td.*, u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM ttqs_documents td
      LEFT JOIN users u ON td.uploaded_by = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (planId) {
      params.push(planId)
      queryText += ` AND td.plan_id = $${params.length}`
    }

    if (documentType) {
      params.push(documentType)
      queryText += ` AND td.document_type = $${params.length}`
    }

    queryText += ' ORDER BY td.created_at DESC'

    const result = await query(queryText, params)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Get TTQS documents error:', error)
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '獲取TTQS文件失敗',
        statusCode: 500
      }
    }
  }
}

// Analytics Dashboard Data
export const getTTQSDashboard: RouteHandler = async (req: ApiRequest) => {
  try {
    const planId = req.query?.plan_id

    // Get training plan overview
    const planResult = await query(
      `SELECT 
         COUNT(*) as total_plans,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_plans,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_plans
       FROM training_plans
       ${planId ? 'WHERE id = $1' : ''}`,
      planId ? [planId] : []
    )

    // Get execution statistics
    const executionResult = await query(
      `SELECT 
         COUNT(*) as total_executions,
         AVG(attendance_count) as avg_attendance,
         AVG(completion_rate) as avg_completion_rate
       FROM training_executions
       ${planId ? 'WHERE plan_id = $1' : ''}`,
      planId ? [planId] : []
    )

    // Get satisfaction scores (Level 1)
    const satisfactionResult = await query(
      `SELECT 
         AVG(overall_satisfaction) as avg_satisfaction,
         COUNT(*) as total_responses
       FROM reaction_evaluations re
       JOIN training_executions te ON re.execution_id = te.id
       ${planId ? 'WHERE te.plan_id = $1' : ''}`,
      planId ? [planId] : []
    )

    // Get learning outcomes (Level 2)
    const learningResult = await query(
      `SELECT 
         AVG(post_test_score) as avg_test_score,
         SUM(CASE WHEN passed = true THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as pass_rate,
         COUNT(*) as total_students
       FROM learning_evaluations le
       JOIN training_executions te ON le.execution_id = te.id
       ${planId ? 'WHERE te.plan_id = $1' : ''}`,
      planId ? [planId] : []
    )

    // Get behavior scores (Level 3)
    const behaviorResult = await query(
      `SELECT 
         AVG(overall_behavior_score) as avg_behavior_score,
         COUNT(*) as total_evaluations
       FROM behavior_evaluations be
       JOIN training_executions te ON be.execution_id = te.id
       ${planId ? 'WHERE te.plan_id = $1' : ''}`,
      planId ? [planId] : []
    )

    // Get employment outcomes (Level 4)
    const employmentResult = await query(
      `SELECT 
         SUM(CASE WHEN employment_status = 'employed' THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as employment_rate,
         AVG(job_match_rate) as avg_job_match_rate,
         AVG(salary_level) as avg_salary,
         COUNT(*) as total_graduates
       FROM result_evaluations re
       JOIN training_executions te ON re.execution_id = te.id
       ${planId ? 'WHERE te.plan_id = $1' : ''}`,
      planId ? [planId] : []
    )

    // Get improvement actions status
    const improvementResult = await query(
      `SELECT 
         COUNT(*) as total_actions,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_actions,
         AVG(effectiveness_rating) as avg_effectiveness
       FROM improvement_actions
       ${planId ? 'WHERE plan_id = $1' : ''}`,
      planId ? [planId] : []
    )

    return {
      success: true,
      data: {
        overview: planResult.rows[0],
        execution: executionResult.rows[0],
        satisfaction: satisfactionResult.rows[0],
        learning: learningResult.rows[0],
        behavior: behaviorResult.rows[0],
        employment: employmentResult.rows[0],
        improvement: improvementResult.rows[0]
      }
    }
  } catch (error) {
    console.error('Get TTQS dashboard error:', error)
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '獲取TTQS儀表板數據失敗',
        statusCode: 500
      }
    }
  }
}

// Trend Analysis
export const getTTQSTrends: RouteHandler = async (req: ApiRequest) => {
  try {
    const planId = req.query?.plan_id
    const months = parseInt(req.query?.months || '6')

    // Get satisfaction trends
    const satisfactionTrend = await query(
      `SELECT 
         DATE_TRUNC('month', te.execution_date) as month,
         AVG(re.overall_satisfaction) as avg_satisfaction
       FROM reaction_evaluations re
       JOIN training_executions te ON re.execution_id = te.id
       WHERE te.execution_date >= NOW() - INTERVAL '${months} months'
       ${planId ? 'AND te.plan_id = $1' : ''}
       GROUP BY DATE_TRUNC('month', te.execution_date)
       ORDER BY month`,
      planId ? [planId] : []
    )

    // Get learning performance trends
    const learningTrend = await query(
      `SELECT 
         DATE_TRUNC('month', te.execution_date) as month,
         AVG(le.post_test_score) as avg_score,
         SUM(CASE WHEN le.passed = true THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as pass_rate
       FROM learning_evaluations le
       JOIN training_executions te ON le.execution_id = te.id
       WHERE te.execution_date >= NOW() - INTERVAL '${months} months'
       ${planId ? 'AND te.plan_id = $1' : ''}
       GROUP BY DATE_TRUNC('month', te.execution_date)
       ORDER BY month`,
      planId ? [planId] : []
    )

    // Get employment trends
    const employmentTrend = await query(
      `SELECT 
         DATE_TRUNC('month', re.employment_date) as month,
         SUM(CASE WHEN re.employment_status = 'employed' THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as employment_rate
       FROM result_evaluations re
       JOIN training_executions te ON re.execution_id = te.id
       WHERE re.employment_date >= NOW() - INTERVAL '${months} months'
       ${planId ? 'AND te.plan_id = $1' : ''}
       GROUP BY DATE_TRUNC('month', re.employment_date)
       ORDER BY month`,
      planId ? [planId] : []
    )

    return {
      success: true,
      data: {
        satisfaction: satisfactionTrend.rows,
        learning: learningTrend.rows,
        employment: employmentTrend.rows
      }
    }
  } catch (error) {
    console.error('Get TTQS trends error:', error)
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '獲取TTQS趨勢數據失敗',
        statusCode: 500
      }
    }
  }
}

// Automated Report Generation
export const generateTTQSReport: RouteHandler = async (req: ApiRequest) => {
  try {
    const planId = req.params?.plan_id

    if (!planId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '計劃ID為必填項',
          statusCode: 400
        }
      }
    }

    // Get training plan details
    const planResult = await query('SELECT * FROM training_plans WHERE id = $1', [planId])

    if (planResult.rows.length === 0) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '訓練計劃不存在',
          statusCode: 404
        }
      }
    }

    const plan = planResult.rows[0]

    // Get all executions
    const executionsResult = await query(
      `SELECT te.*, c.title as course_title
       FROM training_executions te
       LEFT JOIN courses c ON te.course_id = c.id
       WHERE te.plan_id = $1
       ORDER BY te.execution_date`,
      [planId]
    )

    // Get Level 1 data (Reaction)
    const reactionData = await query(
      `SELECT 
         AVG(re.course_satisfaction) as avg_course,
         AVG(re.instructor_satisfaction) as avg_instructor,
         AVG(re.content_satisfaction) as avg_content,
         AVG(re.facility_satisfaction) as avg_facility,
         AVG(re.overall_satisfaction) as avg_overall,
         COUNT(*) as response_count
       FROM reaction_evaluations re
       JOIN training_executions te ON re.execution_id = te.id
       WHERE te.plan_id = $1`,
      [planId]
    )

    // Get Level 2 data (Learning)
    const learningData = await query(
      `SELECT 
         AVG(le.pre_test_score) as avg_pre_test,
         AVG(le.post_test_score) as avg_post_test,
         AVG(le.improvement_rate) as avg_improvement,
         SUM(CASE WHEN le.passed = true THEN 1 ELSE 0 END) as passed_count,
         COUNT(*) as total_students,
         SUM(CASE WHEN le.passed = true THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as pass_rate
       FROM learning_evaluations le
       JOIN training_executions te ON le.execution_id = te.id
       WHERE te.plan_id = $1`,
      [planId]
    )

    // Get Level 3 data (Behavior)
    const behaviorData = await query(
      `SELECT 
         AVG(be.skill_application_score) as avg_skill,
         AVG(be.work_quality_score) as avg_quality,
         AVG(be.efficiency_score) as avg_efficiency,
         AVG(be.overall_behavior_score) as avg_overall,
         COUNT(*) as evaluation_count
       FROM behavior_evaluations be
       JOIN training_executions te ON be.execution_id = te.id
       WHERE te.plan_id = $1`,
      [planId]
    )

    // Get Level 4 data (Results)
    const resultData = await query(
      `SELECT 
         SUM(CASE WHEN re.employment_status = 'employed' THEN 1 ELSE 0 END) as employed_count,
         COUNT(*) as total_graduates,
         SUM(CASE WHEN re.employment_status = 'employed' THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as employment_rate,
         AVG(re.job_match_rate) as avg_match_rate,
         AVG(re.salary_level) as avg_salary,
         AVG(re.employer_satisfaction) as avg_employer_satisfaction,
         AVG(re.retention_months) as avg_retention
       FROM result_evaluations re
       JOIN training_executions te ON re.execution_id = te.id
       WHERE te.plan_id = $1`,
      [planId]
    )

    // Get improvement actions
    const improvementData = await query(
      `SELECT ia.*, u.first_name || ' ' || u.last_name as responsible_person_name
       FROM improvement_actions ia
       LEFT JOIN users u ON ia.responsible_person = u.id
       WHERE ia.plan_id = $1
       ORDER BY ia.created_at DESC`,
      [planId]
    )

    // Compile report
    const report = {
      generated_at: new Date().toISOString(),
      plan: plan,
      executions: executionsResult.rows,
      evaluation_summary: {
        level1_reaction: reactionData.rows[0],
        level2_learning: learningData.rows[0],
        level3_behavior: behaviorData.rows[0],
        level4_results: resultData.rows[0]
      },
      improvement_actions: improvementData.rows,
      recommendations: generateRecommendations(
        reactionData.rows[0],
        learningData.rows[0],
        behaviorData.rows[0],
        resultData.rows[0]
      )
    }

    return {
      success: true,
      data: report
    }
  } catch (error) {
    console.error('Generate TTQS report error:', error)
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '生成TTQS報告失敗',
        statusCode: 500
      }
    }
  }
}

// Helper function to generate recommendations
function generateRecommendations(reaction: any, learning: any, behavior: any, results: any) {
  const recommendations = []

  // Check satisfaction scores
  if (reaction.avg_overall < 4) {
    recommendations.push({
      category: '反應層',
      issue: '整體滿意度低於4分',
      suggestion: '建議改善課程內容、教學方式或設施環境'
    })
  }

  // Check learning outcomes
  if (learning.pass_rate < 80) {
    recommendations.push({
      category: '學習層',
      issue: `通過率${learning.pass_rate?.toFixed(1)}%低於目標80%`,
      suggestion: '建議加強課前準備、增加練習時間或調整教學難度'
    })
  }

  if (learning.avg_post_test < 80) {
    recommendations.push({
      category: '學習層',
      issue: `平均測驗成績${learning.avg_post_test?.toFixed(1)}分低於目標80分`,
      suggestion: '建議檢視課程內容與測驗的對應性，加強重點知識講解'
    })
  }

  // Check behavior scores
  if (behavior.avg_overall < 4) {
    recommendations.push({
      category: '行為層',
      issue: '整體行為表現低於4分',
      suggestion: '建議增加實務操作訓練，提供更多實習機會'
    })
  }

  // Check employment outcomes
  if (results.employment_rate < 80) {
    recommendations.push({
      category: '成果層',
      issue: `就業率${results.employment_rate?.toFixed(1)}%低於目標80%`,
      suggestion: '建議加強就業媒合服務，擴大雇主合作網絡'
    })
  }

  if (results.avg_match_rate < 80) {
    recommendations.push({
      category: '成果層',
      issue: '職位匹配度偏低',
      suggestion: '建議優化課程內容以符合市場需求，加強職涯輔導'
    })
  }

  // If all metrics are good
  if (recommendations.length === 0) {
    recommendations.push({
      category: '整體',
      issue: '各項指標表現良好',
      suggestion: '持續維持現有品質，可考慮擴大訓練規模或開發進階課程'
    })
  }

  return recommendations
}

// Get TTQS Compliance Status
export const getTTQSCompliance: RouteHandler = async (req: ApiRequest) => {
  try {
    const planId = req.query?.plan_id

    // Check PDDRO completeness
    const pddroStatus = {
      plan: false,
      design: false,
      do: false,
      review: false,
      outcome: false
    }

    // Check if plan exists
    const planCheck = await query(
      `SELECT COUNT(*) as count FROM training_plans ${planId ? 'WHERE id = $1' : ''}`,
      planId ? [planId] : []
    )
    pddroStatus.plan = parseInt(planCheck.rows[0].count) > 0

    // Check if executions exist
    const executionCheck = await query(
      `SELECT COUNT(*) as count FROM training_executions ${planId ? 'WHERE plan_id = $1' : ''}`,
      planId ? [planId] : []
    )
    pddroStatus.do = parseInt(executionCheck.rows[0].count) > 0

    // Check if evaluations exist (all 4 levels)
    const evaluationCheck = await query(
      `SELECT 
         (SELECT COUNT(*) FROM reaction_evaluations re JOIN training_executions te ON re.execution_id = te.id ${planId ? 'WHERE te.plan_id = $1' : ''}) as reaction_count,
         (SELECT COUNT(*) FROM learning_evaluations le JOIN training_executions te ON le.execution_id = te.id ${planId ? 'WHERE te.plan_id = $1' : ''}) as learning_count,
         (SELECT COUNT(*) FROM behavior_evaluations be JOIN training_executions te ON be.execution_id = te.id ${planId ? 'WHERE te.plan_id = $1' : ''}) as behavior_count,
         (SELECT COUNT(*) FROM result_evaluations re JOIN training_executions te ON re.execution_id = te.id ${planId ? 'WHERE te.plan_id = $1' : ''}) as result_count`,
      planId ? [planId, planId, planId, planId] : []
    )
    const evalCounts = evaluationCheck.rows[0] as any
    pddroStatus.review =
      parseInt(String(evalCounts?.reaction_count || '0')) > 0 &&
      parseInt(String(evalCounts?.learning_count || '0')) > 0 &&
      parseInt(String(evalCounts?.behavior_count || '0')) > 0 &&
      parseInt(String(evalCounts?.result_count || '0')) > 0

    // Check if improvement actions exist
    const improvementCheck = await query(
      `SELECT COUNT(*) as count FROM improvement_actions ${planId ? 'WHERE plan_id = $1' : ''}`,
      planId ? [planId] : []
    )
    pddroStatus.outcome = parseInt(improvementCheck.rows[0].count) > 0

    const complianceRate = (Object.values(pddroStatus).filter(v => v).length / 5) * 100

    return {
      success: true,
      data: {
        pddro_status: pddroStatus,
        compliance_rate: complianceRate,
        is_compliant: complianceRate === 100
      }
    }
  } catch (error) {
    console.error('Get TTQS compliance error:', error)
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '獲取TTQS合規狀態失敗',
        statusCode: 500
      }
    }
  }
}

// Setup TTQS Analytics routes
export function setupTTQSAnalyticsRoutes(router: any) {
  // Document Management
  router.post('/api/v1/ttqs/documents', uploadTTQSDocument)
  router.get('/api/v1/ttqs/documents', getTTQSDocuments)

  // Analytics Dashboard
  router.get('/api/v1/ttqs/dashboard', getTTQSDashboard)
  router.get('/api/v1/ttqs/trends', getTTQSTrends)
  router.get('/api/v1/ttqs/compliance', getTTQSCompliance)

  // Report Generation
  router.get('/api/v1/ttqs/reports/:plan_id', generateTTQSReport)
}
