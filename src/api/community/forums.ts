/**
 * 論壇功能路由
 * 處理論壇主題和回覆的創建、更新、刪除等操作
 */

import { ValidationError, NotFoundError, UnauthorizedError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { ForumTopicRepository, ForumReplyRepository, GroupMemberRepository } from './repositories'
import type { CreateTopicRequest, CreateReplyRequest, ForumTopic, ForumReply } from './types'

// Repository實例
const topicRepo = new ForumTopicRepository()
const replyRepo = new ForumReplyRepository()
const memberRepo = new GroupMemberRepository()

export function setupForumRoutes(router: ApiRouter): void {
  // 獲取所有論壇主題（支持前端 /forum/topics 端點）
  router.get('/api/v1/forum/topics', async (req: ApiRequest): Promise<ApiResponse> => {
    const query = req.query as Record<string, string | string[] | undefined>
    const { group_id, category, page = '1', limit = '20', sortBy = 'latest' } = query

    try {
      let topics: any[] = []
      const pageNum = parseInt(page as string) || 1
      const limitNum = parseInt(limit as string) || 20

      if (group_id) {
        const groupIdNum = parseInt(group_id as string)
        if (isNaN(groupIdNum)) {
          throw new ValidationError('Invalid group ID')
        }
        if (category) {
          topics = await topicRepo.findByCategory(groupIdNum, category as string)
        } else {
          topics = await topicRepo.findByGroup(groupIdNum)
        }
      } else {
        // 獲取所有主題
        if (category) {
          topics = await topicRepo.queryMany(
            'SELECT * FROM forum_topics WHERE category = $1 ORDER BY is_pinned DESC, created_at DESC',
            [category]
          )
        } else {
          topics = await topicRepo.findAll()
        }
      }

      // 排序
      if (sortBy === 'popular') {
        topics = topics.sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
      } else if (sortBy === 'unanswered') {
        topics = topics.filter((t: any) => (t.reply_count || 0) === 0)
      } else {
        // latest (default)
        topics = topics.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }

      // 分頁
      const total = topics.length
      const start = (pageNum - 1) * limitNum
      const paginatedTopics = topics.slice(start, start + limitNum)

      return {
        success: true,
        data: paginatedTopics,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    } catch (error) {
      throw error
    }
  })

  // 獲取群組的論壇主題
  router.get('/api/v1/groups/:groupId/topics', async (req: ApiRequest): Promise<ApiResponse> => {
    const params = req.params as Record<string, string>
    const query = req.query as Record<string, string | string[] | undefined>
    const { groupId } = params
    const { category } = query
    if (!groupId) {
      throw new ValidationError('Group ID is required')
    }
    const groupIdNum = parseInt(groupId)

    if (isNaN(groupIdNum)) {
      throw new ValidationError('Invalid group ID')
    }

    let topics
    if (category) {
      topics = await topicRepo.findByCategory(groupIdNum, category as string)
    } else {
      topics = await topicRepo.findByGroup(groupIdNum)
    }

    return {
      success: true,
      data: topics
    }
  })

  // 獲取主題詳情
  router.get('/api/v1/topics/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    const params = req.params as Record<string, string>
    const { id } = params
    if (!id) {
      throw new ValidationError('Topic ID is required')
    }
    const topicId = parseInt(id)

    if (isNaN(topicId)) {
      throw new ValidationError('Invalid topic ID')
    }

    const topic = await topicRepo.findById(topicId)
    if (!topic) {
      throw new NotFoundError('Topic not found')
    }

    // 增加瀏覽次數
    await topicRepo.incrementViews(topicId)

    // 獲取回覆
    const replies = await replyRepo.findByTopic(topicId)

    return {
      success: true,
      data: {
        ...topic,
        replies
      }
    }
  })

  // 創建主題
  router.post(
    '/groups/:groupId/topics',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { groupId } = params
      if (!groupId) {
        throw new ValidationError('Group ID is required')
      }
      const groupIdNum = parseInt(groupId)
      const { title, content, category }: CreateTopicRequest = req.body as CreateTopicRequest

      if (isNaN(groupIdNum)) {
        throw new ValidationError('Invalid group ID')
      }

      if (!title || !content) {
        throw new ValidationError('Title and content are required')
      }

      // 檢查用戶是否為群組成員
      const membership = await memberRepo.findByUserAndGroup(req.user!.id, groupIdNum)
      if (!membership) {
        throw new UnauthorizedError('Must be a group member to create topics')
      }

      const topicData: Omit<ForumTopic, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        content,
        category: category || 'general',
        groupId: groupIdNum,
        authorId: req.user!.id,
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        replyCount: 0,
        lastReplyAt: null
      }

      const topic = await topicRepo.create(topicData)

      return {
        success: true,
        data: topic
      }
    })
  )

  // 更新主題
  router.put(
    '/topics/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Topic ID is required')
      }
      const topicId = parseInt(id)
      const { title, content, category } = req.body as CreateTopicRequest

      if (isNaN(topicId)) {
        throw new ValidationError('Invalid topic ID')
      }

      const topic = await topicRepo.findById(topicId)
      if (!topic) {
        throw new NotFoundError('Topic not found')
      }

      // 檢查權限
      if (topic.authorId !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this topic')
      }

      const updateData = {
        title: title || topic.title,
        content: content || topic.content,
        category: category || topic.category,
        updatedAt: new Date()
      }

      const updatedTopic = await topicRepo.update(topicId, updateData)

      return {
        success: true,
        data: updatedTopic
      }
    })
  )

  // 刪除主題
  router.delete(
    '/topics/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Topic ID is required')
      }
      const topicId = parseInt(id)

      if (isNaN(topicId)) {
        throw new ValidationError('Invalid topic ID')
      }

      const topic = await topicRepo.findById(topicId)
      if (!topic) {
        throw new NotFoundError('Topic not found')
      }

      // 檢查權限
      if (topic.authorId !== req.user!.id) {
        throw new UnauthorizedError('Cannot delete this topic')
      }

      await topicRepo.delete(topicId)

      return {
        success: true,
        data: { message: 'Topic deleted successfully' }
      }
    })
  )

  // 點讚主題
  router.post(
    '/topics/:id/like',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Topic ID is required')
      }
      const topicId = parseInt(id)

      if (isNaN(topicId)) {
        throw new ValidationError('Invalid topic ID')
      }

      const topic = await topicRepo.findById(topicId)
      if (!topic) {
        throw new NotFoundError('Topic not found')
      }

      await topicRepo.incrementLikes(topicId)

      return {
        success: true,
        data: { message: 'Topic liked successfully' }
      }
    })
  )

  // 創建回覆
  router.post(
    '/topics/:id/replies',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Topic ID is required')
      }
      const topicId = parseInt(id)
      const { content }: CreateReplyRequest = req.body as CreateReplyRequest

      if (isNaN(topicId)) {
        throw new ValidationError('Invalid topic ID')
      }

      if (!content) {
        throw new ValidationError('Content is required')
      }

      const topic = await topicRepo.findById(topicId)
      if (!topic) {
        throw new NotFoundError('Topic not found')
      }

      // 檢查用戶是否為群組成員
      const membership = await memberRepo.findByUserAndGroup(req.user!.id, topic.groupId)
      if (!membership) {
        throw new UnauthorizedError('Must be a group member to reply')
      }

      const replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt'> = {
        content,
        topicId,
        authorId: req.user!.id,
        isEdited: false
      }

      const reply = await replyRepo.create(replyData)

      return {
        success: true,
        data: reply
      }
    })
  )

  // 更新回覆
  router.put(
    '/replies/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Reply ID is required')
      }
      const replyId = parseInt(id)
      const { content } = req.body as CreateReplyRequest

      if (isNaN(replyId)) {
        throw new ValidationError('Invalid reply ID')
      }

      if (!content) {
        throw new ValidationError('Content is required')
      }

      const reply = await replyRepo.findById(replyId)
      if (!reply) {
        throw new NotFoundError('Reply not found')
      }

      // 檢查權限
      if (reply.authorId !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this reply')
      }

      const updateData = {
        content,
        updatedAt: new Date()
      }

      const updatedReply = await replyRepo.update(replyId, updateData)

      return {
        success: true,
        data: updatedReply
      }
    })
  )

  // 刪除回覆
  router.delete(
    '/replies/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Reply ID is required')
      }
      const replyId = parseInt(id)

      if (isNaN(replyId)) {
        throw new ValidationError('Invalid reply ID')
      }

      const reply = await replyRepo.findById(replyId)
      if (!reply) {
        throw new NotFoundError('Reply not found')
      }

      // 檢查權限
      if (reply.authorId !== req.user!.id) {
        throw new UnauthorizedError('Cannot delete this reply')
      }

      await replyRepo.delete(replyId)

      return {
        success: true,
        data: { message: 'Reply deleted successfully' }
      }
    })
  )

  // 點讚回覆
  router.post(
    '/replies/:id/like',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Reply ID is required')
      }
      const replyId = parseInt(id)

      if (isNaN(replyId)) {
        throw new ValidationError('Invalid reply ID')
      }

      const reply = await replyRepo.findById(replyId)
      if (!reply) {
        throw new NotFoundError('Reply not found')
      }

      await replyRepo.incrementLikes(replyId)

      return {
        success: true,
        data: { message: 'Reply liked successfully' }
      }
    })
  )
}
