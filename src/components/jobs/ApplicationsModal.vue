<template>
  <div class="modal" :class="{ 'is-active': isVisible }">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">申請者管理 - {{ jobTitle }}</p>
        <button class="delete" aria-label="close" @click="$emit('close')"></button>
      </header>

      <section class="modal-card-body">
        <!-- 申請者統計 -->
        <div class="applications-stats">
          <div class="columns">
            <div class="column is-3">
              <div class="stat-box">
                <div class="stat-number">{{ applications.length }}</div>
                <div class="stat-label">總申請數</div>
              </div>
            </div>
            <div class="column is-3">
              <div class="stat-box">
                <div class="stat-number">{{ pendingCount }}</div>
                <div class="stat-label">待審核</div>
              </div>
            </div>
            <div class="column is-3">
              <div class="stat-box">
                <div class="stat-number">{{ acceptedCount }}</div>
                <div class="stat-label">已接受</div>
              </div>
            </div>
            <div class="column is-3">
              <div class="stat-box">
                <div class="stat-number">{{ rejectedCount }}</div>
                <div class="stat-label">已拒絕</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 篩選器 -->
        <div class="filter-section">
          <div class="columns">
            <div class="column is-4">
              <div class="field">
                <label class="label">狀態篩選</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select
                      :value="statusFilter"
                      @change="
                        $emit('update:statusFilter', ($event.target as HTMLSelectElement).value)
                      "
                    >
                      <option value="">全部狀態</option>
                      <option value="pending">待審核</option>
                      <option value="accepted">已接受</option>
                      <option value="rejected">已拒絕</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">搜索申請者</label>
                <div class="control has-icons-left">
                  <input
                    :value="searchQuery"
                    class="input"
                    type="text"
                    placeholder="搜索姓名或信箱..."
                    @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-search"></i>
                  </span>
                </div>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">&nbsp;</label>
                <div class="control">
                  <button class="button is-light is-fullwidth" @click="$emit('reset-filters')">
                    <span>🔄 重置篩選</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 申請者列表 -->
        <div class="applications-list">
          <div v-if="filteredApplications.length === 0" class="empty-state">
            <div class="has-text-centered py-6">
              <span class="icon is-large has-text-grey-light">
                <i class="fas fa-users fa-3x"></i>
              </span>
              <p class="title is-5 mt-4">沒有找到申請者</p>
              <p class="subtitle is-6">請調整篩選條件或稍後再試</p>
            </div>
          </div>

          <div v-else>
            <div
              v-for="application in filteredApplications"
              :key="application.id"
              class="application-card"
            >
              <div class="card">
                <div class="card-content">
                  <div class="columns">
                    <div class="column is-8">
                      <div class="applicant-info">
                        <h4 class="title is-5">{{ application.applicantName }}</h4>
                        <p class="subtitle is-6">{{ application.applicantEmail }}</p>
                        <div class="applicant-details">
                          <span class="tag is-light">
                            <span class="icon">
                              <i class="fas fa-calendar"></i>
                            </span>
                            <span>{{ formatDate(application.appliedAt) }}</span>
                          </span>
                          <span class="tag is-light">
                            <span class="icon">
                              <i class="fas fa-file-alt"></i>
                            </span>
                            <span>{{ application.resumeFileName || '無履歷' }}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="column is-4">
                      <div class="application-actions">
                        <div class="status-badge">
                          <span class="tag" :class="getStatusClass(application.status)">
                            {{ getStatusText(application.status) }}
                          </span>
                        </div>
                        <div class="action-buttons">
                          <button
                            class="button is-small is-primary"
                            @click="$emit('view-resume', application)"
                          >
                            <span class="icon">
                              <i class="fas fa-eye"></i>
                            </span>
                            <span>查看履歷</span>
                          </button>
                          <div
                            class="dropdown is-right"
                            :class="{ 'is-active': activeDropdown === application.id }"
                          >
                            <div class="dropdown-trigger">
                              <button
                                class="button is-small"
                                @click="toggleDropdown(application.id)"
                                aria-haspopup="true"
                                aria-controls="dropdown-menu"
                              >
                                <span class="icon">
                                  <i class="fas fa-ellipsis-v"></i>
                                </span>
                              </button>
                            </div>
                            <div class="dropdown-menu" role="menu">
                              <div class="dropdown-content">
                                <a
                                  v-if="application.status === 'pending'"
                                  class="dropdown-item has-text-success"
                                  @click="$emit('accept-application', application)"
                                >
                                  <span class="icon">
                                    <i class="fas fa-check"></i>
                                  </span>
                                  <span>接受申請</span>
                                </a>
                                <a
                                  v-if="application.status === 'pending'"
                                  class="dropdown-item has-text-danger"
                                  @click="$emit('reject-application', application)"
                                >
                                  <span class="icon">
                                    <i class="fas fa-times"></i>
                                  </span>
                                  <span>拒絕申請</span>
                                </a>
                                <a
                                  class="dropdown-item"
                                  @click="$emit('contact-applicant', application)"
                                >
                                  <span class="icon">
                                    <i class="fas fa-envelope"></i>
                                  </span>
                                  <span>聯絡申請者</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="application.message" class="application-message">
                    <h5 class="title is-6">申請訊息</h5>
                    <p class="content">{{ application.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="modal-card-foot">
        <div class="level">
          <div class="level-left">
            <div class="level-item">
              <span class="has-text-grey"> 共 {{ filteredApplications.length }} 個申請者 </span>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <button class="button" @click="$emit('close')">關閉</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Application {
  id: number
  applicantName: string
  applicantEmail: string
  appliedAt: string
  status: 'pending' | 'accepted' | 'rejected'
  message: string | null
  resumeFileName: string | null
}

interface Props {
  isVisible: boolean
  jobTitle: string
  applications: Application[]
  statusFilter: string
  searchQuery: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'update:statusFilter': [value: string]
  'update:searchQuery': [value: string]
  'reset-filters': []
  'view-resume': [application: Application]
  'accept-application': [application: Application]
  'reject-application': [application: Application]
  'contact-applicant': [application: Application]
}>()

const activeDropdown = ref<number | null>(null)

const toggleDropdown = (applicationId: number) => {
  activeDropdown.value = activeDropdown.value === applicationId ? null : applicationId
}

const filteredApplications = computed(() => {
  let filtered = props.applications

  // 狀態篩選
  if (props.statusFilter) {
    filtered = filtered.filter(app => app.status === props.statusFilter)
  }

  // 搜索篩選
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    filtered = filtered.filter(
      app =>
        app.applicantName.toLowerCase().includes(query) ||
        app.applicantEmail.toLowerCase().includes(query)
    )
  }

  return filtered
})

const pendingCount = computed(
  () => props.applications.filter(app => app.status === 'pending').length
)

const acceptedCount = computed(
  () => props.applications.filter(app => app.status === 'accepted').length
)

const rejectedCount = computed(
  () => props.applications.filter(app => app.status === 'rejected').length
)

const getStatusClass = (status: string) => {
  const statusClasses = {
    pending: 'is-warning',
    accepted: 'is-success',
    rejected: 'is-danger'
  }
  return statusClasses[status as keyof typeof statusClasses] || 'is-light'
}

const getStatusText = (status: string) => {
  const statusTexts = {
    pending: '待審核',
    accepted: '已接受',
    rejected: '已拒絕'
  }
  return statusTexts[status as keyof typeof statusTexts] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}
</script>

<style scoped>
.modal-card {
  width: 95%;
  max-width: 1000px;
}

.modal-card-body {
  max-height: 70vh;
  overflow-y: auto;
}

.applications-stats {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-box {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #3273dc;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.875rem;
}

.filter-section {
  margin-bottom: 2rem;
}

.applications-list {
  margin-bottom: 2rem;
}

.application-card {
  margin-bottom: 1rem;
}

.applicant-info .title {
  margin-bottom: 0.25rem;
}

.applicant-info .subtitle {
  margin-bottom: 1rem;
  color: #666;
}

.applicant-details {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.application-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.status-badge {
  margin-bottom: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.application-message {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
}

.application-message .title {
  margin-bottom: 0.5rem;
}

.application-message .content {
  color: #666;
  line-height: 1.5;
}

.dropdown-menu {
  min-width: 150px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-item.has-text-success:hover {
  background-color: #48c774;
  color: white !important;
}

.dropdown-item.has-text-danger:hover {
  background-color: #ff3860;
  color: white !important;
}

.empty-state {
  margin: 2rem 0;
}
</style>
