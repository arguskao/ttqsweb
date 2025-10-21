import { apiService } from './api-enhanced'
import type { ApiResponse } from '@/types/enhanced'

// 類型定義
export interface ForumTopic {
  id: number
  groupId: number
  authorId: number
  authorName: string
  title: string
  content: string
  category: 'question' | 'discussion' | 'announcement' | 'resource'
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  replyCount: number
  lastReplyAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ForumReply {
  id: number
  topicId: number
  authorId: number
  authorName: string
  content: string
  parentReplyId: number | null
  isSolution: boolean
  likeCount: number
  createdAt: string
  updatedAt: string
}

export interface ForumTopicDetail {
  topic: ForumTopic
  replies: ForumReply[]
}

export interface CreateTopicRequest {
  title: string
  content: string
  category: 'question' | 'discussion' | 'announcement' | 'resource'
}

export interface CreateReplyRequest {
  content: string
  parentReplyId?: number
}

export interface PaginatedTopics {
  data: ForumTopic[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 討論區服務
export const forumService = {
  // ===== 討論主題相關 =====

  /**
   * 獲取群組的討論主題列表
   */
  async getGroupTopics(
    groupId: number,
    options?: {
      page?: number
      limit?: number
      category?: string
      sortBy?: 'latest' | 'popular' | 'unanswered'
    }
  ): Promise<PaginatedTopics> {
    const response = await apiService.get<PaginatedTopics>(
      `/groups/${groupId}/topics`,
      {
        params: {
          page: options?.page || 1,
          limit: options?.limit || 20,
          category: options?.category,
          sortBy: options?.sortBy || 'latest'
        }
      }
    )

    if (!response.success || !response.data) {
      throw new Error('獲取討論主題失敗')
    }

    return response.data
  },

  /**
   * 創建新的討論主題
   */
  async createTopic(groupId: number, data: CreateTopicRequest): Promise<ForumTopic> {
    const response = await apiService.post<ForumTopic>(
      `/groups/${groupId}/topics`,
      data
    )

    if (!response.success || !response.data) {
      throw new Error('創建討論主題失敗')
    }

    return response.data
  },

  /**
   * 獲取討論主題詳情
   */
  async getTopicDetail(topicId: number): Promise<ForumTopicDetail> {
    const response = await apiService.get<ForumTopicDetail>(`/topics/${topicId}`)

    if (!response.success || !response.data) {
      throw new Error('獲取討論主題詳情失敗')
    }

    return response.data
  },

  /**
   * 更新討論主題
   */
  async updateTopic(
    topicId: number,
    data: Partial<CreateTopicRequest>
  ): Promise<ForumTopic> {
    const response = await apiService.put<ForumTopic>(`/topics/${topicId}`, data)

    if (!response.success || !response.data) {
      throw new Error('更新討論主題失敗')
    }

    return response.data
  },

  /**
   * 刪除討論主題
   */
  async deleteTopic(topicId: number): Promise<void> {
    const response = await apiService.delete<void>(`/topics/${topicId}`)

    if (!response.success) {
      throw new Error('刪除討論主題失敗')
    }
  },

  /**
   * 置頂/取消置頂討論主題
   */
  async pinTopic(topicId: number, isPinned: boolean): Promise<ForumTopic> {
    const response = await apiService.put<ForumTopic>(`/topics/${topicId}`, {
      isPinned
    })

    if (!response.success || !response.data) {
      throw new Error('置頂操作失敗')
    }

    return response.data
  },

  /**
   * 鎖定/解鎖討論主題
   */
  async lockTopic(topicId: number, isLocked: boolean): Promise<ForumTopic> {
    const response = await apiService.put<ForumTopic>(`/topics/${topicId}`, {
      isLocked
    })

    if (!response.success || !response.data) {
      throw new Error('鎖定操作失敗')
    }

    return response.data
  },

  // ===== 回覆相關 =====

  /**
   * 發表回覆
   */
  async createReply(topicId: number, data: CreateReplyRequest): Promise<ForumReply> {
    const response = await apiService.post<ForumReply>(
      `/topics/${topicId}/replies`,
      data
    )

    if (!response.success || !response.data) {
      throw new Error('發表回覆失敗')
    }

    return response.data
  },

  /**
   * 更新回覆
   */
  async updateReply(replyId: number, data: Partial<CreateReplyRequest>): Promise<ForumReply> {
    const response = await apiService.put<ForumReply>(`/replies/${replyId}`, data)

    if (!response.success || !response.data) {
      throw new Error('更新回覆失敗')
    }

    return response.data
  },

  /**
   * 刪除回覆
   */
  async deleteReply(replyId: number): Promise<void> {
    const response = await apiService.delete<void>(`/replies/${replyId}`)

    if (!response.success) {
      throw new Error('刪除回覆失敗')
    }
  },

  /**
   * 標記回覆為最佳解答
   */
  async markAsSolution(replyId: number): Promise<ForumReply> {
    const response = await apiService.put<ForumReply>(`/replies/${replyId}`, {
      isSolution: true
    })

    if (!response.success || !response.data) {
      throw new Error('標記最佳解答失敗')
    }

    return response.data
  },

  /**
   * 對回覆按讚
   */
  async likeReply(replyId: number): Promise<{ likeCount: number }> {
    const response = await apiService.post<{ likeCount: number }>(
      `/replies/${replyId}/like`,
      {}
    )

    if (!response.success || !response.data) {
      throw new Error('按讚失敗')
    }

    return response.data
  },

  /**
   * 取消對回覆的按讚
   */
  async unlikeReply(replyId: number): Promise<{ likeCount: number }> {
    const response = await apiService.post<{ likeCount: number }>(
      `/replies/${replyId}/unlike`,
      {}
    )

    if (!response.success || !response.data) {
      throw new Error('取消按讚失敗')
    }

    return response.data
  },

  // ===== 搜尋相關 =====

  /**
   * 搜尋討論主題
   */
  async searchTopics(
    keyword: string,
    options?: {
      page?: number
      limit?: number
      category?: string
    }
  ): Promise<PaginatedTopics> {
    const response = await apiService.get<PaginatedTopics>('/topics/search', {
      params: {
        keyword,
        page: options?.page || 1,
        limit: options?.limit || 20,
        category: options?.category
      }
    })

    if (!response.success || !response.data) {
      throw new Error('搜尋討論主題失敗')
    }

    return response.data
  },

  /**
   * 獲取熱門討論主題
   */
  async getPopularTopics(limit = 10): Promise<ForumTopic[]> {
    const response = await apiService.get<ForumTopic[]>('/topics/popular', {
      params: { limit }
    })

    if (!response.success || !response.data) {
      throw new Error('獲取熱門討論主題失敗')
    }

    return response.data
  },

  /**
   * 獲取未回答的討論主題
   */
  async getUnansweredTopics(
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<PaginatedTopics> {
    const response = await apiService.get<PaginatedTopics>('/topics/unanswered', {
      params: {
        page: options?.page || 1,
        limit: options?.limit || 20
      }
    })

    if (!response.success || !response.data) {
      throw new Error('獲取未回答的討論主題失敗')
    }

    return response.data
  }
}

export default forumService

