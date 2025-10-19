// community-routes.ts
// 社群與學員交流系統 API 路由

import type { ApiRouter } from './router'
import type { ApiRequest, ApiResponse, PaginationOptions } from './types'
import { BaseRepository } from './database'
import { ValidationError, NotFoundError, UnauthorizedError } from './errors'
import { requireAuth } from './auth-middleware'

// 資料類型定義
interface StudentGroup {
    id: number
    name: string
    description: string
    groupType: 'course' | 'interest' | 'alumni' | 'study'
    createdBy: number
    isActive: boolean
    memberCount: number
    createdAt: Date
    updatedAt: Date
}

interface GroupMember {
    id: number
    groupId: number
    userId: number
    role: 'admin' | 'moderator' | 'member'
    joinedAt: Date
}

interface ForumTopic {
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

interface ForumReply {
    id: number
    topicId: number
    authorId: number
    content: string
    parentReplyId: number | null
    isSolution: boolean
    likeCount: number
    createdAt: Date
    updatedAt: Date
}

interface ExperienceShare {
    id: number
    authorId: number
    title: string
    content: string
    shareType: 'job_experience' | 'learning_tips' | 'interview' | 'career_advice' | 'success_story'
    tags: string[]
    likeCount: number
    commentCount: number
    viewCount: number
    isFeatured: boolean
    createdAt: Date
    updatedAt: Date
}

interface ExperienceComment {
    id: number
    shareId: number
    authorId: number
    content: string
    parentCommentId: number | null
    createdAt: Date
}

// Repository 類別
class StudentGroupRepository extends BaseRepository<StudentGroup> {
    constructor() {
        super('student_groups')
    }

    async findByMember(userId: number): Promise<StudentGroup[]> {
        const result = await this.executeQuery<StudentGroup>(`
            SELECT sg.* FROM student_groups sg
            INNER JOIN group_members gm ON sg.id = gm.group_id
            WHERE gm.user_id = $1 AND sg.is_active = true
            ORDER BY sg.created_at DESC
        `, [userId])
        return result
    }

    async incrementMemberCount(groupId: number): Promise<void> {
        await this.executeQuery(`
            UPDATE student_groups 
            SET member_count = member_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [groupId])
    }

    async decrementMemberCount(groupId: number): Promise<void> {
        await this.executeQuery(`
            UPDATE student_groups 
            SET member_count = GREATEST(member_count - 1, 0), updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [groupId])
    }

    private async executeQuery<T>(query: string, values: any[]): Promise<T[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<T>({ text: query, values })
    }
}

class GroupMemberRepository extends BaseRepository<GroupMember> {
    constructor() {
        super('group_members')
    }

    async isMember(groupId: number, userId: number): Promise<boolean> {
        const { db } = await import('../utils/database')
        const result = await db.queryOne<{ exists: boolean }>({
            text: 'SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2)',
            values: [groupId, userId]
        })
        return result?.exists || false
    }

    async getMemberRole(groupId: number, userId: number): Promise<string | null> {
        const { db } = await import('../utils/database')
        const result = await db.queryOne<{ role: string }>({
            text: 'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            values: [groupId, userId]
        })
        return result?.role || null
    }
}

class ForumTopicRepository extends BaseRepository<ForumTopic> {
    constructor() {
        super('forum_topics')
    }

    async findByGroup(groupId: number, options: PaginationOptions = {}): Promise<ForumTopic[]> {
        const { page = 1, limit = 20 } = options
        const offset = (page - 1) * limit

        const { db } = await import('../utils/database')
        return await db.queryMany<ForumTopic>({
            text: `
                SELECT * FROM forum_topics 
                WHERE group_id = $1 
                ORDER BY is_pinned DESC, last_reply_at DESC NULLS LAST, created_at DESC
                LIMIT $2 OFFSET $3
            `,
            values: [groupId, limit, offset]
        })
    }

    async incrementViewCount(topicId: number): Promise<void> {
        const { db } = await import('../utils/database')
        await db.query({
            text: 'UPDATE forum_topics SET view_count = view_count + 1 WHERE id = $1',
            values: [topicId]
        })
    }

    async incrementReplyCount(topicId: number): Promise<void> {
        const { db } = await import('../utils/database')
        await db.query({
            text: `UPDATE forum_topics 
                   SET reply_count = reply_count + 1, 
                       last_reply_at = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $1`,
            values: [topicId]
        })
    }
}

class ForumReplyRepository extends BaseRepository<ForumReply> {
    constructor() {
        super('forum_replies')
    }

    async findByTopic(topicId: number): Promise<ForumReply[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<ForumReply>({
            text: 'SELECT * FROM forum_replies WHERE topic_id = $1 ORDER BY created_at ASC',
            values: [topicId]
        })
    }
}

class ExperienceShareRepository extends BaseRepository<ExperienceShare> {
    constructor() {
        super('experience_shares')
    }

    async findFeatured(limit: number = 10): Promise<ExperienceShare[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<ExperienceShare>({
            text: `SELECT * FROM experience_shares 
                   WHERE is_featured = true 
                   ORDER BY created_at DESC 
                   LIMIT $1`,
            values: [limit]
        })
    }

    async incrementViewCount(shareId: number): Promise<void> {
        const { db } = await import('../utils/database')
        await db.query({
            text: 'UPDATE experience_shares SET view_count = view_count + 1 WHERE id = $1',
            values: [shareId]
        })
    }

    async incrementLikeCount(shareId: number): Promise<void> {
        const { db } = await import('../utils/database')
        await db.query({
            text: 'UPDATE experience_shares SET like_count = like_count + 1 WHERE id = $1',
            values: [shareId]
        })
    }

    async incrementCommentCount(shareId: number): Promise<void> {
        const { db } = await import('../utils/database')
        await db.query({
            text: 'UPDATE experience_shares SET comment_count = comment_count + 1 WHERE id = $1',
            values: [shareId]
        })
    }
}

class ExperienceCommentRepository extends BaseRepository<ExperienceComment> {
    constructor() {
        super('experience_comments')
    }

    async findByShare(shareId: number): Promise<ExperienceComment[]> {
        const { db } = await import('../utils/database')
        return await db.queryMany<ExperienceComment>({
            text: 'SELECT * FROM experience_comments WHERE share_id = $1 ORDER BY created_at ASC',
            values: [shareId]
        })
    }
}

// Repository 實例
const groupRepo = new StudentGroupRepository()
const memberRepo = new GroupMemberRepository()
const topicRepo = new ForumTopicRepository()
const replyRepo = new ForumReplyRepository()
const shareRepo = new ExperienceShareRepository()
const commentRepo = new ExperienceCommentRepository()

// Setup community routes
export function setupCommunityRoutes(router: ApiRouter): void {
    // ===== 學員群組 API =====

    // 獲取所有群組列表
    router.get('/api/v1/groups', async (req: ApiRequest): Promise<ApiResponse> => {
        const { page = 1, limit = 20 } = req.query || {}

        const result = await groupRepo.findPaginated({
            page: Number(page),
            limit: Number(limit),
            sortBy: 'created_at',
            sortOrder: 'DESC'
        })

        return {
            success: true,
            data: result.data,
            meta: result.meta
        }
    })

    // 獲取用戶加入的群組
    router.get('/api/v1/groups/my-groups', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const groups = await groupRepo.findByMember(req.user.id)

        return {
            success: true,
            data: groups
        }
    }, [requireAuth])

    // 創建新群組
    router.post('/api/v1/groups', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const { name, description, groupType } = req.body as any

        if (!name || !groupType) {
            throw new ValidationError('群組名稱和類型為必填項')
        }

        const group = await groupRepo.create({
            name,
            description,
            groupType,
            createdBy: req.user.id,
            isActive: true,
            memberCount: 1
        } as any)

        // 自動將創建者加入群組並設為管理員
        await memberRepo.create({
            groupId: group.id,
            userId: req.user.id,
            role: 'admin'
        } as any)

        return {
            success: true,
            data: group
        }
    }, [requireAuth])

    // 加入群組
    router.post('/api/v1/groups/:id/join', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const groupId = Number(req.params?.id)

        // 檢查群組是否存在
        const group = await groupRepo.findById(groupId)
        if (!group) {
            throw new NotFoundError('群組不存在')
        }

        // 檢查是否已經是成員
        const isMember = await memberRepo.isMember(groupId, req.user.id)
        if (isMember) {
            throw new ValidationError('您已經是該群組成員')
        }

        // 加入群組
        await memberRepo.create({
            groupId,
            userId: req.user.id,
            role: 'member'
        } as any)

        // 更新群組成員數
        await groupRepo.incrementMemberCount(groupId)

        return {
            success: true,
            data: { message: '成功加入群組' }
        }
    }, [requireAuth])

    // ===== 討論區 API =====

    // 獲取群組的討論主題列表
    router.get('/api/v1/groups/:id/topics', async (req: ApiRequest): Promise<ApiResponse> => {
        const groupId = Number(req.params?.id)
        const { page = 1, limit = 20 } = req.query || {}

        const topics = await topicRepo.findByGroup(groupId, {
            page: Number(page),
            limit: Number(limit)
        })

        return {
            success: true,
            data: topics
        }
    })

    // 創建討論主題
    router.post('/api/v1/groups/:id/topics', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const groupId = Number(req.params?.id)
        const { title, content, category } = req.body as any

        if (!title || !content) {
            throw new ValidationError('標題和內容為必填項')
        }

        // 檢查是否為群組成員
        const isMember = await memberRepo.isMember(groupId, req.user.id)
        if (!isMember) {
            throw new UnauthorizedError('您必須是群組成員才能發表主題')
        }

        const topic = await topicRepo.create({
            groupId,
            authorId: req.user.id,
            title,
            content,
            category,
            isPinned: false,
            isLocked: false,
            viewCount: 0,
            replyCount: 0
        } as any)

        return {
            success: true,
            data: topic
        }
    }, [requireAuth])

    // 獲取討論主題詳情
    router.get('/api/v1/topics/:id', async (req: ApiRequest): Promise<ApiResponse> => {
        const topicId = Number(req.params?.id)

        const topic = await topicRepo.findById(topicId)
        if (!topic) {
            throw new NotFoundError('討論主題不存在')
        }

        // 增加瀏覽次數
        await topicRepo.incrementViewCount(topicId)

        // 獲取回覆列表
        const replies = await replyRepo.findByTopic(topicId)

        return {
            success: true,
            data: {
                topic,
                replies
            }
        }
    })

    // 回覆討論主題
    router.post('/api/v1/topics/:id/replies', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const topicId = Number(req.params?.id)
        const { content, parentReplyId } = req.body as any

        if (!content) {
            throw new ValidationError('回覆內容為必填項')
        }

        const topic = await topicRepo.findById(topicId)
        if (!topic) {
            throw new NotFoundError('討論主題不存在')
        }

        if (topic.isLocked) {
            throw new ValidationError('該主題已被鎖定，無法回覆')
        }

        // 檢查是否為群組成員
        const isMember = await memberRepo.isMember(topic.groupId, req.user.id)
        if (!isMember) {
            throw new UnauthorizedError('您必須是群組成員才能回覆')
        }

        const reply = await replyRepo.create({
            topicId,
            authorId: req.user.id,
            content,
            parentReplyId: parentReplyId || null,
            isSolution: false,
            likeCount: 0
        } as any)

        // 更新主題回覆數
        await topicRepo.incrementReplyCount(topicId)

        return {
            success: true,
            data: reply
        }
    }, [requireAuth])

    // ===== 經驗分享 API =====

    // 獲取經驗分享列表
    router.get('/api/v1/experiences', async (req: ApiRequest): Promise<ApiResponse> => {
        const { page = 1, limit = 20, featured } = req.query || {}

        let result
        if (featured === 'true') {
            const data = await shareRepo.findFeatured(Number(limit))
            result = { data, meta: { page: 1, limit: Number(limit), total: data.length, totalPages: 1 } }
        } else {
            result = await shareRepo.findPaginated({
                page: Number(page),
                limit: Number(limit),
                sortBy: 'created_at',
                sortOrder: 'DESC'
            })
        }

        return {
            success: true,
            data: result.data,
            meta: result.meta
        }
    })

    // 創建經驗分享
    router.post('/api/v1/experiences', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const { title, content, shareType, tags } = req.body as any

        if (!title || !content || !shareType) {
            throw new ValidationError('標題、內容和分享類型為必填項')
        }

        const share = await shareRepo.create({
            authorId: req.user.id,
            title,
            content,
            shareType,
            tags: tags || [],
            likeCount: 0,
            commentCount: 0,
            viewCount: 0,
            isFeatured: false
        } as any)

        return {
            success: true,
            data: share
        }
    }, [requireAuth])

    // 獲取經驗分享詳情
    router.get('/api/v1/experiences/:id', async (req: ApiRequest): Promise<ApiResponse> => {
        const shareId = Number(req.params?.id)

        const share = await shareRepo.findById(shareId)
        if (!share) {
            throw new NotFoundError('經驗分享不存在')
        }

        // 增加瀏覽次數
        await shareRepo.incrementViewCount(shareId)

        // 獲取評論列表
        const comments = await commentRepo.findByShare(shareId)

        return {
            success: true,
            data: {
                share,
                comments
            }
        }
    })

    // 對經驗分享按讚
    router.post('/api/v1/experiences/:id/like', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const shareId = Number(req.params?.id)

        const share = await shareRepo.findById(shareId)
        if (!share) {
            throw new NotFoundError('經驗分享不存在')
        }

        await shareRepo.incrementLikeCount(shareId)

        return {
            success: true,
            data: { message: '按讚成功' }
        }
    }, [requireAuth])

    // 評論經驗分享
    router.post('/api/v1/experiences/:id/comments', async (req: ApiRequest): Promise<ApiResponse> => {
        if (!req.user) {
            throw new UnauthorizedError('請先登入')
        }

        const shareId = Number(req.params?.id)
        const { content, parentCommentId } = req.body as any

        if (!content) {
            throw new ValidationError('評論內容為必填項')
        }

        const share = await shareRepo.findById(shareId)
        if (!share) {
            throw new NotFoundError('經驗分享不存在')
        }

        const comment = await commentRepo.create({
            shareId,
            authorId: req.user.id,
            content,
            parentCommentId: parentCommentId || null
        } as any)

        // 更新分享的評論數
        await shareRepo.incrementCommentCount(shareId)

        return {
            success: true,
            data: comment
        }
    }, [requireAuth])
}
