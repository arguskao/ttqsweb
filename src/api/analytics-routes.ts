import { db } from '../utils/cloudflare-database'

import { ValidationError } from './errors'
import { withAuth } from './middleware-helpers'
import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse } from './types'

export function setupAnalyticsRoutes(router: ApiRouter): void {
  // 學員學習統計 API
  router.get('/api/v1/analytics/learning-stats', withAuth(getLearningStats))

  // 就業媒合成功率統計 API
  router.get('/api/v1/analytics/job-matching-stats', withAuth(getJobMatchingStats))

  // 課程滿意度統計 API
  router.get('/api/v1/analytics/course-satisfaction-stats', withAuth(getCourseSatisfactionStats))

  // 綜合統計儀表板數據
  router.get('/api/v1/analytics/dashboard', withAuth(getDashboardStats))

  // 匯出報告
  router.get('/api/v1/analytics/export', withAuth(exportReport))
}

// 學員學習統計
async function getLearningStats(req: ApiRequest): Promise<ApiResponse> {
  const { startDate, endDate, courseType } = req.query ?? {}

  try {
    // 基礎查詢條件
    let dateFilter = ''
    const params: any[] = []

    if (startDate && endDate) {
      dateFilter = 'AND ce.enrollment_date BETWEEN $1 AND $2'
      params.push(startDate, endDate)
    }

    let courseTypeFilter = ''
    if (courseType) {
      courseTypeFilter =
        params.length > 0 ? `AND c.course_type = $${params.length + 1}` : 'AND c.course_type = $1'
      params.push(courseType)
    }

    // 總體學習統計
    const overallStatsQuery = `
            SELECT 
                COUNT(DISTINCT ce.user_id) as total_learners,
                COUNT(DISTINCT ce.course_id) as total_courses_enrolled,
                COUNT(*) as total_enrollments,
                COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completed_enrollments,
                COUNT(CASE WHEN ce.status = 'in_progress' THEN 1 END) as in_progress_enrollments,
                COUNT(CASE WHEN ce.status = 'dropped' THEN 1 END) as dropped_enrollments,
                ROUND(AVG(ce.progress_percentage), 2) as avg_progress,
                ROUND(AVG(CASE WHEN ce.final_score IS NOT NULL THEN ce.final_score END), 2) as avg_score,
                COUNT(CASE WHEN ce.final_score >= 80 THEN 1 END) as passing_count,
                COUNT(CASE WHEN ce.final_score IS NOT NULL THEN 1 END) as total_scored
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE 1=1 ${dateFilter} ${courseTypeFilter}
        `

    const overallStatsResult = await db.query({ text: overallStatsQuery, values: params })

    // 按課程類型統計
    const courseTypeStatsQuery = `
            SELECT 
                c.course_type,
                COUNT(DISTINCT ce.user_id) as learner_count,
                COUNT(*) as enrollment_count,
                COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completed_count,
                ROUND(AVG(ce.progress_percentage), 2) as avg_progress,
                ROUND(AVG(CASE WHEN ce.final_score IS NOT NULL THEN ce.final_score END), 2) as avg_score
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE 1=1 ${dateFilter}
            GROUP BY c.course_type
            ORDER BY c.course_type
        `

    const courseTypeStatsResult = await db.query({
      text: courseTypeStatsQuery,
      values: params.length > 2 ? params.slice(0, 2) : params
    })

    // 每月學習趨勢
    const monthlyTrendQuery = `
            SELECT 
                TO_CHAR(ce.enrollment_date, 'YYYY-MM') as month,
                COUNT(DISTINCT ce.user_id) as new_learners,
                COUNT(*) as new_enrollments,
                COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completions
            FROM course_enrollments ce
            WHERE 1=1 ${dateFilter}
            GROUP BY TO_CHAR(ce.enrollment_date, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT 12
        `

    const monthlyTrendResult = await db.query({
      text: monthlyTrendQuery,
      values: params.length > 2 ? params.slice(0, 2) : params
    })

    // 熱門課程排行
    const topCoursesQuery = `
            SELECT 
                c.id,
                c.title,
                c.course_type,
                COUNT(*) as enrollment_count,
                COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completion_count,
                ROUND(AVG(ce.final_score), 2) as avg_score,
                ROUND(COUNT(CASE WHEN ce.status = 'completed' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as completion_rate
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE 1=1 ${dateFilter} ${courseTypeFilter}
            GROUP BY c.id, c.title, c.course_type
            ORDER BY enrollment_count DESC
            LIMIT 10
        `

    const topCoursesResult = await db.query({ text: topCoursesQuery, values: params })

    return {
      success: true,
      data: {
        overall: overallStatsResult.rows[0],
        byType: courseTypeStatsResult.rows,
        monthlyTrend: monthlyTrendResult.rows,
        topCourses: topCoursesResult.rows,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          courseType: courseType || null
        }
      }
    }
  } catch (error) {
    console.error('Error fetching learning stats:', error)
    throw error
  }
}

// 就業媒合成功率統計
async function getJobMatchingStats(req: ApiRequest): Promise<ApiResponse> {
  const { startDate, endDate } = req.query ?? {}

  try {
    let dateFilter = ''
    const params: any[] = []

    if (startDate && endDate) {
      dateFilter = 'AND ja.application_date BETWEEN $1 AND $2'
      params.push(startDate, endDate)
    }

    // 總體就業統計
    const overallStatsQuery = `
            SELECT 
                COUNT(DISTINCT ja.applicant_id) as total_applicants,
                COUNT(*) as total_applications,
                COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END) as accepted_applications,
                COUNT(CASE WHEN ja.status = 'rejected' THEN 1 END) as rejected_applications,
                COUNT(CASE WHEN ja.status = 'pending' THEN 1 END) as pending_applications,
                COUNT(CASE WHEN ja.status = 'reviewed' THEN 1 END) as reviewed_applications,
                ROUND(COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END)::numeric / 
                      NULLIF(COUNT(CASE WHEN ja.status IN ('accepted', 'rejected') THEN 1 END), 0)::numeric * 100, 2) as success_rate
            FROM job_applications ja
            WHERE 1=1 ${dateFilter}
        `

    const overallStatsResult = await db.query({ text: overallStatsQuery, values: params })

    // 按職位類型統計
    const jobTypeStatsQuery = `
            SELECT 
                j.job_type,
                COUNT(*) as application_count,
                COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END) as accepted_count,
                ROUND(COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END)::numeric / 
                      NULLIF(COUNT(CASE WHEN ja.status IN ('accepted', 'rejected') THEN 1 END), 0)::numeric * 100, 2) as success_rate
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            WHERE 1=1 ${dateFilter}
            GROUP BY j.job_type
            ORDER BY application_count DESC
        `

    const jobTypeStatsResult = await db.query({ text: jobTypeStatsQuery, values: params })

    // 每月就業趨勢
    const monthlyTrendQuery = `
            SELECT 
                TO_CHAR(ja.application_date, 'YYYY-MM') as month,
                COUNT(*) as applications,
                COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END) as acceptances,
                ROUND(COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END)::numeric / 
                      NULLIF(COUNT(CASE WHEN ja.status IN ('accepted', 'rejected') THEN 1 END), 0)::numeric * 100, 2) as success_rate
            FROM job_applications ja
            WHERE 1=1 ${dateFilter}
            GROUP BY TO_CHAR(ja.application_date, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT 12
        `

    const monthlyTrendResult = await db.query({ text: monthlyTrendQuery, values: params })

    // 學員就業成功率（完成課程後的就業情況）
    const learnerSuccessQuery = `
            SELECT 
                COUNT(DISTINCT u.id) as total_learners_with_applications,
                COUNT(DISTINCT CASE WHEN ja.status = 'accepted' THEN u.id END) as employed_learners,
                ROUND(COUNT(DISTINCT CASE WHEN ja.status = 'accepted' THEN u.id END)::numeric / 
                      COUNT(DISTINCT u.id)::numeric * 100, 2) as employment_rate
            FROM users u
            JOIN job_applications ja ON u.id = ja.applicant_id
            WHERE u.user_type = 'job_seeker'
            ${dateFilter.replace('ja.application_date', 'ja.application_date')}
        `

    const learnerSuccessResult = await db.query({ text: learnerSuccessQuery, values: params })

    // 熱門雇主排行
    const topEmployersQuery = `
            SELECT 
                u.id,
                u.first_name || ' ' || u.last_name as employer_name,
                COUNT(DISTINCT j.id) as job_count,
                COUNT(ja.id) as application_count,
                COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END) as hired_count
            FROM users u
            JOIN jobs j ON u.id = j.employer_id
            LEFT JOIN job_applications ja ON j.id = ja.job_id
            WHERE u.user_type = 'employer'
            ${dateFilter.replace('ja.application_date', 'ja.application_date')}
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY hired_count DESC
            LIMIT 10
        `

    const topEmployersResult = await db.query({ text: topEmployersQuery, values: params })

    return {
      success: true,
      data: {
        overall: overallStatsResult.rows[0],
        byJobType: jobTypeStatsResult.rows,
        monthlyTrend: monthlyTrendResult.rows,
        learnerSuccess: learnerSuccessResult.rows[0],
        topEmployers: topEmployersResult.rows,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    }
  } catch (error) {
    console.error('Error fetching job matching stats:', error)
    throw error
  }
}

// 課程滿意度統計
async function getCourseSatisfactionStats(req: ApiRequest): Promise<ApiResponse> {
  const { startDate, endDate, courseId } = req.query ?? {}

  try {
    let dateFilter = ''
    const params: any[] = []

    if (startDate && endDate) {
      dateFilter = 'AND e.created_at BETWEEN $1 AND $2'
      params.push(startDate, endDate)
    }

    let courseFilter = ''
    if (courseId) {
      courseFilter =
        params.length > 0 ? `AND e.course_id = $${params.length + 1}` : 'AND e.course_id = $1'
      params.push(courseId)
    }

    // 總體滿意度統計
    const overallStatsQuery = `
            SELECT 
                COUNT(*) as total_evaluations,
                ROUND(AVG(e.reaction_score), 2) as avg_reaction_score,
                ROUND(AVG(e.learning_score), 2) as avg_learning_score,
                ROUND(AVG(e.behavior_score), 2) as avg_behavior_score,
                ROUND(AVG(e.result_score), 2) as avg_result_score,
                ROUND(AVG((e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0), 2) as avg_overall_score,
                COUNT(CASE WHEN (e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0 >= 80 THEN 1 END) as satisfactory_count,
                ROUND(COUNT(CASE WHEN (e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0 >= 80 THEN 1 END)::numeric / 
                      COUNT(*)::numeric * 100, 2) as satisfaction_rate
            FROM evaluations e
            WHERE 1=1 ${dateFilter} ${courseFilter}
        `

    const overallStatsResult = await db.query({ text: overallStatsQuery, values: params })

    // 按課程統計滿意度
    const courseStatsQuery = `
            SELECT 
                c.id,
                c.title,
                c.course_type,
                COUNT(e.id) as evaluation_count,
                ROUND(AVG((e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0), 2) as avg_score,
                ROUND(AVG(e.reaction_score), 2) as avg_reaction,
                ROUND(AVG(e.learning_score), 2) as avg_learning,
                ROUND(AVG(e.behavior_score), 2) as avg_behavior,
                ROUND(AVG(e.result_score), 2) as avg_result
            FROM courses c
            LEFT JOIN evaluations e ON c.id = e.course_id ${dateFilter.replace('e.created_at', 'e.created_at')}
            WHERE c.is_active = true ${courseFilter.replace('e.course_id', 'c.id')}
            GROUP BY c.id, c.title, c.course_type
            HAVING COUNT(e.id) > 0
            ORDER BY avg_score DESC
        `

    const courseStatsResult = await db.query({
      text: courseStatsQuery,
      values: courseFilter ? params : params.length > 0 ? params.slice(0, 2) : []
    })

    // 按講師統計滿意度
    const instructorStatsQuery = `
            SELECT 
                ia.id,
                CONCAT(u.first_name, ' ', u.last_name) as name,
                COUNT(DISTINCT e.course_id) as courses_taught,
                COUNT(e.id) as evaluation_count,
                ROUND(AVG((e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0), 2) as avg_score,
                COUNT(CASE WHEN (e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0 >= 80 THEN 1 END) as satisfactory_count
            FROM instructor_applications ia
            JOIN users u ON u.id = ia.user_id
            JOIN courses c ON ia.user_id = c.instructor_user_id
            LEFT JOIN evaluations e ON c.id = e.course_id ${dateFilter.replace('e.created_at', 'e.created_at')}
            WHERE ia.status = 'approved'
            GROUP BY ia.id, u.first_name, u.last_name
            HAVING COUNT(e.id) > 0
            ORDER BY avg_score DESC
        `

    const instructorStatsResult = await db.query({
      text: instructorStatsQuery,
      values: params.length > 2 ? params.slice(0, 2) : params
    })

    // 每月滿意度趨勢
    const monthlyTrendQuery = `
            SELECT 
                TO_CHAR(e.created_at, 'YYYY-MM') as month,
                COUNT(*) as evaluation_count,
                ROUND(AVG((e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0), 2) as avg_score,
                ROUND(AVG(e.reaction_score), 2) as avg_reaction,
                ROUND(AVG(e.learning_score), 2) as avg_learning,
                ROUND(AVG(e.behavior_score), 2) as avg_behavior,
                ROUND(AVG(e.result_score), 2) as avg_result
            FROM evaluations e
            WHERE 1=1 ${dateFilter} ${courseFilter}
            GROUP BY TO_CHAR(e.created_at, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT 12
        `

    const monthlyTrendResult = await db.query({ text: monthlyTrendQuery, values: params })

    return {
      success: true,
      data: {
        overall: overallStatsResult.rows[0],
        byCourse: courseStatsResult.rows,
        byInstructor: instructorStatsResult.rows,
        monthlyTrend: monthlyTrendResult.rows,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          courseId: courseId || null
        }
      }
    }
  } catch (error) {
    console.error('Error fetching course satisfaction stats:', error)
    throw error
  }
}

// 綜合統計儀表板數據
async function getDashboardStats(req: ApiRequest): Promise<ApiResponse> {
  try {
    // 獲取關鍵指標
    const keyMetricsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users WHERE user_type = 'job_seeker') as total_learners,
                (SELECT COUNT(*) FROM courses WHERE is_active = true) as active_courses,
                (SELECT COUNT(*) FROM jobs WHERE is_active = true) as active_jobs,
                (SELECT COUNT(*) FROM instructor_applications WHERE status = 'approved') as active_instructors,
                (SELECT COUNT(*) FROM course_enrollments WHERE status = 'in_progress') as ongoing_enrollments,
                (SELECT COUNT(*) FROM job_applications WHERE status = 'pending') as pending_applications
        `

    const keyMetricsResult = await db.query({ text: keyMetricsQuery })

    // 最近30天的活動統計
    const recentActivityQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
                (SELECT COUNT(*) FROM course_enrollments WHERE enrollment_date >= NOW() - INTERVAL '30 days') as new_enrollments_30d,
                (SELECT COUNT(*) FROM job_applications WHERE application_date >= NOW() - INTERVAL '30 days') as new_applications_30d,
                (SELECT COUNT(*) FROM course_enrollments WHERE status = 'completed' AND completion_date >= NOW() - INTERVAL '30 days') as completions_30d
        `

    const recentActivityResult = await db.query({ text: recentActivityQuery })

    // 成功率指標
    const successRatesQuery = `
            SELECT 
                ROUND(AVG(CASE WHEN ce.final_score IS NOT NULL THEN ce.final_score END), 2) as avg_course_score,
                ROUND(COUNT(CASE WHEN ce.final_score >= 80 THEN 1 END)::numeric / 
                      NULLIF(COUNT(CASE WHEN ce.final_score IS NOT NULL THEN 1 END), 0)::numeric * 100, 2) as passing_rate,
                ROUND(COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END)::numeric / 
                      NULLIF(COUNT(CASE WHEN ja.status IN ('accepted', 'rejected') THEN 1 END), 0)::numeric * 100, 2) as job_success_rate,
                ROUND(AVG((e.reaction_score + e.learning_score + e.behavior_score + e.result_score) / 4.0), 2) as avg_satisfaction_score
            FROM course_enrollments ce
            FULL OUTER JOIN job_applications ja ON 1=1
            FULL OUTER JOIN evaluations e ON 1=1
        `

    const successRatesResult = await db.query({ text: successRatesQuery })

    return {
      success: true,
      data: {
        keyMetrics: keyMetricsResult.rows[0],
        recentActivity: recentActivityResult.rows[0],
        successRates: successRatesResult.rows[0],
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

// 匯出報告
async function exportReport(req: ApiRequest): Promise<ApiResponse> {
  const { reportType, format, startDate, endDate } = req.query ?? {}

  if (!reportType) {
    throw new ValidationError('報告類型為必填項')
  }

  if (
    !['learning', 'job-matching', 'satisfaction', 'comprehensive'].includes(reportType as string)
  ) {
    throw new ValidationError('無效的報告類型')
  }

  const exportFormat = format || 'json'

  if (!['json', 'csv'].includes(exportFormat as string)) {
    throw new ValidationError('無效的匯出格式')
  }

  try {
    let reportData: any

    // 根據報告類型獲取數據
    switch (reportType) {
      case 'learning':
        reportData = await getLearningStats({
          ...req,
          query: { startDate: startDate as string, endDate: endDate as string }
        })
        break
      case 'job-matching':
        reportData = await getJobMatchingStats({
          ...req,
          query: { startDate: startDate as string, endDate: endDate as string }
        })
        break
      case 'satisfaction':
        reportData = await getCourseSatisfactionStats({
          ...req,
          query: { startDate: startDate as string, endDate: endDate as string }
        })
        break
      case 'comprehensive':
        reportData = await getDashboardStats(req)
        break
    }

    // 如果是CSV格式，需要轉換數據
    if (exportFormat === 'csv') {
      // 這裡簡化處理，實際應該將數據轉換為CSV格式
      return {
        success: true,
        data: {
          format: 'csv',
          content: convertToCSV(reportData.data),
          filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
        }
      }
    }

    return {
      success: true,
      data: {
        format: 'json',
        content: reportData.data,
        filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`,
        generatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error exporting report:', error)
    throw error
  }
}

// 輔助函數：將數據轉換為CSV格式
function convertToCSV(data: any): string {
  // 簡化的CSV轉換實現
  // 實際應用中應該使用專門的CSV庫
  return JSON.stringify(data)
}
