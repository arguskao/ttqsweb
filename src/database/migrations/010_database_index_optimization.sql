-- 數據庫索引優化腳本
-- 藥助Next學院 - 性能優化

-- ==============================================
-- 1. 用戶表索引優化
-- ==============================================

-- 用戶類型 + 活躍狀態複合索引
CREATE INDEX IF NOT EXISTS idx_users_type_active 
ON users(user_type, is_active);

-- 創建時間降序索引
CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON users(created_at DESC);

-- 電子郵件唯一索引（如果不存在）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
ON users(email);

-- 用戶類型索引
CREATE INDEX IF NOT EXISTS idx_users_user_type 
ON users(user_type);

-- 活躍狀態索引
CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON users(is_active);

-- ==============================================
-- 2. 課程表索引優化
-- ==============================================

-- 課程類型 + 活躍狀態複合索引
CREATE INDEX IF NOT EXISTS idx_courses_type_active 
ON courses(course_type, is_active);

-- 講師ID + 活躍狀態複合索引
CREATE INDEX IF NOT EXISTS idx_courses_instructor_active 
ON courses(instructor_id, is_active);

-- 創建時間降序索引
CREATE INDEX IF NOT EXISTS idx_courses_created_at 
ON courses(created_at DESC);

-- 價格範圍索引
CREATE INDEX IF NOT EXISTS idx_courses_price 
ON courses(price);

-- 課程時長索引
CREATE INDEX IF NOT EXISTS idx_courses_duration 
ON courses(duration_hours);

-- ==============================================
-- 3. 課程註冊表索引優化
-- ==============================================

-- 用戶ID + 狀態複合索引
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_status 
ON course_enrollments(user_id, status);

-- 課程ID + 狀態複合索引
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_status 
ON course_enrollments(course_id, status);

-- 進度查詢索引（僅包含進行中和已完成的記錄）
CREATE INDEX IF NOT EXISTS idx_course_enrollments_progress 
ON course_enrollments(user_id, progress_percentage) 
WHERE status IN ('in_progress', 'completed');

-- 完成時間索引
CREATE INDEX IF NOT EXISTS idx_course_enrollments_completion_date 
ON course_enrollments(completion_date DESC) 
WHERE completion_date IS NOT NULL;

-- 註冊時間索引
CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrolled_at 
ON course_enrollments(enrolled_at DESC);

-- 最終分數索引
CREATE INDEX IF NOT EXISTS idx_course_enrollments_final_score 
ON course_enrollments(final_score DESC) 
WHERE final_score IS NOT NULL;

-- ==============================================
-- 4. 工作表索引優化
-- ==============================================

-- 雇主ID + 活躍狀態 + 創建時間複合索引
CREATE INDEX IF NOT EXISTS idx_jobs_employer_active_created 
ON jobs(employer_id, is_active, created_at DESC);

-- 工作類型 + 活躍狀態複合索引
CREATE INDEX IF NOT EXISTS idx_jobs_type_active 
ON jobs(job_type, is_active);

-- 薪資範圍索引
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range 
ON jobs(salary_min, salary_max) 
WHERE salary_min IS NOT NULL AND salary_max IS NOT NULL;

-- 過期時間索引
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at 
ON jobs(expires_at) 
WHERE expires_at IS NOT NULL;

-- 創建時間降序索引
CREATE INDEX IF NOT EXISTS idx_jobs_created_at 
ON jobs(created_at DESC);

-- 活躍狀態索引
CREATE INDEX IF NOT EXISTS idx_jobs_is_active 
ON jobs(is_active);

-- ==============================================
-- 5. 工作申請表索引優化
-- ==============================================

-- 用戶ID + 申請時間降序複合索引
CREATE INDEX IF NOT EXISTS idx_job_applications_user_date 
ON job_applications(user_id, created_at DESC);

-- 工作ID + 狀態複合索引
CREATE INDEX IF NOT EXISTS idx_job_applications_job_status 
ON job_applications(job_id, status);

-- 狀態索引
CREATE INDEX IF NOT EXISTS idx_job_applications_status 
ON job_applications(status);

-- 申請時間索引
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at 
ON job_applications(created_at DESC);

-- ==============================================
-- 6. 講師表索引優化
-- ==============================================

-- 申請狀態 + 活躍狀態複合索引
CREATE INDEX IF NOT EXISTS idx_instructors_status_active 
ON instructors(application_status, is_active);

-- 專業領域索引
CREATE INDEX IF NOT EXISTS idx_instructors_specialization 
ON instructors(specialization) 
WHERE specialization IS NOT NULL;

-- 工作年資索引
CREATE INDEX IF NOT EXISTS idx_instructors_experience 
ON instructors(years_of_experience) 
WHERE years_of_experience IS NOT NULL;

-- 平均評分索引
CREATE INDEX IF NOT EXISTS idx_instructors_rating 
ON instructors(average_rating DESC) 
WHERE average_rating IS NOT NULL;

-- 創建時間索引
CREATE INDEX IF NOT EXISTS idx_instructors_created_at 
ON instructors(created_at DESC);

-- ==============================================
-- 7. 講師評價表索引優化
-- ==============================================

-- 講師ID + 評分複合索引
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_instructor_score 
ON instructor_ratings(instructor_id, rating);

-- 課程ID + 評分複合索引
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_course_score 
ON instructor_ratings(course_id, rating);

-- 學生ID + 創建時間複合索引
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_student_date 
ON instructor_ratings(student_id, created_at DESC);

-- 評分索引
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_rating 
ON instructor_ratings(rating);

-- 創建時間索引
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_created_at 
ON instructor_ratings(created_at DESC);

-- ==============================================
-- 8. 文檔表索引優化
-- ==============================================

-- 文檔類型 + 活躍狀態複合索引
CREATE INDEX IF NOT EXISTS idx_documents_type_active 
ON documents(document_type, is_active);

-- 上傳者ID + 創建時間複合索引
CREATE INDEX IF NOT EXISTS idx_documents_uploader_date 
ON documents(uploaded_by, created_at DESC);

-- 文件大小索引
CREATE INDEX IF NOT EXISTS idx_documents_file_size 
ON documents(file_size);

-- 創建時間索引
CREATE INDEX IF NOT EXISTS idx_documents_created_at 
ON documents(created_at DESC);

-- ==============================================
-- 9. 學習進度表索引優化
-- ==============================================

-- 用戶ID + 課程ID複合索引
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_course 
ON learning_progress(user_id, course_id);

-- 課程ID + 進度百分比複合索引
CREATE INDEX IF NOT EXISTS idx_learning_progress_course_progress 
ON learning_progress(course_id, progress_percentage);

-- 更新時間索引
CREATE INDEX IF NOT EXISTS idx_learning_progress_updated_at 
ON learning_progress(updated_at DESC);

-- ==============================================
-- 10. 系統日誌表索引優化
-- ==============================================

-- 用戶ID + 時間範圍複合索引
CREATE INDEX IF NOT EXISTS idx_system_logs_user_time 
ON system_logs(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- 日誌級別 + 時間複合索引
CREATE INDEX IF NOT EXISTS idx_system_logs_level_time 
ON system_logs(log_level, created_at DESC);

-- 操作類型索引
CREATE INDEX IF NOT EXISTS idx_system_logs_action 
ON system_logs(action) 
WHERE action IS NOT NULL;

-- 創建時間索引
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at 
ON system_logs(created_at DESC);

-- ==============================================
-- 11. 全文搜索索引 (PostgreSQL)
-- ==============================================

-- 課程標題和描述全文搜索索引
CREATE INDEX IF NOT EXISTS idx_courses_search 
ON courses USING gin(to_tsvector('chinese', title || ' ' || COALESCE(description, '')));

-- 工作標題和描述全文搜索索引
CREATE INDEX IF NOT EXISTS idx_jobs_search 
ON jobs USING gin(to_tsvector('chinese', title || ' ' || COALESCE(description, '')));

-- 講師專業領域全文搜索索引
CREATE INDEX IF NOT EXISTS idx_instructors_search 
ON instructors USING gin(to_tsvector('chinese', COALESCE(specialization, '') || ' ' || COALESCE(bio, '')));

-- 文檔標題和描述全文搜索索引
CREATE INDEX IF NOT EXISTS idx_documents_search 
ON documents USING gin(to_tsvector('chinese', title || ' ' || COALESCE(description, '')));

-- ==============================================
-- 12. 部分索引優化
-- ==============================================

-- 僅活躍用戶的索引
CREATE INDEX IF NOT EXISTS idx_users_active_only 
ON users(email, user_type) 
WHERE is_active = true;

-- 僅活躍課程的索引
CREATE INDEX IF NOT EXISTS idx_courses_active_only 
ON courses(course_type, instructor_id, price) 
WHERE is_active = true;

-- 僅活躍工作的索引
CREATE INDEX IF NOT EXISTS idx_jobs_active_only 
ON jobs(job_type, employer_id, salary_min, salary_max) 
WHERE is_active = true AND expires_at > NOW();

-- 僅已批准講師的索引
CREATE INDEX IF NOT EXISTS idx_instructors_approved_only 
ON instructors(specialization, years_of_experience, average_rating) 
WHERE application_status = 'approved' AND is_active = true;

-- ==============================================
-- 13. 統計查詢優化索引
-- ==============================================

-- 用戶統計索引
CREATE INDEX IF NOT EXISTS idx_users_stats 
ON users(user_type, is_active, created_at);

-- 課程統計索引
CREATE INDEX IF NOT EXISTS idx_courses_stats 
ON courses(course_type, is_active, created_at);

-- 工作統計索引
CREATE INDEX IF NOT EXISTS idx_jobs_stats 
ON jobs(job_type, is_active, created_at);

-- 學習進度統計索引
CREATE INDEX IF NOT EXISTS idx_progress_stats 
ON course_enrollments(status, completion_date, final_score);

-- ==============================================
-- 14. 複合查詢優化索引
-- ==============================================

-- 用戶課程查詢優化
CREATE INDEX IF NOT EXISTS idx_user_course_query 
ON course_enrollments(user_id, status, enrolled_at DESC);

-- 講師課程查詢優化
CREATE INDEX IF NOT EXISTS idx_instructor_course_query 
ON courses(instructor_id, is_active, created_at DESC);

-- 雇主工作查詢優化
CREATE INDEX IF NOT EXISTS idx_employer_job_query 
ON jobs(employer_id, is_active, expires_at DESC);

-- 工作申請查詢優化
CREATE INDEX IF NOT EXISTS idx_job_application_query 
ON job_applications(job_id, status, created_at DESC);

-- ==============================================
-- 15. 性能監控索引
-- ==============================================

-- 慢查詢監控索引
CREATE INDEX IF NOT EXISTS idx_performance_monitoring 
ON system_logs(log_level, action, created_at DESC) 
WHERE log_level IN ('WARN', 'ERROR');

-- 用戶活動監控索引
CREATE INDEX IF NOT EXISTS idx_user_activity_monitoring 
ON system_logs(user_id, action, created_at DESC) 
WHERE user_id IS NOT NULL;

-- ==============================================
-- 索引使用情況分析查詢
-- ==============================================

-- 分析索引使用情況
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 分析表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 分析索引大小
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
