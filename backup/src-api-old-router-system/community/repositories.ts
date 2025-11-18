/**
 * 社區功能Repository類別
 * 提供數據庫操作接口
 */

import { BaseRepository } from '../database'

import type {
  StudentGroup,
  GroupMember,
  ForumTopic,
  ForumReply,
  ExperienceShare,
  ExperienceComment
} from './types'

// 學生群組Repository
export class StudentGroupRepository extends BaseRepository<StudentGroup> {
  constructor() {
    super('student_groups')
  }

  async findByType(groupType: string): Promise<StudentGroup[]> {
    return this.queryMany(
      'SELECT * FROM student_groups WHERE group_type = $1 AND is_active = true ORDER BY created_at DESC',
      [groupType]
    )
  }

  async findByCreator(createdBy: number): Promise<StudentGroup[]> {
    return this.queryMany(
      'SELECT * FROM student_groups WHERE created_by = $1 ORDER BY created_at DESC',
      [createdBy]
    )
  }

  async searchGroups(searchTerm: string): Promise<StudentGroup[]> {
    return this.queryMany(
      'SELECT * FROM student_groups WHERE (name ILIKE $1 OR description ILIKE $1) AND is_active = true ORDER BY created_at DESC',
      [`%${searchTerm}%`]
    )
  }

  async updateMemberCount(groupId: number): Promise<void> {
    await this.executeRaw(
      'UPDATE student_groups SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = $1) WHERE id = $1',
      [groupId]
    )
  }

  async getActiveGroups(): Promise<StudentGroup[]> {
    return this.queryMany(
      'SELECT * FROM student_groups WHERE is_active = true ORDER BY member_count DESC, created_at DESC'
    )
  }

  async incrementMemberCount(groupId: number): Promise<void> {
    await this.executeRaw(
      'UPDATE student_groups SET member_count = member_count + 1 WHERE id = $1',
      [groupId]
    )
  }

  async decrementMemberCount(groupId: number): Promise<void> {
    await this.executeRaw(
      'UPDATE student_groups SET member_count = member_count - 1 WHERE id = $1',
      [groupId]
    )
  }
}

// 群組成員Repository
export class GroupMemberRepository extends BaseRepository<GroupMember> {
  constructor() {
    super('group_members')
  }

  async findByGroup(groupId: number): Promise<GroupMember[]> {
    return this.queryMany(
      'SELECT * FROM group_members WHERE group_id = $1 ORDER BY joined_at ASC',
      [groupId]
    )
  }

  async findByUser(userId: number): Promise<GroupMember[]> {
    return this.queryMany(
      'SELECT * FROM group_members WHERE user_id = $1 ORDER BY joined_at DESC',
      [userId]
    )
  }

  async findMember(groupId: number, userId: number): Promise<GroupMember | null> {
    return this.queryOne('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [
      groupId,
      userId
    ])
  }

  async updateRole(groupId: number, userId: number, role: string): Promise<void> {
    await this.executeRaw(
      'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3',
      [role, groupId, userId]
    )
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    await this.executeRaw('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [
      groupId,
      userId
    ])
  }

  async findByUserAndGroup(userId: number, groupId: number): Promise<GroupMember | null> {
    return this.queryOne('SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2', [
      userId,
      groupId
    ])
  }
}

// 論壇主題Repository
export class ForumTopicRepository extends BaseRepository<ForumTopic> {
  constructor() {
    super('forum_topics')
  }

  async findByGroup(groupId: number): Promise<ForumTopic[]> {
    return this.queryMany(
      'SELECT * FROM forum_topics WHERE group_id = $1 ORDER BY is_pinned DESC, last_reply_at DESC, created_at DESC',
      [groupId]
    )
  }

  async findByAuthor(authorId: number): Promise<ForumTopic[]> {
    return this.queryMany(
      'SELECT * FROM forum_topics WHERE author_id = $1 ORDER BY created_at DESC',
      [authorId]
    )
  }

  async findByCategory(groupId: number, category: string): Promise<ForumTopic[]> {
    return this.queryMany(
      'SELECT * FROM forum_topics WHERE group_id = $1 AND category = $2 ORDER BY is_pinned DESC, created_at DESC',
      [groupId, category]
    )
  }

  async searchTopics(searchTerm: string): Promise<ForumTopic[]> {
    return this.queryMany(
      'SELECT * FROM forum_topics WHERE (title ILIKE $1 OR content ILIKE $1) ORDER BY created_at DESC',
      [`%${searchTerm}%`]
    )
  }

  async updateReplyCount(topicId: number): Promise<void> {
    await this.executeRaw(
      'UPDATE forum_topics SET reply_count = (SELECT COUNT(*) FROM forum_replies WHERE topic_id = $1) WHERE id = $1',
      [topicId]
    )
  }

  async updateLastReply(topicId: number): Promise<void> {
    await this.executeRaw(
      'UPDATE forum_topics SET last_reply_at = (SELECT MAX(created_at) FROM forum_replies WHERE topic_id = $1) WHERE id = $1',
      [topicId]
    )
  }

  async incrementViewCount(topicId: number): Promise<void> {
    await this.executeRaw('UPDATE forum_topics SET view_count = view_count + 1 WHERE id = $1', [
      topicId
    ])
  }

  // 別名方法，保持向後兼容
  async incrementViews(topicId: number): Promise<void> {
    return this.incrementViewCount(topicId)
  }

  async incrementLikes(topicId: number): Promise<void> {
    await this.executeRaw('UPDATE forum_topics SET likes = likes + 1 WHERE id = $1', [topicId])
  }
}

// 論壇回覆Repository
export class ForumReplyRepository extends BaseRepository<ForumReply> {
  constructor() {
    super('forum_replies')
  }

  async findByTopic(topicId: number): Promise<ForumReply[]> {
    return this.queryMany(
      'SELECT * FROM forum_replies WHERE topic_id = $1 ORDER BY created_at ASC',
      [topicId]
    )
  }

  async findByAuthor(authorId: number): Promise<ForumReply[]> {
    return this.queryMany(
      'SELECT * FROM forum_replies WHERE author_id = $1 ORDER BY created_at DESC',
      [authorId]
    )
  }

  async getReplyCount(topicId: number): Promise<number> {
    const result = await this.queryOne(
      'SELECT COUNT(*) as count FROM forum_replies WHERE topic_id = $1',
      [topicId]
    )
    return parseInt(result?.count || '0')
  }

  async incrementLikes(replyId: number): Promise<void> {
    await this.executeRaw('UPDATE forum_replies SET likes = likes + 1 WHERE id = $1', [replyId])
  }
}

// 經驗分享Repository
export class ExperienceShareRepository extends BaseRepository<ExperienceShare> {
  constructor() {
    super('experience_shares')
  }

  async findByUser(userId: number): Promise<ExperienceShare[]> {
    return this.queryMany(
      'SELECT * FROM experience_shares WHERE author_id = $1 ORDER BY created_at DESC',
      [userId]
    )
  }

  async findByCategory(category: string): Promise<ExperienceShare[]> {
    return this.queryMany(
      'SELECT * FROM experience_shares WHERE share_type = $1 ORDER BY created_at DESC',
      [category]
    )
  }

  async findPublic(): Promise<ExperienceShare[]> {
    return this.queryMany(
      'SELECT * FROM experience_shares ORDER BY created_at DESC'
    )
  }

  async searchExperiences(searchTerm: string): Promise<ExperienceShare[]> {
    return this.queryMany(
      'SELECT * FROM experience_shares WHERE (title ILIKE $1 OR content ILIKE $1) ORDER BY created_at DESC',
      [`%${searchTerm}%`]
    )
  }

  async findByTags(tags: string[]): Promise<ExperienceShare[]> {
    if (tags.length === 0) return []

    const tagConditions = tags.map((_, index) => `tags @> $${index + 1}`).join(' OR ')
    return this.queryMany(
      `SELECT * FROM experience_shares WHERE (${tagConditions}) ORDER BY created_at DESC`,
      tags
    )
  }

  async incrementViews(experienceId: number): Promise<void> {
    await this.executeRaw('UPDATE experience_shares SET view_count = view_count + 1 WHERE id = $1', [
      experienceId
    ])
  }

  async incrementLikes(experienceId: number): Promise<void> {
    await this.executeRaw('UPDATE experience_shares SET like_count = like_count + 1 WHERE id = $1', [
      experienceId
    ])
  }
}

// 經驗評論Repository
export class ExperienceCommentRepository extends BaseRepository<ExperienceComment> {
  constructor() {
    super('experience_comments')
  }

  async findByExperience(experienceId: number): Promise<ExperienceComment[]> {
    return this.queryMany(
      'SELECT * FROM experience_comments WHERE experience_id = $1 ORDER BY created_at ASC',
      [experienceId]
    )
  }

  async findByUser(userId: number): Promise<ExperienceComment[]> {
    return this.queryMany(
      'SELECT * FROM experience_comments WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
  }

  async getCommentCount(experienceId: number): Promise<number> {
    const result = await this.queryOne(
      'SELECT COUNT(*) as count FROM experience_comments WHERE experience_id = $1',
      [experienceId]
    )
    return parseInt(result?.count || '0')
  }

  async incrementLikes(commentId: number): Promise<void> {
    await this.executeRaw('UPDATE experience_comments SET likes = likes + 1 WHERE id = $1', [
      commentId
    ])
  }
}
