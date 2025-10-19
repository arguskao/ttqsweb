import type { ApiRequest, ApiResponse, RouteHandler } from './types'
import { query } from './database'

// Level 1: Reaction Evaluation (Satisfaction Survey)
export const createReactionEvaluation: RouteHandler = async (req: ApiRequest) => {
    try {
        const {
            execution_id,
            course_satisfaction,
            instructor_satisfaction,
            content_satisfaction,
            facility_satisfaction,
            overall_satisfaction,
            comments
        } = req.body as any

        if (!execution_id) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '執行ID為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `INSERT INTO reaction_evaluations 
       (execution_id, user_id, course_satisfaction, instructor_satisfaction, content_satisfaction, 
        facility_satisfaction, overall_satisfaction, comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [execution_id, req.user?.id, course_satisfaction, instructor_satisfaction, content_satisfaction,
                facility_satisfaction, overall_satisfaction, comments]
        )

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Create reaction evaluation error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '建立反應層評估失敗',
                statusCode: 500
            }
        }
    }
}

export const getReactionEvaluations: RouteHandler = async (req: ApiRequest) => {
    try {
        const executionId = req.query?.execution_id

        if (!executionId) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '執行ID為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `SELECT re.*, u.first_name || ' ' || u.last_name as user_name
       FROM reaction_evaluations re
       LEFT JOIN users u ON re.user_id = u.id
       WHERE re.execution_id = $1
       ORDER BY re.created_at DESC`,
            [executionId]
        )

        // Calculate average scores
        const avgResult = await query(
            `SELECT 
         AVG(course_satisfaction) as avg_course,
         AVG(instructor_satisfaction) as avg_instructor,
         AVG(content_satisfaction) as avg_content,
         AVG(facility_satisfaction) as avg_facility,
         AVG(overall_satisfaction) as avg_overall,
         COUNT(*) as total_responses
       FROM reaction_evaluations
       WHERE execution_id = $1`,
            [executionId]
        )

        return {
            success: true,
            data: {
                evaluations: result.rows,
                averages: avgResult.rows[0]
            }
        }
    } catch (error) {
        console.error('Get reaction evaluations error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取反應層評估失敗',
                statusCode: 500
            }
        }
    }
}

// Level 2: Learning Evaluation (Test Scores)
export const createLearningEvaluation: RouteHandler = async (req: ApiRequest) => {
    try {
        const { execution_id, pre_test_score, post_test_score } = req.body as any

        if (!execution_id || post_test_score === undefined) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '執行ID和測驗成績為必填項',
                    statusCode: 400
                }
            }
        }

        // Calculate improvement rate
        let improvement_rate = null
        if (pre_test_score !== null && pre_test_score !== undefined) {
            improvement_rate = ((post_test_score - pre_test_score) / pre_test_score) * 100
        }

        const passed = post_test_score >= 80

        const result = await query(
            `INSERT INTO learning_evaluations 
       (execution_id, user_id, pre_test_score, post_test_score, improvement_rate, passed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [execution_id, req.user?.id, pre_test_score, post_test_score, improvement_rate, passed]
        )

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Create learning evaluation error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '建立學習層評估失敗',
                statusCode: 500
            }
        }
    }
}

export const getLearningEvaluations: RouteHandler = async (req: ApiRequest) => {
    try {
        const executionId = req.query?.execution_id

        if (!executionId) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '執行ID為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `SELECT le.*, u.first_name || ' ' || u.last_name as user_name
       FROM learning_evaluations le
       LEFT JOIN users u ON le.user_id = u.id
       WHERE le.execution_id = $1
       ORDER BY le.created_at DESC`,
            [executionId]
        )

        // Calculate statistics
        const statsResult = await query(
            `SELECT 
         AVG(pre_test_score) as avg_pre_test,
         AVG(post_test_score) as avg_post_test,
         AVG(improvement_rate) as avg_improvement,
         COUNT(*) as total_students,
         SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed_count,
         (SUM(CASE WHEN passed = true THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100) as pass_rate
       FROM learning_evaluations
       WHERE execution_id = $1`,
            [executionId]
        )

        return {
            success: true,
            data: {
                evaluations: result.rows,
                statistics: statsResult.rows[0]
            }
        }
    } catch (error) {
        console.error('Get learning evaluations error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取學習層評估失敗',
                statusCode: 500
            }
        }
    }
}

// Level 3: Behavior Evaluation (Application Ability)
export const createBehaviorEvaluation: RouteHandler = async (req: ApiRequest) => {
    try {
        const {
            execution_id,
            user_id,
            skill_application_score,
            work_quality_score,
            efficiency_score,
            overall_behavior_score,
            evaluation_date,
            comments
        } = req.body as any

        if (!execution_id || !user_id) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '執行ID和用戶ID為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `INSERT INTO behavior_evaluations 
       (execution_id, user_id, evaluator_id, skill_application_score, work_quality_score, 
        efficiency_score, overall_behavior_score, evaluation_date, comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [execution_id, user_id, req.user?.id, skill_application_score, work_quality_score,
                efficiency_score, overall_behavior_score, evaluation_date, comments]
        )

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Create behavior evaluation error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '建立行為層評估失敗',
                statusCode: 500
            }
        }
    }
}

export const getBehaviorEvaluations: RouteHandler = async (req: ApiRequest) => {
    try {
        const executionId = req.query?.execution_id
        const userId = req.query?.user_id

        let queryText = `
      SELECT be.*, 
             u1.first_name || ' ' || u1.last_name as user_name,
             u2.first_name || ' ' || u2.last_name as evaluator_name
      FROM behavior_evaluations be
      LEFT JOIN users u1 ON be.user_id = u1.id
      LEFT JOIN users u2 ON be.evaluator_id = u2.id
      WHERE 1=1
    `
        const params: any[] = []

        if (executionId) {
            params.push(executionId)
            queryText += ' AND be.execution_id = $' + params.length
        }

        if (userId) {
            params.push(userId)
            queryText += ' AND be.user_id = $' + params.length
        }

        queryText += ' ORDER BY be.evaluation_date DESC'

        const result = await query(queryText, params)

        // Calculate averages if execution_id is provided
        let averages = null
        if (executionId) {
            const avgResult = await query(
                `SELECT 
           AVG(skill_application_score) as avg_skill_application,
           AVG(work_quality_score) as avg_work_quality,
           AVG(efficiency_score) as avg_efficiency,
           AVG(overall_behavior_score) as avg_overall,
           COUNT(*) as total_evaluations
         FROM behavior_evaluations
         WHERE execution_id = $1`,
                [executionId]
            )
            averages = avgResult.rows[0]
        }

        return {
            success: true,
            data: {
                evaluations: result.rows,
                averages
            }
        }
    } catch (error) {
        console.error('Get behavior evaluations error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取行為層評估失敗',
                statusCode: 500
            }
        }
    }
}

// Level 4: Result Evaluation (Employment Outcomes)
export const createResultEvaluation: RouteHandler = async (req: ApiRequest) => {
    try {
        const {
            execution_id,
            user_id,
            employment_status,
            employment_date,
            job_match_rate,
            salary_level,
            employer_satisfaction,
            retention_months
        } = req.body as any

        if (!execution_id || !user_id || !employment_status) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '執行ID、用戶ID和就業狀態為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `INSERT INTO result_evaluations 
       (execution_id, user_id, employment_status, employment_date, job_match_rate, 
        salary_level, employer_satisfaction, retention_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [execution_id, user_id, employment_status, employment_date, job_match_rate,
                salary_level, employer_satisfaction, retention_months]
        )

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Create result evaluation error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '建立成果層評估失敗',
                statusCode: 500
            }
        }
    }
}

export const getResultEvaluations: RouteHandler = async (req: ApiRequest) => {
    try {
        const executionId = req.query?.execution_id

        if (!executionId) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '執行ID為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `SELECT re.*, u.first_name || ' ' || u.last_name as user_name
       FROM result_evaluations re
       LEFT JOIN users u ON re.user_id = u.id
       WHERE re.execution_id = $1
       ORDER BY re.created_at DESC`,
            [executionId]
        )

        // Calculate employment statistics
        const statsResult = await query(
            `SELECT 
         COUNT(*) as total_students,
         SUM(CASE WHEN employment_status = 'employed' THEN 1 ELSE 0 END) as employed_count,
         (SUM(CASE WHEN employment_status = 'employed' THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100) as employment_rate,
         AVG(job_match_rate) as avg_job_match_rate,
         AVG(salary_level) as avg_salary,
         AVG(employer_satisfaction) as avg_employer_satisfaction,
         AVG(retention_months) as avg_retention_months
       FROM result_evaluations
       WHERE execution_id = $1`,
            [executionId]
        )

        return {
            success: true,
            data: {
                evaluations: result.rows,
                statistics: statsResult.rows[0]
            }
        }
    } catch (error) {
        console.error('Get result evaluations error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取成果層評估失敗',
                statusCode: 500
            }
        }
    }
}

export const updateResultEvaluation: RouteHandler = async (req: ApiRequest) => {
    try {
        const id = req.params?.id
        const {
            employment_status,
            employment_date,
            job_match_rate,
            salary_level,
            employer_satisfaction,
            retention_months
        } = req.body as any

        const result = await query(
            `UPDATE result_evaluations 
       SET employment_status = COALESCE($1, employment_status),
           employment_date = COALESCE($2, employment_date),
           job_match_rate = COALESCE($3, job_match_rate),
           salary_level = COALESCE($4, salary_level),
           employer_satisfaction = COALESCE($5, employer_satisfaction),
           retention_months = COALESCE($6, retention_months)
       WHERE id = $7
       RETURNING *`,
            [employment_status, employment_date, job_match_rate, salary_level,
                employer_satisfaction, retention_months, id]
        )

        if (result.rows.length === 0) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: '成果層評估不存在',
                    statusCode: 404
                }
            }
        }

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Update result evaluation error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '更新成果層評估失敗',
                statusCode: 500
            }
        }
    }
}


// Setup Evaluation routes
export function setupEvaluationRoutes(router: any) {
    // Level 1: Reaction Evaluation
    router.post('/api/v1/evaluations/reaction', createReactionEvaluation)
    router.get('/api/v1/evaluations/reaction', getReactionEvaluations)

    // Level 2: Learning Evaluation
    router.post('/api/v1/evaluations/learning', createLearningEvaluation)
    router.get('/api/v1/evaluations/learning', getLearningEvaluations)

    // Level 3: Behavior Evaluation
    router.post('/api/v1/evaluations/behavior', createBehaviorEvaluation)
    router.get('/api/v1/evaluations/behavior', getBehaviorEvaluations)

    // Level 4: Result Evaluation
    router.post('/api/v1/evaluations/result', createResultEvaluation)
    router.get('/api/v1/evaluations/result', getResultEvaluations)
    router.put('/api/v1/evaluations/result/:id', updateResultEvaluation)
}
