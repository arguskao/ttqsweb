-- 查詢性能優化腳本
-- 藥助Next學院 - 數據庫查詢優化

-- ==============================================
-- 1. 課程查詢優化
-- ==============================================

-- 優化課程列表查詢
CREATE OR REPLACE FUNCTION get_courses_optimized(
    p_course_type VARCHAR DEFAULT NULL,
    p_search_term VARCHAR DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    description TEXT,
    course_type VARCHAR,
    duration_hours INTEGER,
    price DECIMAL,
    instructor_id INTEGER,
    instructor_name VARCHAR,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    total_count BIGINT
) AS $$
DECLARE
    offset_value INTEGER;
BEGIN
    offset_value := (p_page - 1) * p_limit;
    
    RETURN QUERY
    WITH course_data AS (
        SELECT 
            c.id,
            c.title,
            c.description,
            c.course_type,
            c.duration_hours,
            c.price,
            c.instructor_id,
            CONCAT(i.first_name, ' ', i.last_name) as instructor_name,
            c.is_active,
            c.created_at,
            COUNT(*) OVER() as total_count
        FROM courses c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        WHERE 
            c.is_active = true
            AND (p_course_type IS NULL OR c.course_type = p_course_type)
            AND (p_search_term IS NULL OR 
                 to_tsvector('chinese', c.title || ' ' || COALESCE(c.description, '')) 
                 @@ plainto_tsquery('chinese', p_search_term))
        ORDER BY c.created_at DESC
        LIMIT p_limit OFFSET offset_value
    )
    SELECT * FROM course_data;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 2. 用戶學習進度查詢優化
-- ==============================================

-- 優化用戶學習進度查詢
CREATE OR REPLACE FUNCTION get_user_learning_progress(
    p_user_id INTEGER
)
RETURNS TABLE (
    course_id INTEGER,
    course_title VARCHAR,
    progress_percentage DECIMAL,
    status VARCHAR,
    enrolled_at TIMESTAMP,
    last_accessed TIMESTAMP,
    completion_date TIMESTAMP,
    final_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.course_id,
        c.title as course_title,
        ce.progress_percentage,
        ce.status,
        ce.enrolled_at,
        lp.updated_at as last_accessed,
        ce.completion_date,
        ce.final_score
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    LEFT JOIN learning_progress lp ON ce.user_id = lp.user_id AND ce.course_id = lp.course_id
    WHERE ce.user_id = p_user_id
    ORDER BY ce.enrolled_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 3. 講師統計查詢優化
-- ==============================================

-- 優化講師統計查詢
CREATE OR REPLACE FUNCTION get_instructor_stats(
    p_instructor_id INTEGER
)
RETURNS TABLE (
    total_courses INTEGER,
    active_courses INTEGER,
    total_students INTEGER,
    avg_rating DECIMAL,
    total_ratings INTEGER,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH instructor_stats AS (
        SELECT 
            COUNT(DISTINCT c.id) as total_courses,
            COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as active_courses,
            COUNT(DISTINCT ce.user_id) as total_students,
            AVG(ir.rating) as avg_rating,
            COUNT(ir.id) as total_ratings,
            AVG(CASE WHEN ce.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100 as completion_rate
        FROM instructors i
        LEFT JOIN courses c ON i.id = c.instructor_id
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN instructor_ratings ir ON i.id = ir.instructor_id
        WHERE i.id = p_instructor_id
        GROUP BY i.id
    )
    SELECT * FROM instructor_stats;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. 工作搜索查詢優化
-- ==============================================

-- 優化工作搜索查詢
CREATE OR REPLACE FUNCTION search_jobs_optimized(
    p_search_term VARCHAR DEFAULT NULL,
    p_job_type VARCHAR DEFAULT NULL,
    p_salary_min DECIMAL DEFAULT NULL,
    p_salary_max DECIMAL DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    description TEXT,
    job_type VARCHAR,
    salary_min DECIMAL,
    salary_max DECIMAL,
    employer_id INTEGER,
    employer_name VARCHAR,
    location VARCHAR,
    is_active BOOLEAN,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    total_count BIGINT
) AS $$
DECLARE
    offset_value INTEGER;
BEGIN
    offset_value := (p_page - 1) * p_limit;
    
    RETURN QUERY
    WITH job_data AS (
        SELECT 
            j.id,
            j.title,
            j.description,
            j.job_type,
            j.salary_min,
            j.salary_max,
            j.employer_id,
            CONCAT(u.first_name, ' ', u.last_name) as employer_name,
            j.location,
            j.is_active,
            j.expires_at,
            j.created_at,
            COUNT(*) OVER() as total_count
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE 
            j.is_active = true
            AND (j.expires_at IS NULL OR j.expires_at > NOW())
            AND (p_job_type IS NULL OR j.job_type = p_job_type)
            AND (p_salary_min IS NULL OR j.salary_max >= p_salary_min)
            AND (p_salary_max IS NULL OR j.salary_min <= p_salary_max)
            AND (p_search_term IS NULL OR 
                 to_tsvector('chinese', j.title || ' ' || COALESCE(j.description, '')) 
                 @@ plainto_tsquery('chinese', p_search_term))
        ORDER BY j.created_at DESC
        LIMIT p_limit OFFSET offset_value
    )
    SELECT * FROM job_data;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. 用戶儀表板查詢優化
-- ==============================================

-- 優化用戶儀表板查詢
CREATE OR REPLACE FUNCTION get_user_dashboard_data(
    p_user_id INTEGER
)
RETURNS TABLE (
    enrolled_courses INTEGER,
    completed_courses INTEGER,
    in_progress_courses INTEGER,
    total_learning_hours DECIMAL,
    avg_course_score DECIMAL,
    applied_jobs INTEGER,
    pending_applications INTEGER,
    recent_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            COUNT(DISTINCT ce.course_id) as enrolled_courses,
            COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.course_id END) as completed_courses,
            COUNT(DISTINCT CASE WHEN ce.status = 'in_progress' THEN ce.course_id END) as in_progress_courses,
            COALESCE(SUM(c.duration_hours * ce.progress_percentage / 100), 0) as total_learning_hours,
            AVG(ce.final_score) as avg_course_score,
            COUNT(DISTINCT ja.job_id) as applied_jobs,
            COUNT(DISTINCT CASE WHEN ja.status = 'pending' THEN ja.job_id END) as pending_applications
        FROM users u
        LEFT JOIN course_enrollments ce ON u.id = ce.user_id
        LEFT JOIN courses c ON ce.course_id = c.id
        LEFT JOIN job_applications ja ON u.id = ja.user_id
        WHERE u.id = p_user_id
    ),
    recent_activity AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'type', activity_type,
                'description', description,
                'created_at', created_at
            ) ORDER BY created_at DESC
        ) as activities
        FROM (
            SELECT 'course_enrollment' as activity_type, 
                   '註冊課程: ' || c.title as description, 
                   ce.enrolled_at as created_at
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = p_user_id
            
            UNION ALL
            
            SELECT 'job_application' as activity_type,
                   '申請工作: ' || j.title as description,
                   ja.created_at
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            WHERE ja.user_id = p_user_id
            
            UNION ALL
            
            SELECT 'course_completion' as activity_type,
                   '完成課程: ' || c.title as description,
                   ce.completion_date as created_at
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = p_user_id AND ce.status = 'completed'
        ) activities
        LIMIT 10
    )
    SELECT 
        us.enrolled_courses,
        us.completed_courses,
        us.in_progress_courses,
        us.total_learning_hours,
        us.avg_course_score,
        us.applied_jobs,
        us.pending_applications,
        COALESCE(ra.activities, '[]'::jsonb) as recent_activity
    FROM user_stats us
    CROSS JOIN recent_activity ra;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. 管理員統計查詢優化
-- ==============================================

-- 優化管理員統計查詢
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    total_users INTEGER,
    active_users INTEGER,
    total_courses INTEGER,
    active_courses INTEGER,
    total_jobs INTEGER,
    active_jobs INTEGER,
    total_instructors INTEGER,
    approved_instructors INTEGER,
    monthly_registrations JSONB,
    course_completion_rates JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH admin_stats AS (
        SELECT 
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT CASE WHEN u.is_active THEN u.id END) as active_users,
            COUNT(DISTINCT c.id) as total_courses,
            COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as active_courses,
            COUNT(DISTINCT j.id) as total_jobs,
            COUNT(DISTINCT CASE WHEN j.is_active THEN j.id END) as active_jobs,
            COUNT(DISTINCT i.id) as total_instructors,
            COUNT(DISTINCT CASE WHEN i.application_status = 'approved' THEN i.id END) as approved_instructors
        FROM users u
        CROSS JOIN courses c
        CROSS JOIN jobs j
        CROSS JOIN instructors i
    ),
    monthly_registrations AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'month', month_year,
                'count', registration_count
            ) ORDER BY month_year
        ) as monthly_data
        FROM (
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month_year,
                COUNT(*) as registration_count
            FROM users
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month_year
        ) monthly
    ),
    course_completion_rates AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'course_type', course_type,
                'completion_rate', completion_rate
            )
        ) as completion_data
        FROM (
            SELECT 
                c.course_type,
                AVG(CASE WHEN ce.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100 as completion_rate
            FROM courses c
            LEFT JOIN course_enrollments ce ON c.id = ce.course_id
            GROUP BY c.course_type
        ) rates
    )
    SELECT 
        ads.total_users,
        ads.active_users,
        ads.total_courses,
        ads.active_courses,
        ads.total_jobs,
        ads.active_jobs,
        ads.total_instructors,
        ads.approved_instructors,
        COALESCE(mr.monthly_data, '[]'::jsonb) as monthly_registrations,
        COALESCE(ccr.completion_data, '[]'::jsonb) as course_completion_rates
    FROM admin_stats ads
    CROSS JOIN monthly_registrations mr
    CROSS JOIN course_completion_rates ccr;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 7. 性能監控查詢
-- ==============================================

-- 查詢執行計劃分析
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE (
    query_text TEXT,
    execution_time INTERVAL,
    rows_returned BIGINT,
    cost_estimate FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        mean_exec_time,
        calls,
        total_cost
    FROM pg_stat_statements
    WHERE query NOT LIKE '%pg_stat_statements%'
    ORDER BY mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. 數據庫維護查詢
-- ==============================================

-- 更新表統計信息
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS VOID AS $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ANALYZE ' || table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 重建索引
CREATE OR REPLACE FUNCTION rebuild_indexes()
RETURNS VOID AS $$
DECLARE
    index_name TEXT;
BEGIN
    FOR index_name IN 
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    LOOP
        EXECUTE 'REINDEX INDEX ' || index_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 9. 查詢緩存優化
-- ==============================================

-- 創建物化視圖用於緩存常用查詢
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_course_stats AS
SELECT 
    c.id as course_id,
    c.title,
    c.course_type,
    c.duration_hours,
    c.price,
    c.instructor_id,
    CONCAT(i.first_name, ' ', i.last_name) as instructor_name,
    COUNT(ce.id) as enrollment_count,
    AVG(ce.progress_percentage) as avg_progress,
    AVG(ce.final_score) as avg_score,
    COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completion_count
FROM courses c
LEFT JOIN instructors i ON c.instructor_id = i.id
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
WHERE c.is_active = true
GROUP BY c.id, c.title, c.course_type, c.duration_hours, c.price, c.instructor_id, i.first_name, i.last_name;

-- 創建物化視圖的索引
CREATE INDEX IF NOT EXISTS idx_mv_course_stats_type ON mv_course_stats(course_type);
CREATE INDEX IF NOT EXISTS idx_mv_course_stats_instructor ON mv_course_stats(instructor_id);
CREATE INDEX IF NOT EXISTS idx_mv_course_stats_enrollment ON mv_course_stats(enrollment_count DESC);

-- 刷新物化視圖的函數
CREATE OR REPLACE FUNCTION refresh_course_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_course_stats;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. 性能優化建議查詢
-- ==============================================

-- 識別慢查詢
CREATE OR REPLACE FUNCTION identify_slow_queries()
RETURNS TABLE (
    query_text TEXT,
    avg_execution_time INTERVAL,
    total_calls BIGINT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        mean_exec_time,
        calls,
        CASE 
            WHEN mean_exec_time > INTERVAL '1 second' THEN '考慮添加索引或優化查詢'
            WHEN calls > 1000 AND mean_exec_time > INTERVAL '100ms' THEN '考慮查詢緩存'
            WHEN calls < 10 AND mean_exec_time > INTERVAL '500ms' THEN '檢查查詢邏輯'
            ELSE '查詢性能良好'
        END as recommendation
    FROM pg_stat_statements
    WHERE query NOT LIKE '%pg_stat_statements%'
    ORDER BY mean_exec_time DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
