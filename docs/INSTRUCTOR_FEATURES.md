# 講師功能說明

## 新增功能

### 1. 查看課程學員名單

講師可以查看自己教授的課程中的所有學員資訊。

**功能路徑：**
- 我的授課 → 選擇課程 → 學員管理

**顯示資訊：**
- 學員姓名
- Email
- 報名日期
- 學習進度（百分比）
- 狀態（已報名、進行中、已完成、已退出）

**統計資訊：**
- 總學員數
- 進行中的學員數
- 已完成的學員數
- 平均學習進度

### 2. 發送訊息給學員

講師可以發送訊息給課程學員，支援兩種模式：

#### 群發訊息
- 一次發送給課程的所有學員
- 適合發送課程公告、重要通知等

#### 單獨發送
- 發送給特定學員
- 適合個別指導、回覆問題等

**訊息內容包括：**
- 主旨
- 訊息內容（支援多行文字）

### 3. 學員查看訊息

學員可以在課程詳情頁查看講師發送的訊息。

**功能路徑：**
- 課程詳情 → 查看課程訊息

**訊息顯示：**
- 發送者姓名
- 發送時間
- 訊息主旨
- 訊息內容
- 群發標記（如果是群發訊息）

## API 端點

### 1. 獲取課程學員名單
```
GET /api/v1/courses/:courseId/students
```

**權限：** 課程講師或管理員

**回應範例：**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": 1,
      "title": "藥學基礎課程",
      "courseType": "基礎課程"
    },
    "students": [
      {
        "id": 10,
        "email": "student@example.com",
        "firstName": "小明",
        "lastName": "王",
        "fullName": "王小明",
        "phone": "0912345678",
        "enrollmentDate": "2024-01-15T10:00:00Z",
        "progressPercentage": 75,
        "status": "in_progress",
        "completionDate": null,
        "finalScore": null
      }
    ],
    "total": 1
  }
}
```

### 2. 發送訊息
```
POST /api/v1/courses/:courseId/messages
```

**權限：** 課程講師或管理員

**請求範例（群發）：**
```json
{
  "subject": "課程公告",
  "message": "下週課程將調整時間，請注意。",
  "isBroadcast": true
}
```

**請求範例（單獨發送）：**
```json
{
  "subject": "作業回饋",
  "message": "您的作業完成得很好，繼續加油！",
  "isBroadcast": false,
  "recipientId": 10
}
```

### 3. 獲取課程訊息
```
GET /api/v1/courses/:courseId/messages
```

**權限：** 課程學員或講師

**回應範例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "courseId": 1,
      "senderId": 5,
      "senderName": "李老師",
      "senderEmail": "teacher@example.com",
      "recipientId": 10,
      "subject": "課程公告",
      "message": "下週課程將調整時間，請注意。",
      "isBroadcast": true,
      "isRead": false,
      "createdAt": "2024-01-20T14:30:00Z",
      "readAt": null
    }
  ]
}
```

## 資料庫結構

### course_messages 表

```sql
CREATE TABLE course_messages (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    CONSTRAINT check_broadcast_or_recipient CHECK (
        (is_broadcast = TRUE AND recipient_id IS NULL) OR
        (is_broadcast = FALSE AND recipient_id IS NOT NULL)
    )
);
```

## 使用流程

### 講師端

1. **登入系統**
   - 使用講師帳號登入

2. **查看課程**
   - 進入「我的授課」頁面
   - 查看自己教授的課程列表

3. **管理學員**
   - 點擊課程的「學員管理」按鈕
   - 查看學員名單和學習進度

4. **發送訊息**
   - 在學員管理頁面點擊「發送訊息給學員」（群發）
   - 或點擊特定學員的「發送訊息」按鈕（單獨發送）
   - 填寫主旨和訊息內容
   - 點擊「發送訊息」

### 學員端

1. **登入系統**
   - 使用學員帳號登入

2. **報名課程**
   - 瀏覽課程列表
   - 選擇課程並報名

3. **查看訊息**
   - 進入已報名的課程詳情頁
   - 點擊「查看課程訊息」按鈕
   - 查看講師發送的所有訊息

## 權限控制

### 講師權限
- ✅ 查看自己教授的課程學員名單
- ✅ 發送訊息給自己課程的學員
- ❌ 無法查看其他講師的課程學員
- ❌ 無法報名課程（講師身份不顯示報名按鈕）

### 學員權限
- ✅ 查看已報名課程的訊息
- ✅ 報名課程
- ❌ 無法查看未報名課程的訊息
- ❌ 無法發送訊息

### 管理員權限
- ✅ 查看所有課程的學員名單
- ✅ 發送訊息給任何課程的學員
- ✅ 完整的系統管理權限

## 測試建議

### 1. 測試講師查看學員
```bash
# 以講師身份登入
# 進入「我的授課」
# 點擊「學員管理」
# 確認可以看到學員名單和統計資訊
```

### 2. 測試發送群發訊息
```bash
# 在學員管理頁面
# 點擊「發送訊息給學員」
# 填寫主旨和內容
# 發送後確認所有學員都收到
```

### 3. 測試發送單獨訊息
```bash
# 在學員管理頁面
# 點擊特定學員的「發送訊息」
# 填寫主旨和內容
# 發送後確認只有該學員收到
```

### 4. 測試學員查看訊息
```bash
# 以學員身份登入
# 進入已報名的課程詳情
# 點擊「查看課程訊息」
# 確認可以看到講師發送的訊息
```

## 注意事項

1. **權限驗證**：所有 API 都會驗證用戶權限，確保只有授權用戶可以訪問
2. **資料驗證**：發送訊息時會驗證收件人是否為課程學員
3. **群發限制**：群發訊息只能發送給已報名的學員
4. **訊息記錄**：所有訊息都會保存在資料庫中，可追溯
5. **索引優化**：已為常用查詢添加資料庫索引，提升性能

## 未來擴展

可以考慮添加的功能：

1. **訊息已讀狀態**：追蹤學員是否已讀訊息
2. **訊息回覆**：允許學員回覆講師的訊息
3. **訊息分類**：支援訊息分類（公告、作業、討論等）
4. **訊息搜尋**：支援搜尋歷史訊息
5. **訊息通知**：Email 或推送通知
6. **附件支援**：允許在訊息中添加附件
7. **訊息範本**：常用訊息範本功能
