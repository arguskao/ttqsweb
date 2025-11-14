#!/bin/bash

# 測試遷移後的 API 端點
# 使用方法: ./scripts/test-migrated-apis.sh [BASE_URL]

BASE_URL="${1:-http://localhost:8788}"
API_BASE="${BASE_URL}/api/v1"

# 顏色輸出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 測試計數器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 測試函數
test_api() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  local token="$6"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -e "\n${YELLOW}測試 ${TOTAL_TESTS}: ${name}${NC}"
  echo "  方法: ${method}"
  echo "  端點: ${endpoint}"
  
  # 構建 curl 命令
  local curl_cmd="curl -s -w '\n%{http_code}' -X ${method}"
  
  if [ -n "$token" ]; then
    curl_cmd="${curl_cmd} -H 'Authorization: Bearer ${token}'"
  fi
  
  if [ -n "$data" ]; then
    curl_cmd="${curl_cmd} -H 'Content-Type: application/json' -d '${data}'"
  fi
  
  curl_cmd="${curl_cmd} '${API_BASE}${endpoint}'"
  
  # 執行請求
  local response=$(eval $curl_cmd)
  local status_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)
  
  # 檢查狀態碼
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "  ${GREEN}✓ 狀態碼正確: ${status_code}${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "  ${RED}✗ 狀態碼錯誤: 期望 ${expected_status}, 實際 ${status_code}${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  
  # 顯示回應（格式化 JSON）
  if command -v jq &> /dev/null; then
    echo "  回應:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo "  回應: $body"
  fi
}

echo "========================================="
echo "  測試遷移後的 API 端點"
echo "  基礎 URL: ${BASE_URL}"
echo "========================================="

# 1. 測試註冊 API
echo -e "\n${YELLOW}=== 測試認證 API ===${NC}"

test_api \
  "註冊新用戶" \
  "POST" \
  "/auth/register" \
  '{"email":"test_'$(date +%s)'@example.com","password":"Test1234","userType":"job_seeker","firstName":"測試","lastName":"用戶"}' \
  "201"

# 2. 測試登入 API
test_api \
  "用戶登入" \
  "POST" \
  "/auth/login" \
  '{"email":"test@example.com","password":"password123"}' \
  "200"

# 保存 token（如果登入成功）
# 注意：這裡需要根據實際回應格式調整
# TOKEN=$(echo "$response" | jq -r '.data.tokens.accessToken' 2>/dev/null)

# 3. 測試課程詳情 API
echo -e "\n${YELLOW}=== 測試課程 API ===${NC}"

test_api \
  "獲取課程詳情" \
  "GET" \
  "/courses/1" \
  "" \
  "200"

test_api \
  "獲取不存在的課程" \
  "GET" \
  "/courses/99999" \
  "" \
  "404"

# 4. 測試課程報名 API（需要 token）
# test_api \
#   "課程報名" \
#   "POST" \
#   "/courses/1/enroll" \
#   "" \
#   "201" \
#   "$TOKEN"

# 5. 測試用戶報名記錄 API（需要 token）
# test_api \
#   "獲取用戶報名記錄" \
#   "GET" \
#   "/users/enrollments" \
#   "" \
#   "200" \
#   "$TOKEN"

# 6. 測試課程學員名單 API（需要講師 token）
# test_api \
#   "獲取課程學員名單" \
#   "GET" \
#   "/courses/1/students" \
#   "" \
#   "200" \
#   "$INSTRUCTOR_TOKEN"

# 測試錯誤處理
echo -e "\n${YELLOW}=== 測試錯誤處理 ===${NC}"

test_api \
  "無效的 email 格式" \
  "POST" \
  "/auth/login" \
  '{"email":"invalid-email","password":"password123"}' \
  "400"

test_api \
  "缺少必填欄位" \
  "POST" \
  "/auth/login" \
  '{"email":"test@example.com"}' \
  "400"

test_api \
  "無效的課程 ID" \
  "GET" \
  "/courses/abc" \
  "" \
  "400"

test_api \
  "未授權訪問（無 token）" \
  "POST" \
  "/courses/1/enroll" \
  "" \
  "401"

# 顯示測試結果
echo ""
echo "========================================="
echo "  測試結果總結"
echo "========================================="
echo -e "總測試數: ${TOTAL_TESTS}"
echo -e "${GREEN}通過: ${PASSED_TESTS}${NC}"
echo -e "${RED}失敗: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}✓ 所有測試通過！${NC}"
  exit 0
else
  echo -e "\n${RED}✗ 有測試失敗${NC}"
  exit 1
fi
