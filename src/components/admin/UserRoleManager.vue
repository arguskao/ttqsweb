<template>
  <div class="user-role-manager">
    <div class="header">
      <h2>用戶角色管理</h2>
      <div class="stats">
        <div class="stat-card">
          <span class="label">總用戶數</span>
          <span class="value">{{ stats.totalUsers }}</span>
        </div>
        <div class="stat-card">
          <span class="label">管理員</span>
          <span class="value">{{ stats.adminCount }}</span>
        </div>
        <div class="stat-card">
          <span class="label">講師</span>
          <span class="value">{{ stats.instructorCount }}</span>
        </div>
        <div class="stat-card">
          <span class="label">雇主</span>
          <span class="value">{{ stats.employerCount }}</span>
        </div>
        <div class="stat-card">
          <span class="label">求職者</span>
          <span class="value">{{ stats.jobSeekerCount }}</span>
        </div>
      </div>
    </div>

    <div class="filters">
      <select v-model="filters.userType" @change="loadUsers">
        <option value="">所有角色</option>
        <option value="admin">管理員</option>
        <option value="instructor">講師</option>
        <option value="employer">雇主</option>
        <option value="job_seeker">求職者</option>
      </select>

      <input
        v-model="filters.search"
        type="text"
        placeholder="搜尋用戶..."
        @input="debounceSearch"
      />
    </div>

    <div class="user-list">
      <div class="user-item" v-for="user in users" :key="user.id">
        <div class="user-info">
          <div class="name">{{ user.full_name }}</div>
          <div class="email">{{ user.email }}</div>
          <div class="created">註冊時間: {{ formatDate(user.created_at) }}</div>
        </div>

        <div class="user-role">
          <select
            :value="user.user_type"
            @change="updateUserRole(user.id, ($event.target as HTMLSelectElement).value)"
            :disabled="user.id === currentUser?.id"
          >
            <option value="job_seeker">求職者</option>
            <option value="employer">雇主</option>
            <option value="instructor">講師</option>
            <option value="admin">管理員</option>
          </select>
        </div>

        <div class="user-status">
          <label class="switch">
            <input
              type="checkbox"
              :checked="user.is_active"
              @change="updateUserStatus(user.id, ($event.target as HTMLInputElement).checked)"
              :disabled="user.id === currentUser?.id"
            />
            <span class="slider"></span>
          </label>
          <span class="status-text">
            {{ user.is_active ? '啟用' : '停用' }}
          </span>
        </div>

        <div class="user-actions">
          <button @click="viewUser(user.id)" class="btn btn-info">查看</button>
          <button
            @click="deleteUser(user.id)"
            class="btn btn-danger"
            :disabled="user.id === currentUser?.id"
          >
            刪除
          </button>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="pagination.totalPages > 1">
      <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1" class="btn">
        上一頁
      </button>

      <span class="page-info">
        第 {{ pagination.page }} 頁，共 {{ pagination.totalPages }} 頁
      </span>

      <button
        @click="changePage(pagination.page + 1)"
        :disabled="pagination.page >= pagination.totalPages"
        class="btn"
      >
        下一頁
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'

import { usePermissions } from '../../composables/usePermissions'

// 類型定義
interface User {
  id: number
  email: string
  user_type: string
  first_name: string
  last_name: string
  full_name: string
  phone?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

interface Stats {
  totalUsers: number
  adminCount: number
  instructorCount: number
  employerCount: number
  jobSeekerCount: number
}

// 組合式 API
const { user: currentUser, permissions } = usePermissions()

// 響應式數據
const users = ref<User[]>([])
const stats = ref<Stats>({
  totalUsers: 0,
  adminCount: 0,
  instructorCount: 0,
  employerCount: 0,
  jobSeekerCount: 0
})

const filters = reactive({
  userType: '',
  search: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const loading = ref(false)

// 計算屬性
const canManageUsers = computed(() => permissions.value.canManageUsers)

// 方法
const loadUsers = async () => {
  if (!canManageUsers.value) return

  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...(filters.userType && { userType: filters.userType }),
      ...(filters.search && { search: filters.search })
    })

    const response = await fetch(`/api/admin/users?${params}`)
    const data = await response.json()

    if (data.success) {
      users.value = data.data.users
      Object.assign(pagination, data.data.pagination)
    }
  } catch (error) {
    console.error('載入用戶列表失敗:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  if (!canManageUsers.value) return

  try {
    const response = await fetch('/api/admin/stats/users')
    const data = await response.json()

    if (data.success) {
      stats.value = {
        totalUsers: data.data.total_users,
        adminCount: data.data.admin_count,
        instructorCount: data.data.instructor_count,
        employerCount: data.data.employer_count,
        jobSeekerCount: data.data.job_seeker_count
      }
    }
  } catch (error) {
    console.error('載入統計數據失敗:', error)
  }
}

const updateUserRole = async (userId: number, newRole: string) => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userType: newRole })
    })

    const data = await response.json()

    if (data.success) {
      await loadUsers()
      await loadStats()
    } else {
      alert(data.message || '更新角色失敗')
    }
  } catch (error) {
    console.error('更新用戶角色失敗:', error)
    alert('更新角色失敗')
  }
}

const updateUserStatus = async (userId: number, isActive: boolean) => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive })
    })

    const data = await response.json()

    if (data.success) {
      await loadUsers()
    } else {
      alert(data.message || '更新狀態失敗')
    }
  } catch (error) {
    console.error('更新用戶狀態失敗:', error)
    alert('更新狀態失敗')
  }
}

const deleteUser = async (userId: number) => {
  if (!confirm('確定要刪除此用戶嗎？')) return

  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (data.success) {
      await loadUsers()
      await loadStats()
    } else {
      alert(data.message || '刪除用戶失敗')
    }
  } catch (error) {
    console.error('刪除用戶失敗:', error)
    alert('刪除用戶失敗')
  }
}

const viewUser = (userId: number) => {
  // 實作用戶詳情查看
  console.log('查看用戶:', userId)
}

const changePage = (newPage: number) => {
  pagination.page = newPage
  loadUsers()
}

let searchTimeout: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadUsers()
  }, 500)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

// 生命週期
onMounted(() => {
  if (canManageUsers.value) {
    loadUsers()
    loadStats()
  }
})
</script>

<style scoped>
.user-role-manager {
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header h2 {
  margin-bottom: 20px;
  color: #333;
}

.stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.stat-card .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-card .value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.filters select,
.filters input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filters input {
  flex: 1;
  max-width: 300px;
}

.user-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.user-item:last-child {
  border-bottom: none;
}

.user-info .name {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.user-info .email {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.user-info .created {
  color: #999;
  font-size: 12px;
}

.user-role select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4caf50;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.status-text {
  font-size: 14px;
  color: #666;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background-color: #138496;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.page-info {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .user-item {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .stats {
    justify-content: center;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
