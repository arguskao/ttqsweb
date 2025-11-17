#!/bin/bash

echo "=== 測試 1: 無 Authorization header ==="
curl -s 'https://ttqs.24cc.cc/api/v1/courses?page=1&limit=3' | head -20

echo -e "\n\n=== 測試 2: 有效的 Authorization header ==="
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJlbWFpbCI6IndpaTU0M0BnbWFpbC5jb20iLCJ1c2VyVHlwZSI6Imluc3RydWN0b3IiLCJpYXQiOjE3NjMzNzE1NDAsImV4cCI6MTc2MzQ1Nzk0MCwiYXVkIjoicGhhcm1hY3ktYXNzaXN0YW50LWFjYWRlbXktdXNlcnMiLCJpc3MiOiJwaGFybWFjeS1hc3Npc3RhbnQtYWNhZGVteSJ9.1az4ClvcQy6K9olHEwP9phdGdVfOtx-7MiiLtMl_GFE"
curl -s -H "Authorization: Bearer $TOKEN" 'https://ttqs.24cc.cc/api/v1/courses?page=1&limit=3' | head -20

echo -e "\n\n=== 測試 3: 無效的 Authorization header (格式錯誤) ==="
curl -s -H "Authorization: Bearer invalid.token" 'https://ttqs.24cc.cc/api/v1/courses?page=1&limit=3'

echo -e "\n\n=== 測試 4: 無效的 Authorization header (空字串) ==="
curl -s -H "Authorization: Bearer " 'https://ttqs.24cc.cc/api/v1/courses?page=1&limit=3'
