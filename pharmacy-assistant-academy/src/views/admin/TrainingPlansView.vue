<template>
  <div class="container mt-5">
    <div class="level">
      <div class="level-left">
        <div class="level-item">
          <div>
            <h1 class="title">訓練計劃管理</h1>
            <p class="subtitle">PDDRO體系訓練計劃</p>
          </div>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <button class="button is-primary" @click="showCreateModal = true">
            <span class="icon"><i class="fas fa-plus"></i></span>
            <span>新增訓練計劃</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="box">
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">狀態篩選</label>
        </div>
        <div class="field-body">
          <div class="field">
            <div class="control">
              <div class="select">
                <select v-model="filterStatus" @change="loadPlans">
                  <option value="">全部</option>
                  <option value="draft">草稿</option>
                  <option value="active">進行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Training Plans List -->
    <div class="box" v-for="plan in plans" :key="plan.id">
      <article class="media">
        <div class="media-content">
          <div class="content">
            <div class="level">
              <div class="level-left">
                <div class="level-item">
                  <div>
                    <p class="title is-4">{{ plan.title }}</p>
                    <p class="subtitle is-6">
                      <span class="tag" :class="getStatusClass(plan.status)">
                        {{ getStatusLabel(plan.status) }}
                      </span>
                      <span class="ml-2">{{ plan.duration_weeks }} 週</span>
                    </p>
                  </div>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <div class="buttons">
                    <router-link :to="`/admin/ttqs/plans/${plan.id}`" class="button is-small is-info">
                      <span class="icon"><i class="fas fa-eye"></i></span>
                      <span>查看</span>
                    </router-link>
                    <button class="button is-small is-primary" @click="editPlan(plan)">
                      <span class="icon"><i class="fas fa-edit"></i></span>
                      <span>編輯</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p>{{ plan.description }}</p>
            <p class="is-size-7 has-text-grey">
              開始日期: {{ formatDate(plan.start_date) }} | 結束日期: {{ formatDate(plan.end_date) }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty State -->
    <div class="box has-text-centered" v-if="plans.length === 0">
      <p class="title is-5">尚無訓練計劃</p>
      <p class="subtitle is-6">點擊上方按鈕新增第一個訓練計劃</p>
    </div>

    <!-- Pagination -->
    <nav class="pagination is-centered" v-if="totalPages > 1">
      <button class="pagination-previous" @click="prevPage" :disabled="currentPage === 1">上一頁</button>
      <button class="pagination-next" @click="nextPage" :disabled="currentPage === totalPages">下一頁</button>
      <ul class="pagination-list">
        <li v-for="page in totalPages" :key="page">
          <a 
            class="pagination-link" 
            :class="{ 'is-current': page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </a>
        </li>
      </ul>
    </nav>

    <!-- Create/Edit Modal -->
    <div class="modal" :class="{ 'is-active': showCreateModal || showEditModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">{{ showEditModal ? '編輯訓練計劃' : '新增訓練計劃' }}</p>
          <button class="delete" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">標題 *</label>
            <div class="control">
              <input class="input" type="text" v-model="formData.title" placeholder="訓練計劃標題">
            </div>
          </div>

          <div class="field">
            <label class="label">描述</label>
            <div class="control">
              <textarea class="textarea" v-model="formData.description" placeholder="計劃描述"></textarea>
            </div>
          </div>

          <div class="field">
            <label class="label">目標 *</label>
            <div class="control">
              <textarea class="textarea" v-model="formData.objectives" placeholder="訓練目標"></textarea>
            </div>
          </div>

          <div class="field">
            <label class="label">目標對象</label>
            <div class="control">
              <input class="input" type="text" v-model="formData.target_audience" placeholder="目標學員群體">
            </div>
          </div>

          <div class="columns">
            <div class="column">
              <div class="field">
                <label class="label">訓練週數</label>
                <div class="control">
                  <input class="input" type="number" v-model="formData.duration_weeks" placeholder="週數">
                </div>
              </div>
            </div>
            <div class="column">
              <div class="field">
                <label class="label">狀態</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="formData.status">
                      <option value="draft">草稿</option>
                      <option value="active">進行中</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="columns">
            <div class="column">
              <div class="field">
                <label class="label">開始日期</label>
                <div class="control">
                  <input class="input" type="date" v-model="formData.start_date">
                </div>
              </div>
            </div>
            <div class="column">
              <div class="field">
                <label class="label">結束日期</label>
                <div class="control">
                  <input class="input" type="date" v-model="formData.end_date">
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" @click="savePlan">儲存</button>
          <button class="button" @click="closeModal">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const plans = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const filterStatus = ref('')

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingPlanId = ref<number | null>(null)

const formData = ref({
  title: '',
  description: '',
  objectives: '',
  target_audience: '',
  duration_weeks: null,
  start_date: '',
  end_date: '',
  status: 'draft'
})

const loadPlans = async () => {
  try {
    const params: any = {
      page: currentPage.value,
      limit: 10
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }

    const response = await axios.get('/api/v1/ttqs/plans', { params })
    if (response.data.success) {
      plans.value = response.data.data
      totalPages.value = response.data.meta?.totalPages || 1
    }
  } catch (error) {
    console.error('載入訓練計劃失敗:', error)
  }
}

const savePlan = async () => {
  try {
    if (showEditModal.value && editingPlanId.value) {
      // Update existing plan
      await axios.put(`/api/v1/ttqs/plans/${editingPlanId.value}`, formData.value)
    } else {
      // Create new plan
      await axios.post('/api/v1/ttqs/plans', formData.value)
    }
    closeModal()
    loadPlans()
  } catch (error) {
    console.error('儲存訓練計劃失敗:', error)
  }
}

const editPlan = (plan: any) => {
  editingPlanId.value = plan.id
  formData.value = { ...plan }
  showEditModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingPlanId.value = null
  formData.value = {
    title: '',
    description: '',
    objectives: '',
    target_audience: '',
    duration_weeks: null,
    start_date: '',
    end_date: '',
    status: 'draft'
  }
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    draft: 'is-light',
    active: 'is-success',
    completed: 'is-info',
    cancelled: 'is-danger'
  }
  return classes[status] || 'is-light'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: '草稿',
    active: '進行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status] || status
}

const formatDate = (date: string): string => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('zh-TW')
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadPlans()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadPlans()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadPlans()
}

onMounted(() => {
  loadPlans()
})
</script>
