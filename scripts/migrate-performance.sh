#!/bin/bash

# 數據庫遷移執行腳本
# 藥助Next學院 - 性能優化遷移

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查環境變量
check_env() {
    log_info "檢查環境變量..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL 環境變量未設置"
        exit 1
    fi
    
    if [ -z "$DB_HOST" ]; then
        log_error "DB_HOST 環境變量未設置"
        exit 1
    fi
    
    if [ -z "$DB_PORT" ]; then
        log_error "DB_PORT 環境變量未設置"
        exit 1
    fi
    
    if [ -z "$DB_NAME" ]; then
        log_error "DB_NAME 環境變量未設置"
        exit 1
    fi
    
    if [ -z "$DB_USER" ]; then
        log_error "DB_USER 環境變量未設置"
        exit 1
    fi
    
    log_success "環境變量檢查完成"
}

# 檢查數據庫連接
check_db_connection() {
    log_info "檢查數據庫連接..."
    
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "無法連接到數據庫"
        exit 1
    fi
    
    log_success "數據庫連接正常"
}

# 備份數據庫
backup_database() {
    log_info "創建數據庫備份..."
    
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "$backup_file"; then
        log_success "數據庫備份完成: $backup_file"
    else
        log_error "數據庫備份失敗"
        exit 1
    fi
}

# 執行遷移
run_migrations() {
    log_info "開始執行數據庫遷移..."
    
    local migration_files=(
        "010_database_index_optimization.sql"
        "011_query_performance_optimization.sql"
        "012_performance_monitoring.sql"
    )
    
    for migration_file in "${migration_files[@]}"; do
        log_info "執行遷移: $migration_file"
        
        if [ -f "src/database/migrations/$migration_file" ]; then
            if psql "$DATABASE_URL" -f "src/database/migrations/$migration_file"; then
                log_success "遷移完成: $migration_file"
            else
                log_error "遷移失敗: $migration_file"
                exit 1
            fi
        else
            log_warning "遷移文件不存在: $migration_file"
        fi
    done
    
    log_success "所有遷移執行完成"
}

# 驗證遷移結果
verify_migrations() {
    log_info "驗證遷移結果..."
    
    # 檢查索引是否創建成功
    local index_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';")
    log_info "數據庫索引總數: $index_count"
    
    # 檢查函數是否創建成功
    local function_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');")
    log_info "數據庫函數總數: $function_count"
    
    # 檢查視圖是否創建成功
    local view_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public';")
    log_info "數據庫視圖總數: $view_count"
    
    log_success "遷移驗證完成"
}

# 性能測試
performance_test() {
    log_info "執行性能測試..."
    
    # 測試查詢性能
    log_info "測試課程查詢性能..."
    local start_time=$(date +%s%N)
    psql "$DATABASE_URL" -c "SELECT * FROM get_courses_optimized('basic', '藥學', 1, 10);" > /dev/null
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    log_info "課程查詢耗時: ${duration}ms"
    
    # 測試用戶儀表板查詢性能
    log_info "測試用戶儀表板查詢性能..."
    start_time=$(date +%s%N)
    psql "$DATABASE_URL" -c "SELECT * FROM get_user_dashboard_data(1);" > /dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    log_info "用戶儀表板查詢耗時: ${duration}ms"
    
    # 測試管理員統計查詢性能
    log_info "測試管理員統計查詢性能..."
    start_time=$(date +%s%N)
    psql "$DATABASE_URL" -c "SELECT * FROM get_admin_dashboard_stats();" > /dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    log_info "管理員統計查詢耗時: ${duration}ms"
    
    log_success "性能測試完成"
}

# 生成性能報告
generate_report() {
    log_info "生成性能報告..."
    
    local report_file="performance_report_$(date +%Y%m%d_%H%M%S).json"
    
    psql "$DATABASE_URL" -c "SELECT jsonb_pretty(jsonb_agg(jsonb_build_object('section', report_section, 'data', report_data))) FROM generate_performance_report();" -t > "$report_file"
    
    if [ -f "$report_file" ]; then
        log_success "性能報告生成完成: $report_file"
    else
        log_warning "性能報告生成失敗"
    fi
}

# 檢查性能警報
check_alerts() {
    log_info "檢查性能警報..."
    
    local alert_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM check_performance_alerts();")
    
    if [ "$alert_count" -gt 0 ]; then
        log_warning "發現 $alert_count 個性能警報"
        psql "$DATABASE_URL" -c "SELECT * FROM check_performance_alerts();"
    else
        log_success "未發現性能警報"
    fi
}

# 主函數
main() {
    log_info "開始數據庫性能優化遷移..."
    
    check_env
    check_db_connection
    backup_database
    run_migrations
    verify_migrations
    performance_test
    generate_report
    check_alerts
    
    log_success "數據庫性能優化遷移完成！"
    
    echo ""
    echo "=========================================="
    echo "遷移摘要:"
    echo "- 數據庫索引已優化"
    echo "- 查詢性能已提升"
    echo "- 性能監控已啟用"
    echo "- 自動化維護已配置"
    echo "=========================================="
}

# 錯誤處理
trap 'log_error "遷移過程中發生錯誤，請檢查日誌"; exit 1' ERR

# 執行主函數
main "$@"
