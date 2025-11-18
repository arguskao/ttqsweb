#!/bin/bash

# 測試新創建的 API 端點
# 使用方法: ./test-new-endpoints.sh [BASE_URL]
# 例如: ./test-new-endpoints.sh https://your-preview.pages.dev

BASE_URL="${1:-http://localhost:8788}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "測試新創建的 API 端點"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# 測試計數器
TOTAL=0
PASSED=0
FAILED=0

# 測試函數
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local headers=$5
    local data=$6
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] 測試 $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" $headers)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASSED=$((PASSED + 1))
        # 顯示部分響應
        echo "$body" | jq -C '.' 2>/dev/null | head -n 5 || echo "$body" | head -n 3
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        FAILED=$((FAILED + 1))
        echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
    fi
    echo ""
}

echo "=========================================="
echo "1. 系統端點測試"
echo "=========================================="

# 測試 Health Check
test_endpoint "Health Check" "GET" "/api/v1/health" "200"

# 測試 API Info
test_endpoint "API Info" "GET" "/api/v1/info" "200"

echo "=========================================="
echo "2. 認證端點測試"
echo "=========================================="

# 測試 Logout（不需要 token 也應該成功）
test_endpoint "Logout (無 token)" "POST" "/api/v1/auth/logout" "200"

# 如果有測試帳號，可以測試登入和刷新
echo -e "${YELLOW}提示: 需要有效的 token 才能測試 Refresh 端點${NC}"
echo ""

echo "=========================================="
echo "3. 講師端點測試"
echo "=========================================="

# 測試搜尋講師
test_endpoint "搜尋講師 (無關鍵字)" "GET" "/api/v1/instructors/search" "400"
test_endpoint "搜尋講師 (有關鍵字)" "GET" "/api/v1/instructors/search?q=test" "200"

# 測試高評分講師
test_endpoint "高評分講師 (預設)" "GET" "/api/v1/instructors/top-rated" "200"
test_endpoint "高評分講師 (限制5個)" "GET" "/api/v1/instructors/top-rated?limit=5" "200"

echo "=========================================="
echo "4. 課程端點測試"
echo "=========================================="

# 測試熱門課程
test_endpoint "熱門課程 (預設)" "GET" "/api/v1/courses/popular" "200"
test_endpoint "熱門課程 (限制5個)" "GET" "/api/v1/courses/popular?limit=5" "200"

echo "=========================================="
echo "5. 工作端點測試"
echo "=========================================="

# 測試按地點搜尋
test_endpoint "按地點搜尋 (台北)" "GET" "/api/v1/jobs/location/台北" "200"
test_endpoint "按地點搜尋 (台中)" "GET" "/api/v1/jobs/location/台中" "200"

# 測試待審核工作（需要管理員權限）
echo -e "${YELLOW}提示: 需要管理員 token 才能測試待審核工作端點${NC}"
echo ""

echo "=========================================="
echo "測試總結"
echo "=========================================="
echo -e "總計: $TOTAL"
echo -e "${GREEN}通過: $PASSED${NC}"
echo -e "${RED}失敗: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有測試通過！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED 個測試失敗${NC}"
    exit 1
fi
