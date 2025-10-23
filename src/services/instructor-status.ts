/**
 * 講師狀態檢查服務
 * 檢查用戶是否為已通過審核的講師
 */

import { api } from '@/services/api'

export interface InstructorStatus {
  isApprovedInstructor: boolean
  applicationStatus?: 'pending' | 'approved' | 'rejected'
  instructorId?: number
}

export class InstructorStatusService {
  /**
   * 檢查用戶是否為已通過審核的講師
   */
  static async checkInstructorStatus(userId: number): Promise<InstructorStatus> {
    try {
      // 檢查講師申請狀態
      const response = await api.get(`/users/${userId}/instructor-application`)

      if (response.data?.success && response.data?.data) {
        const application = response.data.data
        return {
          isApprovedInstructor: application.status === 'approved',
          applicationStatus: application.status,
          instructorId: application.id
        }
      }

      // 如果沒有申請記錄，返回未通過狀態
      return {
        isApprovedInstructor: false,
        applicationStatus: undefined
      }
    } catch (error) {
      console.error('檢查講師狀態失敗:', error)

      // 發生錯誤時返回未通過狀態
      return {
        isApprovedInstructor: false,
        applicationStatus: undefined
      }
    }
  }
}
