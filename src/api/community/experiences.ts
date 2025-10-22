/**
 * 經驗分享路由
 * 處理經驗分享和評論的創建、更新、刪除等操作
 */

import { ValidationError, NotFoundError, UnauthorizedError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { ExperienceShareRepository, ExperienceCommentRepository } from './repositories'
import type { CreateExperienceRequest, CreateCommentRequest, ExperienceCategory } from './types'

// Repository實例
const experienceRepo = new ExperienceShareRepository()
const commentRepo = new ExperienceCommentRepository()

export function setupExperienceRoutes(router: ApiRouter): void {
  // 獲取所有公開的經驗分享
  router.get('/experiences', async (req: ApiRequest): Promise<ApiResponse> => {
    const query = req.query as Record<string, string | string[] | undefined>
    const { category, tags, search } = query

    let experiences
    if (search) {
      experiences = await experienceRepo.searchExperiences(search as string)
    } else if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags as string]
      experiences = await experienceRepo.findByTags(tagArray)
    } else if (category) {
      experiences = await experienceRepo.findByCategory(category as string)
    } else {
      experiences = await experienceRepo.findPublic()
    }

    return {
      success: true,
      data: experiences
    }
  })

  // 獲取經驗分享詳情
  router.get('/experiences/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    const params = req.params as Record<string, string>
    const { id } = params
    if (!id) {
      throw new ValidationError('Experience ID is required')
    }
    const experienceId = parseInt(id)

    if (isNaN(experienceId)) {
      throw new ValidationError('Invalid experience ID')
    }

    const experience = await experienceRepo.findById(experienceId)
    if (!experience) {
      throw new NotFoundError('Experience not found')
    }

    // 所有經驗分享都是公開的，無需權限檢查

    // 增加瀏覽次數
    await experienceRepo.incrementViews(experienceId)

    // 獲取評論
    const comments = await commentRepo.findByExperience(experienceId)

    return {
      success: true,
      data: {
        ...experience,
        comments
      }
    }
  })

  // 創建經驗分享
  router.post(
    '/experiences',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const { title, content, share_type, tags, is_featured }: CreateExperienceRequest =
        req.body as CreateExperienceRequest

      if (!title || !content || !share_type) {
        throw new ValidationError('Title, content, and share_type are required')
      }

      const experienceData = {
        title,
        content,
        share_type: share_type as ExperienceCategory,
        tags: tags ?? [],
        is_featured: is_featured ?? false,
        author_id: req.user!.id,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }

      const experience = await experienceRepo.create(experienceData)

      return {
        success: true,
        data: experience
      }
    })
  )

  // 更新經驗分享
  router.put(
    '/experiences/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Experience ID is required')
      }
      const experienceId = parseInt(id)
      const { title, content, share_type, tags, is_featured } = req.body as CreateExperienceRequest

      if (isNaN(experienceId)) {
        throw new ValidationError('Invalid experience ID')
      }

      const experience = await experienceRepo.findById(experienceId)
      if (!experience) {
        throw new NotFoundError('Experience not found')
      }

      // 檢查權限
      if (experience.author_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this experience')
      }

      const updateData = {
        title: title || experience.title,
        content: content || experience.content,
        share_type: share_type || experience.share_type,
        tags: tags || experience.tags,
        is_featured: is_featured !== undefined ? is_featured : experience.is_featured,
        updated_at: new Date()
      }

      const updatedExperience = await experienceRepo.update(experienceId, updateData)

      return {
        success: true,
        data: updatedExperience
      }
    })
  )

  // 刪除經驗分享
  router.delete(
    '/experiences/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Experience ID is required')
      }
      const experienceId = parseInt(id)

      if (isNaN(experienceId)) {
        throw new ValidationError('Invalid experience ID')
      }

      const experience = await experienceRepo.findById(experienceId)
      if (!experience) {
        throw new NotFoundError('Experience not found')
      }

      // 檢查權限
      if (experience.author_id !== req.user!.id) {
        throw new UnauthorizedError('Cannot delete this experience')
      }

      await experienceRepo.delete(experienceId)

      return {
        success: true,
        data: { message: 'Experience deleted successfully' }
      }
    })
  )

  // 點讚經驗分享
  router.post(
    '/experiences/:id/like',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Experience ID is required')
      }
      const experienceId = parseInt(id)

      if (isNaN(experienceId)) {
        throw new ValidationError('Invalid experience ID')
      }

      const experience = await experienceRepo.findById(experienceId)
      if (!experience) {
        throw new NotFoundError('Experience not found')
      }

      await experienceRepo.incrementLikes(experienceId)

      return {
        success: true,
        data: { message: 'Experience liked successfully' }
      }
    })
  )

  // 創建評論
  router.post(
    '/experiences/:id/comments',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Experience ID is required')
      }
      const experienceId = parseInt(id)
      const { content }: CreateCommentRequest = req.body as CreateCommentRequest

      if (isNaN(experienceId)) {
        throw new ValidationError('Invalid experience ID')
      }

      if (!content) {
        throw new ValidationError('Content is required')
      }

      const experience = await experienceRepo.findById(experienceId)
      if (!experience) {
        throw new NotFoundError('Experience not found')
      }

      const commentData = {
        content,
        experienceId,
        userId: req.user!.id,
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const comment = await commentRepo.create(commentData)

      return {
        success: true,
        data: comment
      }
    })
  )

  // 更新評論
  router.put(
    '/comments/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Comment ID is required')
      }
      const commentId = parseInt(id)
      const { content } = req.body as CreateCommentRequest

      if (isNaN(commentId)) {
        throw new ValidationError('Invalid comment ID')
      }

      if (!content) {
        throw new ValidationError('Content is required')
      }

      const comment = await commentRepo.findById(commentId)
      if (!comment) {
        throw new NotFoundError('Comment not found')
      }

      // 檢查權限
      if (comment.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot update this comment')
      }

      const updateData = {
        content,
        updatedAt: new Date()
      }

      const updatedComment = await commentRepo.update(commentId, updateData)

      return {
        success: true,
        data: updatedComment
      }
    })
  )

  // 刪除評論
  router.delete(
    '/comments/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Comment ID is required')
      }
      const commentId = parseInt(id)

      if (isNaN(commentId)) {
        throw new ValidationError('Invalid comment ID')
      }

      const comment = await commentRepo.findById(commentId)
      if (!comment) {
        throw new NotFoundError('Comment not found')
      }

      // 檢查權限
      if (comment.userId !== req.user!.id) {
        throw new UnauthorizedError('Cannot delete this comment')
      }

      await commentRepo.delete(commentId)

      return {
        success: true,
        data: { message: 'Comment deleted successfully' }
      }
    })
  )

  // 點讚評論
  router.post(
    '/comments/:id/like',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      if (!id) {
        throw new ValidationError('Comment ID is required')
      }
      const commentId = parseInt(id)

      if (isNaN(commentId)) {
        throw new ValidationError('Invalid comment ID')
      }

      const comment = await commentRepo.findById(commentId)
      if (!comment) {
        throw new NotFoundError('Comment not found')
      }

      await commentRepo.incrementLikes(commentId)

      return {
        success: true,
        data: { message: 'Comment liked successfully' }
      }
    })
  )
}
