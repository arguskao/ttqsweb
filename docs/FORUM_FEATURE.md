# 討論區功能文檔

## 概述

討論區是藥助Next學院的核心社區功能，允許學員在群組內發起討論、提問和分享經驗。該功能與現有的群組系統集成，提供完整的社區交流體驗。

## 功能特性

### 1. 討論主題管理
- **發起討論**：已登入的用戶可以在加入的群組中發起新的討論主題
- **分類系統**：支持四種討論分類
  - 提問 (Question)
  - 討論 (Discussion)
  - 公告 (Announcement)
  - 資源分享 (Resource)
- **置頂功能**：管理員可以置頂重要主題
- **鎖定功能**：管理員可以鎖定已解決的主題，防止進一步回覆

### 2. 回覆系統
- **發表回覆**：群組成員可以對討論主題進行回覆
- **嵌套回覆**：支持對其他回覆的回覆（嵌套評論）
- **最佳解答**：提問者可以標記最佳解答
- **按讚功能**：用戶可以對有幫助的回覆按讚

### 3. 搜尋和排序
- **按分類篩選**：按討論分類篩選主題
- **排序選項**：
  - 最新：按發布時間排序
  - 最熱門：按回覆數和瀏覽數排序
  - 未回答：顯示沒有回覆的主題
- **搜尋功能**：按關鍵詞搜尋討論主題

### 4. 統計信息
- **瀏覽次數**：追蹤每個主題的瀏覽次數
- **回覆計數**：顯示每個主題的回覆數
- **按讚計數**：顯示每個回覆的按讚數

## 文件結構

### 前端組件

#### 1. ForumView.vue
**路徑**: `src/views/community/ForumView.vue`

討論區主頁，顯示所有討論主題列表。

**功能**:
- 顯示討論主題列表
- 按群組、分類和排序方式篩選
- 分頁瀏覽
- 發起新討論的模態框

**主要屬性**:
```typescript
- topics: Topic[] - 討論主題列表
- myGroups: Group[] - 用戶加入的群組
- selectedGroupId: string - 選中的群組ID
- selectedCategory: string - 選中的分類
- sortBy: 'latest' | 'popular' | 'unanswered' - 排序方式
- currentPage: number - 當前頁碼
- totalPages: number - 總頁數
```

#### 2. ForumTopicView.vue
**路徑**: `src/views/community/ForumTopicView.vue`

討論主題詳情頁，顯示單個主題及其所有回覆。

**功能**:
- 顯示討論主題詳情
- 顯示所有回覆
- 發表新回覆
- 對回覆按讚

**主要屬性**:
```typescript
- topic: Topic - 討論主題
- replies: Reply[] - 回覆列表
- newReply: { content: string } - 新回覆內容
```

#### 3. GroupDetailView.vue
**路徑**: `src/views/community/GroupDetailView.vue`

群組詳情頁，顯示群組信息、成員和討論主題。

**功能**:
- 顯示群組詳情
- 加入群組
- 查看群組成員
- 查看群組內的討論主題

### 後端服務

#### 1. forumService
**路徑**: `src/services/forum-service.ts`

提供所有討論區相關的 API 調用。

**主要方法**:
```typescript
// 討論主題相關
getGroupTopics(groupId, options) - 獲取群組的討論主題
createTopic(groupId, data) - 創建新主題
getTopicDetail(topicId) - 獲取主題詳情
updateTopic(topicId, data) - 更新主題
deleteTopic(topicId) - 刪除主題
pinTopic(topicId, isPinned) - 置頂/取消置頂
lockTopic(topicId, isLocked) - 鎖定/解鎖

// 回覆相關
createReply(topicId, data) - 發表回覆
updateReply(replyId, data) - 更新回覆
deleteReply(replyId) - 刪除回覆
markAsSolution(replyId) - 標記為最佳解答
likeReply(replyId) - 對回覆按讚
unlikeReply(replyId) - 取消按讚

// 搜尋相關
searchTopics(keyword, options) - 搜尋主題
getPopularTopics(limit) - 獲取熱門主題
getUnansweredTopics(options) - 獲取未回答的主題
```

### 後端 API 路由

**路徑**: `src/api/community-routes.ts`

#### 討論主題端點
```
GET    /api/v1/groups/:id/topics              # 獲取群組的討論主題列表
POST   /api/v1/groups/:id/topics              # 創建新討論主題
GET    /api/v1/topics/:id                     # 獲取討論主題詳情
PUT    /api/v1/topics/:id                     # 更新討論主題
DELETE /api/v1/topics/:id                     # 刪除討論主題
```

#### 回覆端點
```
POST   /api/v1/topics/:id/replies             # 發表回覆
PUT    /api/v1/replies/:id                    # 更新回覆
DELETE /api/v1/replies/:id                    # 刪除回覆
POST   /api/v1/replies/:id/like               # 對回覆按讚
POST   /api/v1/replies/:id/unlike             # 取消按讚
```

## 路由配置

討論區相關的路由已添加到 `src/router/index.ts`：

```typescript
// 討論區主頁
{
  path: '/community/forum',
  name: 'community-forum',
  component: ForumView
}

// 討論主題詳情
{
  path: '/community/forum/topics/:id',
  name: 'community-forum-topic',
  component: ForumTopicView
}

// 群組列表
{
  path: '/community/groups',
  name: 'community-groups',
  component: GroupsView
}

// 群組詳情
{
  path: '/community/groups/:id',
  name: 'community-group-detail',
  component: GroupDetailView
}

// 經驗分享
{
  path: '/community/experiences',
  name: 'community-experiences',
  component: ExperiencesView
}
```

## 導航集成

討論區鏈接已添加到主導航欄 (`src/components/layout/AppHeader.vue`)：
- 討論區 → `/community/forum`
- 群組 → `/community/groups`
- 經驗分享 → `/community/experiences`

## 使用示例

### 1. 發起新討論
```typescript
import { forumService } from '@/services/forum-service'

// 發起新討論
const topic = await forumService.createTopic(groupId, {
  title: '如何準備藥局助理考試？',
  content: '有人可以分享一些準備考試的經驗嗎？',
  category: 'question'
})
```

### 2. 發表回覆
```typescript
// 發表回覆
const reply = await forumService.createReply(topicId, {
  content: '我建議先複習基礎知識...'
})
```

### 3. 搜尋討論
```typescript
// 搜尋討論主題
const results = await forumService.searchTopics('藥學知識', {
  page: 1,
  limit: 20,
  category: 'question'
})
```

## 數據庫表結構

### forum_topics 表
```sql
CREATE TABLE forum_topics (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES student_groups(id),
  author_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### forum_replies 表
```sql
CREATE TABLE forum_replies (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES forum_topics(id),
  author_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  parent_reply_id INTEGER REFERENCES forum_replies(id),
  is_solution BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 權限管理

- **發起討論**：必須是群組成員
- **發表回覆**：必須是群組成員
- **編輯/刪除**：只有作者或管理員可以
- **置頂/鎖定**：只有群組管理員可以
- **標記最佳解答**：只有主題作者或管理員可以

## 最佳實踐

1. **清晰的標題**：使用清晰、具體的標題，便於搜尋
2. **適當的分類**：選擇正確的分類，幫助其他用戶快速找到相關討論
3. **禮貌的語氣**：保持尊重和友好的交流態度
4. **搜尋前提問**：在發起新討論前，先搜尋是否已有相似的討論
5. **提供詳細信息**：提問時提供足夠的背景信息，便於他人回答

## 未來改進

- [ ] 實時通知系統
- [ ] 討論主題訂閱功能
- [ ] 用戶聲譽系統
- [ ] 討論主題標籤系統
- [ ] 高級搜尋過濾器
- [ ] 討論主題導出功能
- [ ] 審核和舉報系統

