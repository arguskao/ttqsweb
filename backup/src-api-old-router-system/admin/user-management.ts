/**
 * 用戶管理 API
 * 管理員專用的用戶管理功能
 */

import { requireAdmin, requireHigherRole, type AuthenticatedRequest } from '../auth-middleware'
import { query } from '../database'
import type { UserType } from '../types'

// 獲取所有用戶列表
export async function getUsers(req: AuthenticatedRequest): Promise<any> {
  try {
    requireAdmin(req)

    const { page = 1, limit = 20, userType, search } = req.query as any
    const offset = (Number(page) - 1) * Number(limit)

    let queryText = `
      SELECT 
        id, email, user_type, first_name, last_name, phone,
        created_at, updated_at, is_active,
        (first_name || ' ' || last_name) as full_name
      FROM users 
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramIndex = 1

    if (userType) {
      queryText += ` AND user_type = $${paramIndex}`
      queryParams.push(userType)
      paramIndex++
    }

    if (search) {
      queryText += ` AND (
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex}
      )`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(Number(limit), offset)

    const users = await query(queryText, queryParams)

    // 獲取總數
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
    const countParams: any[] = []
    let countParamIndex = 1

    if (userType) {
      countQuery += ` AND user_type = $${countParamIndex}`
      countParams.push(userType)
      countParamIndex++
    }

    if (search) {
      countQuery += ` AND (
        first_name ILIKE $${countParamIndex} OR 
        last_name ILIKE $${countParamIndex} OR 
        email ILIKE $${countParamIndex}
      )`
      countParams.push(`%${search}%`)
    }

    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult[0]?.total || '0')

    return {
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '獲取用戶列表失敗'
    }
  }
}

// 獲取用戶詳情
export async function getUserById(req: AuthenticatedRequest): Promise<any> {
  try {
    requireAdmin(req)

    const userId = parseInt((req.params as any).id)
    const users = await query(
      `SELECT 
        id, email, user_type, first_name, last_name, phone,
        created_at, updated_at, is_active
      FROM users 
      WHERE id = $1`,
      [userId]
    )

    if (users.length === 0) {
      return {
        success: false,
        message: '用戶不存在'
      }
    }

    return {
      success: true,
      data: users[0]
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '獲取用戶詳情失敗'
    }
  }
}

// 更新用戶角色
export async function updateUserRole(req: AuthenticatedRequest): Promise<any> {
  try {
    const currentUser = requireAdmin(req)
    const userId = parseInt((req.params as any).id)
    const { userType } = req.body as { userType: UserType }

    // 檢查新角色是否有效
    if (!['admin', 'instructor', 'employer', 'job_seeker'].includes(userType)) {
      return {
        success: false,
        message: '無效的用戶角色'
      }
    }

    // 獲取目標用戶信息
    const targetUsers = await query('SELECT user_type FROM users WHERE id = $1', [userId])

    if (targetUsers.length === 0) {
      return {
        success: false,
        message: '用戶不存在'
      }
    }

    const targetUserType = targetUsers[0].user_type as UserType

    // 檢查權限：只有更高層級的用戶才能修改角色
    requireHigherRole(req, targetUserType)

    // 防止降級自己的權限
    if (userId === currentUser.id && userType !== 'admin') {
      return {
        success: false,
        message: '不能降級自己的管理員權限'
      }
    }

    // 更新用戶角色
    await query('UPDATE users SET user_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      userType,
      userId
    ])

    return {
      success: true,
      message: '用戶角色更新成功'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新用戶角色失敗'
    }
  }
}

// 啟用/停用用戶
export async function updateUserStatus(req: AuthenticatedRequest): Promise<any> {
  try {
    const currentUser = requireAdmin(req)
    const userId = parseInt((req.params as any).id)
    const { isActive } = req.body as { isActive: boolean }

    // 防止停用自己的帳號
    if (userId === currentUser.id && !isActive) {
      return {
        success: false,
        message: '不能停用自己的帳號'
      }
    }

    await query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      isActive,
      userId
    ])

    return {
      success: true,
      message: `用戶已${isActive ? '啟用' : '停用'}`
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新用戶狀態失敗'
    }
  }
}

// 刪除用戶
export async function deleteUser(req: AuthenticatedRequest): Promise<any> {
  try {
    const currentUser = requireAdmin(req)
    const userId = parseInt((req.params as any).id)

    // 防止刪除自己的帳號
    if (userId === currentUser.id) {
      return {
        success: false,
        message: '不能刪除自己的帳號'
      }
    }

    // 獲取目標用戶信息
    const targetUsers = await query('SELECT user_type FROM users WHERE id = $1', [userId])

    if (targetUsers.length === 0) {
      return {
        success: false,
        message: '用戶不存在'
      }
    }

    const targetUserType = targetUsers[0].user_type as UserType
    requireHigherRole(req, targetUserType)

    // 軟刪除：設為非活躍狀態
    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    )

    return {
      success: true,
      message: '用戶已刪除'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '刪除用戶失敗'
    }
  }
}

// 獲取用戶統計
export async function getUserStats(req: AuthenticatedRequest): Promise<any> {
  try {
    requireAdmin(req)

    const stats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN user_type = 'instructor' THEN 1 END) as instructor_count,
        COUNT(CASE WHEN user_type = 'employer' THEN 1 END) as employer_count,
        COUNT(CASE WHEN user_type = 'job_seeker' THEN 1 END) as job_seeker_count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `)

    return {
      success: true,
      data: stats[0]
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '獲取用戶統計失敗'
    }
  }
}
