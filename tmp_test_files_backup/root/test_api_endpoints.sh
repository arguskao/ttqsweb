#!/bin/bash

# API 端點測試腳本
# 用於測試部署後的 API 是否正常運作

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API 基礎 URL（部署後請修改為實際的 URL）
BASE_URL="${1:-https://c6d21c39.pharmacy-assistant-academy.pages.dev}"

# JWT Token（請替換為您的有效 token）
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI2LCJlbWFpbCI6ImFkbWluQHR0cXMuY29tIiwidXNlclR5cGUiOiJhZG1pbiIsImlhdCI6MTc2MTk4NjgzOCwiZXhwIjoxNzYyMDczMjM4LCJhdWQiOiJwaGFybWFjeS1hc3Npc3RhbnQtYWNhZGVteS11c2VycyIsImlzcyI6InBoYXJtYWN5LWFzc2lzdGFudC1hY2FkZW15In0.hm2bq96t5WNr5vA8HzS5tFuh41YzUGziZ3bpiDhzI7s"

echo "=========================================="
echo "API 端點測試腳本"
echo "=========================================="
echo "基礎 URL: $BASE_URL"
echo ""

# 測試函數
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}測試: $description${NC}"
    echo "端點: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
        echo "回應: $body" | jq . 2>/dev/null || echo "回應: $body"
    else
        echo -e "${RED}❌ 失敗 (HTTP $http_code)${NC}"
        echo "回應: $body" | jq . 2>/dev/null || echo "回應: $body"
    fi
    echo ""
}

# 1. 測試訓練計劃列表 API
test_endpoint "GET" "/api/v1/ttqs/plans?page=1&limit=10" "" "獲取訓練計劃列表"

# 2. 測試創建訓練計劃 API
test_plan_data='{
    "title": "測試訓練計劃",
    "description": "這是一個測試用的訓練計劃",
    "objectives": "測試 API 端點是否正常運作",
    "target_audience": "所有學員",
    "duration_weeks": 4,
    "status": "draft"
}'
test_endpoint "POST" "/api/v1/ttqs/plans" "$test_plan_data" "創建訓練計劃"

# 3. 測試獲取訓練計劃詳情（如果有創建成功，使用 ID 1）
test_endpoint "GET" "/api/v1/ttqs/plans/1" "" "獲取訓練計劃詳情"

# 4. 測試講師申請 API
test_endpoint "GET" "/api/v1/users/26/instructor-application" "" "獲取用戶講師申請狀態"

# 5. 測試經驗分享 API（確認原有功能正常）
test_endpoint "GET" "/api/v1/experiences?page=1&limit=5" "" "獲取經驗分享列表"

echo "=========================================="
echo "測試完成"
echo "=========================================="

