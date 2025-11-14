#!/bin/bash

# 完整測試所有已遷移的 API（10 個）
# 使用方法: ./scripts/test-all-migrated-apis.sh [BASE_URL]

BASE_URL="${1:-http://localhost:8788}"
API_BASE="${BASE_URL}/api/v1"

# 顏色輸出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
  
  echo -e "\n${BLUE}[測試 ${TOTAL_TESTS}] ${name}${NC}"
  echo "  方法: ${method} ${endpoint}"
  
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
  local response=$(eval $curl_cmd 2>&1)
  local status_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)
  
  # 檢查狀態碼
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "  ${GREEN}✓ 通過 (狀態碼: ${status_code})${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "  ${RED}✗ 失敗 (期望: ${expected_status}, 實際: ${status_code})${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    # 顯示錯誤回應
    if command -v jq &> /dev/null; then
      echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
      echo "$body"
    fi
  fi
}

echo "========================================="
echo "  測試所有已遷移的 API (10 個)"
echo "  基礎 URL: ${BASE_URL}"
echo "========================================="

# ============================================
# 1. 認證 API (2 個)
# ============================================
echo -e "\n${YELLOW}=== 1. 認證 API (auth/login.ts, auth/register.ts) ===${NC}"

# 1.1 註冊測試
test_api \
  "註冊新用戶" \
  "POST" \
  "/auth/register" \
  '{"email":"test_'$(date +%s)'@example.com","password":"Test1234","userType":"job_seeker","firstName":"測試","lastName":"用戶"}' \
  "201"

# 1.2 登入測試（使用錯誤的密碼）
test_api \
  "登入失敗（錯誤密碼）" \
  "POST" \
  "/auth/login" \
  '{"email":"test@example.com","password":"wrongpassword"}' \
  "401"

# 1.3 登入驗證錯誤
test_api \
  "登入驗證錯誤（無效 email）" \
  "POST" \
  "/auth/login" \
  '{"email":"invalid-email","password":"password123"}' \
  "400"

test_api \
  "登入驗證錯誤（缺少密碼）" \
  "POST" \
  "/auth/login" \
  '{"email":"test@example.com"}' \
  "400"

# ============================================
# 2. 課程列表 API (1 個)
# ============================================
echo -e "\n${YELLOW}=== 2. 課程列表 API (courses.ts) ===${NC}"

# 2.1 獲取課程列表
test_api \
  "獲取課程列表（第1頁）" \
  "GET" \
  "/courses?page=1&limit=12" \
  "" \
  "200"

# 2.2 按類型篩選
test_api \
  "按類型篩選課程（basic）" \
  "GET" \
  "/courses?course_type=basic" \
  "" \
  "200"

# 2.3 搜尋課程
test_api \
  "搜尋課程" \
  "GET" \
  "/courses?search=藥" \
  "" \
  "200"

# 2.4 無效的分頁參數
test_api \
  "無效的分頁參數" \
  "GET" \
  "/courses?page=0&limit=200" \
  "" \
  "400"

# ============================================
# 3. 課程詳情 API (1 個)
# ============================================
echo -e "\n${YELLOW}=== 3. 課程詳情 API (courses/[id].ts) ===${NC}"

# 3.1 獲取課程詳情
test_api \
  "獲取課程詳情（ID: 1）" \
  "GET" \
  "/courses/1" \
  "" \
  "200"

# 3.2 課程不存在
test_api \
  "課程不存在（ID: 99999）" \
  "GET" \
  "/courses/99999" \
  "" \
  "404"

# 3.3 無效的課程 ID
test_api \
  "無效的課程 ID" \
  "GET" \
  "/courses/abc" \
  "" \
  "400"

# ============================================
# 4. 課程報名 API (1 個)
# ============================================
echo -e "\n${YELLOW}=== 4. 課程報名 API (courses/[id]/enroll.ts) ===${NC}"

# 4.1 未授權報名
test_api \
  "未授權報名（無 token）" \
  "POST" \
  "/courses/1/enroll" \
  "" \
  "401"

# 4.2 無效的課程 ID
test_api \
  "無效的課程 ID" \
  "POST" \
  "/courses/abc/enroll" \
  "" \
  "400"

# ============================================
# 5. 課程進度 API (1 個)
# ============================================
echo -e "\n${YELLOW}=== 5. 課程進度 API (courses/[id]/progress.ts) ===${NC}"

# 5.1 未授權查詢進度
test_api \
  "未授權查詢進度（無 token）" \
  "GET" \
  "/courses/1/progress" \
  "" \
  "401"

# 5.2 無效的課程 ID
test_api \
  "無效的課程 ID" \
  "GET" \
  "/courses/abc/progress" \
  "" \
  "400"

# ============================================
# 6. 課程學員名單 API (1 個)
# ============================================
echo -e "\n${YELLOW}=== 6. 課程學員名單 API (courses/[courseId]/students.ts) ===${NC}"

# 6.1 未授權查詢學員
test_api \
  "未授權查詢學員（無 token）" \
  "GET" \
  "/courses/1/students" \
  "" \
  "401"

# 6.2 無效的課程 ID
test_api \
  "無效的課程 ID" \
  "GET" \
  "/courses/abc/students" \
  "" \
  "400"

# ============================================
# 7. 用戶報名記錄 API (1 個)
# ============================================
echo -e "\n${YELLOW}=== 7. 用戶報名記錄 API (users/enrollments.ts) ===${NC}"

# 7.1 未授權查詢
test_api \
  "未授權查詢報名記錄（無 token）" \
  "GET" \
  "/users/enrollments" \
  "" \
  "401"

# ============================================
# 8. 檔案上傳 API (1 個)
# ============================================
echo -e "\n${YELLOW}=== 8. 檔案上傳 API (upload.ts) ===${NC}"

# 8.1 未授權上傳
test_api \
  "未授權上傳（無 token）" \
  "POST" \
  "/upload" \
  "" \
  "401"

# 8.2 未授權查詢檔案列表
test_api \
  "未授權查詢檔案列表（無 token）" \
  "GET" \
  "/upload" \
  "" \
  "401"

# ============================================
# 9. 經驗分享 API (1 個，4 個方法)
# ============================================
echo -e "\n${YELLOW}=== 9. 經驗分享 API (experiences.ts) ===${NC}"

# 9.1 獲取經驗分享列表
test_api \
  "獲取經驗分享列表" \
  "GET" \
  "/experiences?page=1&limit=12" \
  "" \
  "200"

# 9.2 獲取精選經驗分享
test_api \
  "獲取精選經驗分享" \
  "GET" \
  "/experiences?featured=true" \
  "" \
  "200"

# 9.3 無效的分頁參數
test_api \
  "無效的分頁參數" \
  "GET" \
  "/experiences?page=-1" \
  "" \
  "400"

# 9.4 未授權創建
test_api \
  "未授權創建經驗分享（無 token）" \
  "POST" \
  "/experiences" \
  '{"title":"測試","content":"內容"}' \
  "401"

# 9.5 未授權更新
test_api \
  "未授權更新經驗分享（無 token）" \
  "PUT" \
  "/experiences" \
  '{"id":1,"title":"更新"}' \
  "401"

# 9.6 未授權刪除
test_api \
  "未授權刪除經驗分享（無 token）" \
  "DELETE" \
  "/experiences?id=1" \
  "" \
  "401"

# ============================================
# 測試結果總結
# ============================================
echo ""
echo "========================================="
echo "  測試結果總結"
echo "========================================="
echo -e "總測試數: ${TOTAL_TESTS}"
echo -e "${GREEN}通過: ${PASSED_TESTS}${NC}"
echo -e "${RED}失敗: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}✓✓✓ 所有測試通過！✓✓✓${NC}"
  echo ""
  echo "已測試的 API："
  echo "  1. ✅ auth/login.ts"
  echo "  2. ✅ auth/register.ts"
  echo "  3. ✅ courses.ts"
  echo "  4. ✅ courses/[id].ts"
  echo "  5. ✅ courses/[id]/enroll.ts"
  echo "  6. ✅ courses/[id]/progress.ts"
  echo "  7. ✅ courses/[courseId]/students.ts"
  echo "  8. ✅ users/enrollments.ts"
  echo "  9. ✅ upload.ts"
  echo " 10. ✅ experiences.ts"
  echo ""
  exit 0
else
  echo -e "\n${RED}✗ 有 ${FAILED_TESTS} 個測試失敗${NC}"
  echo ""
  echo "建議："
  echo "  1. 檢查 API 服務是否正在運行"
  echo "  2. 檢查資料庫連接是否正常"
  echo "  3. 查看失敗測試的錯誤訊息"
  echo ""
  exit 1
fi
