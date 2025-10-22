/**
 * 社區功能類型定義
 * 定義所有社區相關的TypeScript接口
 */

// 學生群組
export interface StudentGroup {
  id: number
  name: string
  description: string
  groupType: 'course' | 'interest' | 'alumni' | 'study'
  createdBy: number
  isActive: boolean
  memberCount: number
  maxMembers?: number
  isPublic?: boolean
  createdAt: Date
  updatedAt: Date
}

// 群組成員
export interface GroupMember {
  id: number
  groupId: number
  userId: number
  role: 'admin' | 'moderator' | 'member'
  joinedAt: Date
}

// 論壇主題
export interface ForumTopic {
  id: number
  groupId: number
  authorId: number
  title: string
  content: string
  category: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  replyCount: number
  lastReplyAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// 論壇回覆
export interface ForumReply {
  id: number
  topicId: number
  authorId: number
  content: string
  isEdited: boolean
  createdAt: Date
  updatedAt: Date
}

// 經驗分享
export interface ExperienceShare {
  id: number
  author_id: number
  title: string
  content: string
  share_type: 'interview' | 'job_experience' | 'learning_tips' | 'career_advice' | 'success_story'
  tags: string[]
  like_count: number
  comment_count: number
  view_count: number
  is_featured: boolean
  created_at: Date
  updated_at: Date
}

// 經驗評論
export interface ExperienceComment {
  id: number
  experienceId: number
  userId: number
  content: string
  likes: number
  createdAt: Date
  updatedAt: Date
}

// 群組創建請求
export interface CreateGroupRequest {
  name: string
  description: string
  groupType: 'course' | 'interest' | 'alumni' | 'study'
  maxMembers?: number
  isPublic?: boolean
}

// 群組更新請求
export interface UpdateGroupRequest {
  name?: string
  description?: string
  groupType?: 'course' | 'interest' | 'alumni' | 'study'
  maxMembers?: number
  isPublic?: boolean
  isActive?: boolean
}

// 論壇主題創建請求
export interface CreateTopicRequest {
  title: string
  content: string
  category: string
}

// 論壇回覆創建請求
export interface CreateReplyRequest {
  content: string
}

// 經驗分享創建請求
export interface CreateExperienceRequest {
  title: string
  content: string
  share_type: 'interview' | 'job_experience' | 'learning_tips' | 'career_advice' | 'success_story'
  tags: string[]
  is_featured?: boolean
}

// 經驗評論創建請求
export interface CreateCommentRequest {
  content: string
}

// 群組成員角色
export type GroupRole = 'admin' | 'moderator' | 'member'

// 群組類型
export type GroupType = 'course' | 'interest' | 'alumni' | 'study'

// 經驗分享類別
export type ExperienceCategory = 'interview' | 'job_experience' | 'learning_tips' | 'career_advice' | 'success_story'

// 群組統計
export interface GroupStats {
  totalGroups: number
  activeGroups: number
  totalMembers: number
  totalTopics: number
  totalReplies: number
}

// 用戶群組統計
export interface UserGroupStats {
  joinedGroups: number
  createdGroups: number
  topicsPosted: number
  repliesPosted: number
  experiencesShared: number
}

