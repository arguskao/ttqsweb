/**
 * 群組管理路由
 * 處理學生群組的創建、更新、刪除等操作
 */

import { validateIntParam } from '../../utils/param-validation'
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors'
import { withAuth } from '../middleware-helpers'
import type { ApiRouter } from '../router'
import type { ApiRequest, ApiResponse } from '../types'

import { StudentGroupRepository, GroupMemberRepository } from './repositories'
import type { CreateGroupRequest, UpdateGroupRequest, GroupRole } from './types'

// Repository實例
const groupRepo = new StudentGroupRepository()
const memberRepo = new GroupMemberRepository()

export function setupGroupRoutes(router: ApiRouter): void {
  // 獲取所有群組
  router.get('/api/v1/groups', async (req: ApiRequest): Promise<ApiResponse> => {
    const query = req.query as Record<string, string | string[] | undefined>
    const { groupType, search, page = '1', limit = '12' } = query

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 12

    let groups
    if (search) {
      groups = await groupRepo.searchGroups(search as string)
    } else if (groupType) {
      groups = await groupRepo.findByType(groupType as string)
    } else {
      groups = await groupRepo.getActiveGroups()
    }

    // 手動分頁
    const total = groups.length
    const totalPages = Math.ceil(total / limitNum)
    const offset = (pageNum - 1) * limitNum
    const paginatedGroups = groups.slice(offset, offset + limitNum)

    return {
      success: true,
      data: paginatedGroups,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    }
  })

  // 獲取群組詳情
  router.get('/api/v1/groups/:id', async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      const params = req.params as Record<string, string>
      const { id } = params

      console.log('群組詳情API - 收到參數:', { id, params })

      const groupId = validateIntParam(id, 'id')
      console.log('群組詳情API - 解析後的ID:', groupId)

      const group = await groupRepo.findById(groupId)
      console.log('群組詳情API - 查詢結果:', group)

      if (!group) {
        throw new NotFoundError('Group not found')
      }

      // 獲取群組成員
      const members = await memberRepo.findByGroup(groupId)
      console.log('群組詳情API - 成員列表:', members)

      const response = {
        success: true,
        data: {
          ...group,
          members
        }
      }

      console.log('群組詳情API - 最終響應:', response)
      return response
    } catch (error) {
      console.error('群組詳情API - 錯誤:', error)
      throw error
    }
  })

  // 創建群組
  router.post(
    '/api/v1/groups',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const { name, description, groupType, maxMembers, isPublic }: CreateGroupRequest =
        req.body as CreateGroupRequest

      if (!name || !description || !groupType) {
        throw new ValidationError('Name, description, and group type are required')
      }

      const groupData = {
        name,
        description,
        groupType,
        maxMembers: maxMembers || 50,
        isPublic: isPublic ?? true,
        createdBy: req.user!.id,
        memberCount: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const group = await groupRepo.create(groupData)

      // 將創建者設為管理員
      const memberData = {
        groupId: group.id,
        userId: req.user!.id,
        role: 'admin' as GroupRole,
        joinedAt: new Date()
      }

      await memberRepo.create(memberData)

      return {
        success: true,
        data: group
      }
    })
  )

  // 更新群組
  router.put(
    '/api/v1/groups/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const groupId = validateIntParam(id, 'id')
      const { name, description, groupType, maxMembers, isPublic }: UpdateGroupRequest =
        req.body as UpdateGroupRequest

      if (isNaN(groupId)) {
        throw new ValidationError('Invalid group ID')
      }

      const group = await groupRepo.findById(groupId)
      if (!group) {
        throw new NotFoundError('Group not found')
      }

      // 檢查權限
      const membership = await memberRepo.findByUserAndGroup(req.user!.id, groupId)
      if (membership?.role !== 'admin') {
        throw new UnauthorizedError('Only group admins can update group settings')
      }

      const updateData = {
        name: name || group.name,
        description: description || group.description,
        groupType: groupType || group.groupType,
        maxMembers: maxMembers || group.maxMembers,
        isPublic: isPublic !== undefined ? isPublic : group.isPublic,
        updatedAt: new Date()
      }

      const updatedGroup = await groupRepo.update(groupId, updateData)

      return {
        success: true,
        data: updatedGroup
      }
    })
  )

  // 刪除群組
  router.delete(
    '/api/v1/groups/:id',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const groupId = validateIntParam(id, 'id')

      const group = await groupRepo.findById(groupId)
      if (!group) {
        throw new NotFoundError('Group not found')
      }

      // 檢查權限
      const membership = await memberRepo.findByUserAndGroup(req.user!.id, groupId)
      if (membership?.role !== 'admin') {
        throw new UnauthorizedError('Only group admins can delete the group')
      }

      await groupRepo.delete(groupId)

      return {
        success: true,
        data: { message: 'Group deleted successfully' }
      }
    })
  )

  // 加入群組
  router.post(
    '/api/v1/groups/:id/join',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const groupId = validateIntParam(id, 'id')

      const group = await groupRepo.findById(groupId)
      if (!group) {
        throw new NotFoundError('Group not found')
      }

      // 檢查是否已經是成員
      const existingMembership = await memberRepo.findByUserAndGroup(req.user!.id, groupId)
      if (existingMembership) {
        throw new ValidationError('Already a member of this group')
      }

      // 檢查群組是否已滿
      if (group.maxMembers && group.memberCount >= group.maxMembers) {
        throw new ValidationError('Group is full')
      }

      const memberData = {
        groupId,
        userId: req.user!.id,
        role: 'member' as GroupRole,
        joinedAt: new Date()
      }

      const member = await memberRepo.create(memberData)

      // 更新群組成員數量
      await groupRepo.incrementMemberCount(groupId)

      return {
        success: true,
        data: member
      }
    })
  )

  // 離開群組
  router.delete(
    '/api/v1/groups/:id/leave',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id } = params
      const groupId = validateIntParam(id, 'id')

      const membership = await memberRepo.findByUserAndGroup(req.user!.id, groupId)
      if (!membership) {
        throw new NotFoundError('Not a member of this group')
      }

      // 檢查是否為管理員
      if (membership.role === 'admin') {
        throw new ValidationError('Admins cannot leave the group. Transfer admin role first.')
      }

      await memberRepo.delete(membership.id)

      // 更新群組成員數量
      await groupRepo.decrementMemberCount(groupId)

      return {
        success: true,
        data: { message: 'Left group successfully' }
      }
    })
  )

  // 更新成員角色
  router.put(
    '/api/v1/groups/:id/members/:userId/role',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id, userId } = params
      const groupId = validateIntParam(id, 'id')
      const targetUserId = validateIntParam(userId, 'userId')
      const { role } = req.body as { role: GroupRole }

      if (!role) {
        throw new ValidationError('Role is required')
      }

      // 檢查操作者權限
      const operatorMembership = await memberRepo.findByUserAndGroup(req.user!.id, groupId)
      if (operatorMembership?.role !== 'admin') {
        throw new UnauthorizedError('Only group admins can change member roles')
      }

      // 檢查目標成員
      const targetMembership = await memberRepo.findByUserAndGroup(targetUserId, groupId)
      if (!targetMembership) {
        throw new NotFoundError('User is not a member of this group')
      }

      const updateData = {
        role,
        updatedAt: new Date()
      }

      const updatedMember = await memberRepo.update(targetMembership.id, updateData)

      return {
        success: true,
        data: updatedMember
      }
    })
  )

  // 移除成員
  router.delete(
    '/api/v1/groups/:id/members/:userId',
    withAuth(async (req: ApiRequest): Promise<ApiResponse> => {
      const params = req.params as Record<string, string>
      const { id, userId } = params
      const groupId = validateIntParam(id, 'id')
      const targetUserId = validateIntParam(userId, 'userId')

      // 檢查操作者權限
      const operatorMembership = await memberRepo.findByUserAndGroup(req.user!.id, groupId)
      if (operatorMembership?.role !== 'admin') {
        throw new UnauthorizedError('Only group admins can remove members')
      }

      // 檢查目標成員
      const targetMembership = await memberRepo.findByUserAndGroup(targetUserId, groupId)
      if (!targetMembership) {
        throw new NotFoundError('User is not a member of this group')
      }

      await memberRepo.delete(targetMembership.id)

      // 更新群組成員數量
      await groupRepo.decrementMemberCount(groupId)

      return {
        success: true,
        data: { message: 'Member removed successfully' }
      }
    })
  )
}
