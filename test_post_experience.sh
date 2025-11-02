#!/bin/bash

# 經驗分享 API 測試 - 使用 curl 命令
# 直接修改下面的 curl 命令中的內容來測試不同的文章

curl -X POST "https://c6d21c39.pharmacy-assistant-academy.pages.dev/api/v1/experiences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI2LCJlbWFpbCI6ImFkbWluQHR0cXMuY29tIiwidXNlclR5cGUiOiJhZG1pbiIsImlhdCI6MTc2MTk4NjgzOCwiZXhwIjoxNzYyMDczMjM4LCJhdWQiOiJwaGFybWFjeS1hc3Npc3RhbnQtYWNhZGVteS11c2VycyIsImlzcyI6InBoYXJtYWN5LWFzc2lzdGFudC1hY2FkZW15In0.hm2bq96t5WNr5vA8HzS5tFuh41YzUGziZ3bpiDhzI7s" \
  -d '{
    "title": "在這裡修改標題",
    "content": "在這裡修改內容",
    "category": "job_experience",
    "tags": ["標籤1", "標籤2"]
  }'

