-- 數據庫性能監控腳本
-- 藥助Next學院 - 性能監控和優化

-- ==============================================
-- 1. 性能監控視圖
-- ==============================================

-- 創建數據庫性能監控視圖
CREATE OR REPLACE VIEW v_database_performance AS
SELECT 
    'Database Size' as metric_name,
    pg_size_pretty(pg_database_size(current_database())) as metric_value,
    'bytes' as unit
UNION ALL
SELECT 
    'Total Tables',
    COUNT(*)::text,
    'count'
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Indexes',
    COUNT(*)::text,
    'count'
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Active Connections',
    (SELECT setting FROM pg_settings WHERE name = 'max_connections')::text,
    'count'
UNION ALL
SELECT 
    'Cache Hit Ratio',
    ROUND(
        (blks_hit::float / (blks_hit + blks_read)) * 100, 2
    )::text || '%',
    'percentage'
FROM pg_stat_database 
WHERE datname = current_database();

-- ==============================================
-- 2. 表大小監控視圖
-- ==============================================

-- 創建表大小監控視圖
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    pg_total_relation_size(schemaname||'.'||tablename) as total_bytes,
    pg_relation_size(schemaname||'.'||tablename) as table_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ==============================================
-- 3. 索引使用情況監控視圖
-- ==============================================

-- 創建索引使用情況監控視圖
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'Unused'
        WHEN idx_scan < 100 THEN 'Low Usage'
        WHEN idx_scan < 1000 THEN 'Medium Usage'
        ELSE 'High Usage'
    END as usage_level,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ==============================================
-- 4. 慢查詢監控視圖
-- ==============================================

-- 創建慢查詢監控視圖
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND mean_exec_time > INTERVAL '100ms'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ==============================================
-- 5. 連接監控視圖
-- ==============================================

-- 創建連接監控視圖
CREATE OR REPLACE VIEW v_connection_stats AS
SELECT 
    state,
    COUNT(*) as connection_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

-- ==============================================
-- 6. 鎖監控視圖
-- ==============================================

-- 創建鎖監控視圖
CREATE OR REPLACE VIEW v_lock_stats AS
SELECT 
    mode,
    COUNT(*) as lock_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM pg_locks 
WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
GROUP BY mode
ORDER BY lock_count DESC;

-- ==============================================
-- 7. 性能監控函數
-- ==============================================

-- 獲取數據庫性能指標
CREATE OR REPLACE FUNCTION get_database_metrics()
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT,
    unit TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT 
            'Database Size' as metric_name,
            pg_size_pretty(pg_database_size(current_database())) as metric_value,
            'bytes' as unit,
            CASE 
                WHEN pg_database_size(current_database()) > 1073741824 THEN 'Warning' -- 1GB
                ELSE 'OK'
            END as status
        UNION ALL
        SELECT 
            'Cache Hit Ratio',
            ROUND(
                (blks_hit::float / (blks_hit + blks_read)) * 100, 2
            )::text || '%',
            'percentage',
            CASE 
                WHEN (blks_hit::float / (blks_hit + blks_read)) * 100 < 90 THEN 'Warning'
                ELSE 'OK'
            END
        FROM pg_stat_database 
        WHERE datname = current_database()
        UNION ALL
        SELECT 
            'Active Connections',
            (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database())::text,
            'count',
            CASE 
                WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) > 80 THEN 'Warning'
                ELSE 'OK'
            END
        UNION ALL
        SELECT 
            'Long Running Queries',
            (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes')::text,
            'count',
            CASE 
                WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes') > 0 THEN 'Warning'
                ELSE 'OK'
            END
    )
    SELECT * FROM metrics;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. 索引建議函數
-- ==============================================

-- 獲取索引建議
CREATE OR REPLACE FUNCTION get_index_recommendations()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    recommendation TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH unused_indexes AS (
        SELECT 
            schemaname,
            tablename,
            indexname,
            'Consider dropping unused index' as recommendation,
            'Low' as priority
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public' 
            AND idx_scan = 0
            AND indexname NOT LIKE '%_pkey'
    ),
    missing_indexes AS (
        SELECT 
            'users' as table_name,
            'user_type, is_active' as column_name,
            'Add composite index for user filtering' as recommendation,
            'High' as priority
        UNION ALL
        SELECT 
            'courses',
            'course_type, is_active',
            'Add composite index for course filtering',
            'High'
        UNION ALL
        SELECT 
            'jobs',
            'job_type, is_active, expires_at',
            'Add composite index for job filtering',
            'High'
        UNION ALL
        SELECT 
            'course_enrollments',
            'user_id, status',
            'Add composite index for user enrollments',
            'High'
    )
    SELECT * FROM unused_indexes
    UNION ALL
    SELECT * FROM missing_indexes;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 9. 性能報告函數
-- ==============================================

-- 生成性能報告
CREATE OR REPLACE FUNCTION generate_performance_report()
RETURNS TABLE (
    report_section TEXT,
    report_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH db_metrics AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'metric', metric_name,
                'value', metric_value,
                'unit', unit,
                'status', status
            )
        ) as data
        FROM get_database_metrics()
    ),
    table_sizes AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'table', tablename,
                'total_size', total_size,
                'table_size', table_size,
                'index_size', index_size
            )
        ) as data
        FROM v_table_sizes
        LIMIT 10
    ),
    index_usage AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'table', tablename,
                'index', indexname,
                'scans', index_scans,
                'usage_level', usage_level,
                'size', index_size
            )
        ) as data
        FROM v_index_usage
        WHERE usage_level IN ('Unused', 'Low Usage')
    ),
    slow_queries AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'query', LEFT(query, 100) || '...',
                'avg_time', mean_exec_time,
                'calls', calls,
                'hit_percent', hit_percent
            )
        ) as data
        FROM v_slow_queries
        LIMIT 5
    ),
    recommendations AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'table', table_name,
                'column', column_name,
                'recommendation', recommendation,
                'priority', priority
            )
        ) as data
        FROM get_index_recommendations()
    )
    SELECT 'Database Metrics' as report_section, data FROM db_metrics
    UNION ALL
    SELECT 'Table Sizes', data FROM table_sizes
    UNION ALL
    SELECT 'Index Usage Issues', data FROM index_usage
    UNION ALL
    SELECT 'Slow Queries', data FROM slow_queries
    UNION ALL
    SELECT 'Recommendations', data FROM recommendations;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. 自動化維護函數
-- ==============================================

-- 自動化數據庫維護
CREATE OR REPLACE FUNCTION perform_database_maintenance()
RETURNS TABLE (
    maintenance_task TEXT,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    table_name TEXT;
    index_name TEXT;
BEGIN
    -- 更新表統計信息
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ANALYZE ' || table_name;
            RETURN QUERY SELECT 'Analyze Table: ' || table_name, 'Success', 'Statistics updated';
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 'Analyze Table: ' || table_name, 'Failed', SQLERRM;
        END;
    END LOOP;
    
    -- 刷新物化視圖
    BEGIN
        REFRESH MATERIALIZED VIEW mv_course_stats;
        RETURN QUERY SELECT 'Refresh Materialized View', 'Success', 'mv_course_stats refreshed';
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Refresh Materialized View', 'Failed', SQLERRM;
    END;
    
    -- 清理過期的統計信息
    BEGIN
        PERFORM pg_stat_statements_reset();
        RETURN QUERY SELECT 'Reset Statistics', 'Success', 'pg_stat_statements reset';
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Reset Statistics', 'Failed', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 11. 性能警報函數
-- ==============================================

-- 檢查性能警報
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE (
    alert_type TEXT,
    alert_level TEXT,
    alert_message TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH alerts AS (
        -- 檢查緩存命中率
        SELECT 
            'Cache Hit Ratio' as alert_type,
            CASE 
                WHEN (blks_hit::float / (blks_hit + blks_read)) * 100 < 80 THEN 'Critical'
                WHEN (blks_hit::float / (blks_hit + blks_read)) * 100 < 90 THEN 'Warning'
                ELSE 'OK'
            END as alert_level,
            'Cache hit ratio is ' || ROUND((blks_hit::float / (blks_hit + blks_read)) * 100, 2) || '%' as alert_message,
            CASE 
                WHEN (blks_hit::float / (blks_hit + blks_read)) * 100 < 90 THEN 'Consider increasing shared_buffers or optimizing queries'
                ELSE 'No action needed'
            END as recommended_action
        FROM pg_stat_database 
        WHERE datname = current_database()
        
        UNION ALL
        
        -- 檢查長時間運行的查詢
        SELECT 
            'Long Running Queries' as alert_type,
            CASE 
                WHEN COUNT(*) > 5 THEN 'Critical'
                WHEN COUNT(*) > 0 THEN 'Warning'
                ELSE 'OK'
            END as alert_level,
            COUNT(*)::text || ' queries running longer than 5 minutes' as alert_message,
            CASE 
                WHEN COUNT(*) > 0 THEN 'Check and optimize slow queries'
                ELSE 'No action needed'
            END as recommended_action
        FROM pg_stat_activity 
        WHERE state = 'active' 
            AND query_start < NOW() - INTERVAL '5 minutes'
        
        UNION ALL
        
        -- 檢查連接數
        SELECT 
            'Connection Count' as alert_type,
            CASE 
                WHEN COUNT(*) > 80 THEN 'Critical'
                WHEN COUNT(*) > 60 THEN 'Warning'
                ELSE 'OK'
            END as alert_level,
            COUNT(*)::text || ' active connections' as alert_message,
            CASE 
                WHEN COUNT(*) > 60 THEN 'Consider connection pooling or increasing max_connections'
                ELSE 'No action needed'
            END as recommended_action
        FROM pg_stat_activity 
        WHERE datname = current_database()
        
        UNION ALL
        
        -- 檢查未使用的索引
        SELECT 
            'Unused Indexes' as alert_type,
            CASE 
                WHEN COUNT(*) > 10 THEN 'Warning'
                ELSE 'OK'
            END as alert_level,
            COUNT(*)::text || ' unused indexes detected' as alert_message,
            CASE 
                WHEN COUNT(*) > 5 THEN 'Consider dropping unused indexes to save space'
                ELSE 'No action needed'
            END as recommended_action
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public' 
            AND idx_scan = 0
            AND indexname NOT LIKE '%_pkey'
    )
    SELECT * FROM alerts WHERE alert_level != 'OK';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 12. 性能監控設置
-- ==============================================

-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 設置性能監控參數
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- 重新載入配置
SELECT pg_reload_conf();
