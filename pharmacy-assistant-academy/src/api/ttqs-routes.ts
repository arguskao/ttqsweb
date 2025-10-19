import type { ApiRequest, ApiResponse, RouteHandler } from './types'
import { query } from './database'

// Training Plan Management (PDDRO - Plan)
export const createTrainingPlan: RouteHandler = async (req: ApiRequest) => {
    try {
        const { title, description, objectives, target_audience, duration_weeks, start_date, end_date } = req.body as any

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

        const result = await query(
            `INSERT INTO training_plans (title, description, objectives, target_audience, duration_weeks, start_date, end_date, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
       RETURNING *`,
            [title, description, objectives, target_audience, duration_weeks, start_date, end_date, req.user?.id]
        )

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Create training plan error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '建立訓練計劃失敗',
                statusCode: 500
            }
        }
    }
}

export const getTrainingPlans: RouteHandler = async (req: ApiRequest) => {
    try {
        const status = req.query?.status
        const page = parseInt(req.query?.page || '1')
        const limit = parseInt(req.query?.limit || '10')
        const offset = (page - 1) * limit

        let queryText = 'SELECT * FROM training_plans'
        const params: any[] = []

        if (status) {
            queryText += ' WHERE status = $1'
            params.push(status)
        }

        queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
        params.push(limit, offset)

        const result = await query(queryText, params)

        const countQuery = status
            ? 'SELECT COUNT(*) FROM training_plans WHERE status = $1'
            : 'SELECT COUNT(*) FROM training_plans'
        const countResult = await query(countQuery, status ? [status] : [])
        const total = parseInt(countResult.rows[0].count)

        return {
            success: true,
            data: result.rows,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        console.error('Get training plans error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取訓練計劃失敗',
                statusCode: 500
            }
        }
    }
}

export const getTrainingPlanById: RouteHandler = async (req: ApiRequest) => {
    try {
        const id = req.params?.id

        const result = await query(
            'SELECT * FROM training_plans WHERE id = $1',
            [id]
        )

        if (result.rows.length === 0) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: '訓練計劃不存在',
                    statusCode: 404
                }
            }
        }

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Get training plan error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取訓練計劃失敗',
                statusCode: 500
            }
        }
    }
}

export const updateTrainingPlan: RouteHandler = async (req: ApiRequest) => {
    try {
        const id = req.params?.id
        const { title, description, objectives, target_audience, duration_weeks, start_date, end_date, status } = req.body as any

        const result = await query(
            `UPDATE training_plans 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           objectives = COALESCE($3, objectives),
           target_audience = COALESCE($4, target_audience),
           duration_weeks = COALESCE($5, duration_weeks),
           start_date = COALESCE($6, start_date),
           end_date = COALESCE($7, end_date),
           status = COALESCE($8, status)
       WHERE id = $9
       RETURNING *`,
            [title, description, objectives, target_audience, duration_weeks, start_date, end_date, status, id]
        )

        if (result.rows.length === 0) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: '訓練計劃不存在',
                    statusCode: 404
                }
            }
        }

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Update training plan error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '更新訓練計劃失敗',
                statusCode: 500
            }
        }
    }
}

// Training Execution Tracking (PDDRO - Do)
export const createTrainingExecution: RouteHandler = async (req: ApiRequest) => {
    try {
        const { plan_id, course_id, execution_date, instructor_id, attendance_count, notes } = req.body as any

        if (!plan_id || !course_id || !execution_date) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '計劃ID、課程ID和執行日期為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `INSERT INTO training_executions (plan_id, course_id, execution_date, instructor_id, attendance_count, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`,
            [plan_id, course_id, execution_date, instructor_id, attendance_count, notes]
        )

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Create training execution error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '建立訓練執行記錄失敗',
                statusCode: 500
            }
        }
    }
}

export const getTrainingExecutions: RouteHandler = async (req: ApiRequest) => {
    try {
        const planId = req.query?.plan_id
        const page = parseInt(req.query?.page || '1')
        const limit = parseInt(req.query?.limit || '10')
        const offset = (page - 1) * limit

        let queryText = `
      SELECT te.*, c.title as course_title, u.first_name || ' ' || u.last_name as instructor_name
      FROM training_executions te
      LEFT JOIN courses c ON te.course_id = c.id
      LEFT JOIN users u ON te.instructor_id = u.id
    `
        const params: any[] = []

        if (planId) {
            queryText += ' WHERE te.plan_id = $1'
            params.push(planId)
        }

        queryText += ' ORDER BY te.execution_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
        params.push(limit, offset)

        const result = await query(queryText, params)

        const countQuery = planId
            ? 'SELECT COUNT(*) FROM training_executions WHERE plan_id = $1'
            : 'SELECT COUNT(*) FROM training_executions'
        const countResult = await query(countQuery, planId ? [planId] : [])
        const total = parseInt(countResult.rows[0].count)

        return {
            success: true,
            data: result.rows,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        console.error('Get training executions error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取訓練執行記錄失敗',
                statusCode: 500
            }
        }
    }
}

export const updateTrainingExecution: RouteHandler = async (req: ApiRequest) => {
    try {
        const id = req.params?.id
        const { attendance_count, completion_rate, notes, status } = req.body as any

        const result = await query(
            `UPDATE training_executions 
       SET attendance_count = COALESCE($1, attendance_count),
           completion_rate = COALESCE($2, completion_rate),
           notes = COALESCE($3, notes),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
            [attendance_count, completion_rate, notes, status, id]
        )

        if (result.rows.length === 0) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: '訓練執行記錄不存在',
                    statusCode: 404
                }
            }
        }

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Update training execution error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '更新訓練執行記錄失敗',
                statusCode: 500
            }
        }
    }
}

// Improvement Actions (PDDRO - Outcome)
export const createImprovementAction: RouteHandler = async (req: ApiRequest) => {
    try {
        const { plan_id, issue_description, root_cause_analysis, action_plan, responsible_person, due_date } = req.body as any

        if (!plan_id || !issue_description || !action_plan) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '計劃ID、問題描述和行動計劃為必填項',
                    statusCode: 400
                }
            }
        }

        const result = await query(
            `INSERT INTO improvement_actions (plan_id, issue_description, root_cause_analysis, action_plan, responsible_person, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
            [plan_id, issue_description, root_cause_analysis, action_plan, responsible_person, due_date]
        )

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Create improvement action error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '建立改善行動失敗',
                statusCode: 500
            }
        }
    }
}

export const getImprovementActions: RouteHandler = async (req: ApiRequest) => {
    try {
        const planId = req.query?.plan_id
        const status = req.query?.status

        let queryText = `
      SELECT ia.*, u.first_name || ' ' || u.last_name as responsible_person_name
      FROM improvement_actions ia
      LEFT JOIN users u ON ia.responsible_person = u.id
      WHERE 1=1
    `
        const params: any[] = []

        if (planId) {
            params.push(planId)
            queryText += ' AND ia.plan_id = $' + params.length
        }

        if (status) {
            params.push(status)
            queryText += ' AND ia.status = $' + params.length
        }

        queryText += ' ORDER BY ia.created_at DESC'

        const result = await query(queryText, params)

        return {
            success: true,
            data: result.rows
        }
    } catch (error) {
        console.error('Get improvement actions error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '獲取改善行動失敗',
                statusCode: 500
            }
        }
    }
}

export const updateImprovementAction: RouteHandler = async (req: ApiRequest) => {
    try {
        const id = req.params?.id
        const { status, completion_date, effectiveness_rating } = req.body as any

        const result = await query(
            `UPDATE improvement_actions 
       SET status = COALESCE($1, status),
           completion_date = COALESCE($2, completion_date),
           effectiveness_rating = COALESCE($3, effectiveness_rating)
       WHERE id = $4
       RETURNING *`,
            [status, completion_date, effectiveness_rating, id]
        )

        if (result.rows.length === 0) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: '改善行動不存在',
                    statusCode: 404
                }
            }
        }

        return {
            success: true,
            data: result.rows[0]
        }
    } catch (error) {
        console.error('Update improvement action error:', error)
        return {
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '更新改善行動失敗',
                statusCode: 500
            }
        }
    }
}


// Setup TTQS routes
export function setupTTQSRoutes(router: any) {
    // Training Plan routes
    router.post('/api/v1/ttqs/plans', createTrainingPlan)
    router.get('/api/v1/ttqs/plans', getTrainingPlans)
    router.get('/api/v1/ttqs/plans/:id', getTrainingPlanById)
    router.put('/api/v1/ttqs/plans/:id', updateTrainingPlan)

    // Training Execution routes
    router.post('/api/v1/ttqs/executions', createTrainingExecution)
    router.get('/api/v1/ttqs/executions', getTrainingExecutions)
    router.put('/api/v1/ttqs/executions/:id', updateTrainingExecution)

    // Improvement Action routes
    router.post('/api/v1/ttqs/improvements', createImprovementAction)
    router.get('/api/v1/ttqs/improvements', getImprovementActions)
    router.put('/api/v1/ttqs/improvements/:id', updateImprovementAction)
}
