<template>
  <div class="course-students-view">
    <section class="section">
      <div class="container">
        <!-- Loading State -->
        <div v-if="isLoading" class="has-text-centered py-6">
          <button class="button is-loading is-large is-white" disabled>載入中...</button>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="notification is-danger">
          <button class="delete" @click="errorMessage = ''"></button>
          {{ errorMessage }}
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Header -->
          <div class="level mb-5">
            <div class="level-left">
              <div class="level-item">
                <div>
                  <h1 class="title is-2">{{ courseData?.title }}</h1>
                  <p class="subtitle">學員管理</p>
                </div>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <button class="button is-primary" @click="showMessageModal = true">
                  <span class="icon">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <span>發送訊息給學員</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="columns mb-5">
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">總學員數</p>
                <p class="title">{{ students.length }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">進行中</p>
                <p class="title">{{ studentsInProgress }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">已完成</p>
                <p class="title">{{ studentsCompleted }}</p>
              </div>
            </div>
            <div class="column">
              <div class="box has-text-centered">
                <p class="heading">平均進度</p>
                <p class="title">{{ averageProgress }}%</p>
              </div>
            </div>
          </div>

          <!-- Students Table -->
          <div class="box">
            <div v-if="students.length === 0" class="has-text-centered py-6">
              <p class="title is-5">目前沒有學員</p>
              <p class="subtitle">等待學員報名此課程</p>
            </div>

            <table v-else class="table is-fullwidth is-hoverable">
              <thead>
                <tr>
                  <th>學員姓名</th>
                  <th>Email</th>
                  <th>報名日期</th>
                  <th>學習進度</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.id">
                  <td>{{ student.fullName }}</td>
                  <td>{{ student.email }}</td>
                  <td>{{ formatDate(student.enrollmentDate) }}</td>
                  <td>
                    <progress 
                      class="progress is-small" 
                      :class="getProgressClass(student.progressPercentage)"
                      :value="student.progressPercentage" 
                      max="100"
                    >
                      {{ student.progressPercentage }}%
                    </progress>
                    <span class="is-size-7">{{ student.progressPercentage }}%</span>
                  </td>
                  <td>
                    <span class="tag" :class="getStatusClass(student.status)">
                      {{ getStatusText(student.status) }}
                    </span>
                  </td>
                  <td>
                    <button 
                      class="button is-small is-info"
                      @click="openMessageModal(student)"
                    >
                      <span class="icon is-small">
                        <i class="fas fa-envelope"></i>
                      </span>
                      <span>發送訊息</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Message Modal -->
    <div class="modal" :class="{ 'is-active': showMessageModal }">
      <div class="modal-background" @click="closeMessageModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            {{ selectedStudent ? `發送訊息給 ${selectedStudent.fullName}` : '發送訊息給所有學員' }}
          </p>
          <button class="delete" aria-label="close" @click="closeMessageModal"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">主旨</label>
            <div class="control">
              <input 
                v-model="messageForm.subject" 
                class="input" 
                type="text" 
                placeholder="請輸入訊息主旨"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">訊息內容</label>
            <div class="control">
              <textarea 
                v-model="messageForm.message" 
                class="textarea" 
                placeholder="請輸入訊息內容"
                rows="6"
              ></textarea>
            </div>
          </div>

          <div v-if="!selectedStudent" class="notification is-info is-light">
            <p>此訊息將發送給所有 {{ students.length }} 位學員</p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button 
            class="button is-primary" 
            :class="{ 'is-loading': isSending }"
            :disabled="!messageForm.subject || !messageForm.message || isSending"
            @click="sendMessage"
          >
            發送訊息
          </button>
          <button class="button" @click="closeMessageModal">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()

// State
const isLoading = ref(true)
const errorMessage = ref('')
const courseData = ref<any>(null)
const students = ref<any[]>([])
const showMessageModal = ref(false)
const selectedStudent = ref<any>(null)
const isSending = ref(false)
const messageForm = ref({
  subject: '',
  message: ''
})

// Computed
const studentsInProgress = computed(() => 
  students.value.filter(s => s.status === 'in_progress' || s.status === 'enrolled').length
)

const studentsCompleted = computed(() => 
  students.value.filter(s => s.status === 'completed').length
)

const averageProgress = computed(() => {
  if (students.value.length === 0) return 0
  const total = students.value.reduce((sum, s) => sum + s.progressPercentage, 0)
  return Math.round(total / students.value.length)
})

// Methods
const loadStudents = async () => {
  const courseId = route.params.courseId

  if (!courseId) {
    errorMessage.value = '無效的課程 ID'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await api.get(`/courses/${courseId}/students`)

    if (response.data?.success) {
      courseData.value = response.data.data.course
      students.value = response.data.data.students || []
    } else {
      errorMessage.value = response.data?.message || '載入學員資料失敗'
    }
  } catch (error: any) {
    console.error('載入學員失敗:', error)
    errorMessage.value = error.response?.data?.message || '載入學員資料失敗'
  } finally {
    isLoading.value = false
  }
}

const openMessageModal = (student?: any) => {
  selectedStudent.value = student || null
  showMessageModal.value = true
}

const closeMessageModal = () => {
  showMessageModal.value = false
  selectedStudent.value = null
  messageForm.value = {
    subject: '',
    message: ''
  }
}

const sendMessage = async () => {
  const courseId = route.params.courseId

  try {
    isSending.value = true

    const payload = {
      subject: messageForm.value.subject,
      message: messageForm.value.message,
      isBroadcast: !selectedStudent.value,
      recipientId: selectedStudent.value?.id
    }

    const response = await api.post(`/courses/${courseId}/messages`, payload)

    if (response.data?.success) {
      alert(response.data.message || '訊息已發送')
      closeMessageModal()
    } else {
      alert(response.data?.message || '發送訊息失敗')
    }
  } catch (error: any) {
    console.error('發送訊息失敗:', error)
    alert(error.response?.data?.message || '發送訊息失敗')
  } finally {
    isSending.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW')
}

const getProgressClass = (progress: number) => {
  if (progress >= 80) return 'is-success'
  if (progress >= 50) return 'is-warning'
  return 'is-danger'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'is-success'
    case 'in_progress':
    case 'enrolled':
      return 'is-info'
    case 'dropped':
      return 'is-danger'
    default:
      return 'is-light'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '進行中'
    case 'enrolled':
      return '已報名'
    case 'dropped':
      return '已退出'
    default:
      return status
  }
}

// Lifecycle
onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.progress {
  margin-bottom: 0.25rem;
}
</style>
