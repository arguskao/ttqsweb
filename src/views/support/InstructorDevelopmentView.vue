<template>
  <div class="container">
    <section class="section">
      <h1 class="title">講師發展路徑</h1>
      <p class="subtitle">優秀學員可以申請成為講師，開啟教學職涯</p>

      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <div v-else-if="!development">
        <div class="notification is-info">
          <p>您還沒有申請講師發展計劃</p>
        </div>

        <div class="box">
          <h2 class="title is-4">講師發展階段</h2>
          <div class="content">
            <ol>
              <li><strong>有興趣階段：</strong>表達成為講師的意願</li>
              <li><strong>培訓階段：</strong>參加講師培訓課程</li>
              <li><strong>助教階段：</strong>協助資深講師授課</li>
              <li><strong>認證講師：</strong>通過認證，獨立授課</li>
              <li><strong>資深講師：</strong>累積豐富教學經驗</li>
            </ol>
          </div>

          <button class="button is-primary" @click="showApplicationModal = true">
            申請成為講師
          </button>
        </div>
      </div>

      <div v-else>
        <div class="box">
          <h2 class="title is-4">您的講師發展狀態</h2>

          <div class="content">
            <p>
              <strong>當前階段：</strong>
              <span class="tag is-info is-medium">{{ getStageLabel(development.currentStage) }}</span>
            </p>
            <p>
              <strong>申請狀態：</strong>
              <span
                class="tag is-medium"
                :class="{
                  'is-warning': development.applicationStatus === 'pending',
                  'is-success': development.applicationStatus === 'approved',
                  'is-danger': development.applicationStatus === 'rejected',
                  'is-info': development.applicationStatus === 'in_progress'
                }"
              >
                {{ getApplicationStatusLabel(development.applicationStatus) }}
              </span>
            </p>
            <p><strong>教學時數：</strong>{{ development.teachingHours }} 小時</p>
            <p v-if="development.studentRating">
              <strong>學員評分：</strong>{{ development.studentRating.toFixed(2) }} / 5.0
            </p>
            <p v-if="development.certifications && development.certifications.length > 0">
              <strong>認證：</strong>
              <span
                v-for="cert in development.certifications"
                :key="cert"
                class="tag is-success ml-2"
              >
                {{ cert }}
              </span>
            </p>
            <p v-if="development.notes">
              <strong>備註：</strong>{{ development.notes }}
            </p>
            <p class="has-text-grey-light">
              申請時間：{{ formatDate(development.appliedAt) }}
            </p>
          </div>

          <div class="box has-background-light">
            <h3 class="title is-5">記錄教學時數</h3>
            <div class="field has-addons">
              <div class="control">
                <input
                  v-model.number="hoursToLog"
                  class="input"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="輸入時數"
                />
              </div>
              <div class="control">
                <button class="button is-primary" @click="logTeachingHours">記錄</button>
              </div>
            </div>
          </div>
        </div>

        <div class="box">
          <h2 class="title is-4">發展路徑指引</h2>
          <div class="content">
            <div v-if="development.currentStage === 'interested'">
              <p>您已表達成為講師的意願，我們將審核您的申請。</p>
              <p>審核通過後，您將進入培訓階段。</p>
            </div>
            <div v-else-if="development.currentStage === 'training'">
              <p>請參加講師培訓課程，學習教學技巧和課程設計。</p>
              <p>完成培訓後，您將進入助教階段。</p>
            </div>
            <div v-else-if="development.currentStage === 'assistant'">
              <p>請協助資深講師授課，累積教學經驗。</p>
              <p>累積足夠經驗後，可申請講師認證。</p>
            </div>
            <div v-else-if="development.currentStage === 'certified'">
              <p>恭喜您成為認證講師！您可以獨立開設課程。</p>
              <p>持續提升教學品質，累積更多教學時數。</p>
            </div>
            <div v-else-if="development.currentStage === 'senior'">
              <p>您已是資深講師，感謝您對學院的貢獻！</p>
              <p>歡迎指導新進講師，分享您的教學經驗。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Application Modal -->
    <div class="modal" :class="{ 'is-active': showApplicationModal }">
      <div class="modal-background" @click="showApplicationModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">申請成為講師</p>
          <button class="delete" @click="showApplicationModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">相關認證（用逗號分隔）</label>
            <div class="control">
              <input
                v-model="certificationsInput"
                class="input"
                type="text"
                placeholder="例如：藥師執照, 教學證書"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">申請說明</label>
            <div class="control">
              <textarea
                v-model="applicationNotes"
                class="textarea"
                rows="5"
                placeholder="請說明您想成為講師的原因和相關經驗"
              ></textarea>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="applyForInstructor">提交申請</button>
          <button class="button" @click="showApplicationModal = false">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import api from '@/services/api'

const development = ref<any>(null)
const loading = ref(false)
const showApplicationModal = ref(false)
const certificationsInput = ref('')
const applicationNotes = ref('')
const hoursToLog = ref(0)

const loadDevelopmentStatus = async () => {
  loading.value = true
  try {
    const response = await api.get('/instructor-development/status')
    development.value = response.data.data
  } catch (error) {
    console.error('載入講師發展狀態失敗:', error)
  } finally {
    loading.value = false
  }
}

const applyForInstructor = async () => {
  try {
    const certifications = certificationsInput.value
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c)

    await api.post('/instructor-development/apply', {
      certifications,
      notes: applicationNotes.value
    })

    showApplicationModal.value = false
    certificationsInput.value = ''
    applicationNotes.value = ''
    alert('申請已提交！我們將盡快審核')
    loadDevelopmentStatus()
  } catch (error: any) {
    alert(error.response?.data?.error?.message || '申請失敗，請稍後再試')
  }
}

const logTeachingHours = async () => {
  if (hoursToLog.value <= 0) {
    alert('請輸入有效的教學時數')
    return
  }

  try {
    await api.post('/instructor-development/log-hours', {
      hours: hoursToLog.value
    })
    alert('教學時數已記錄')
    hoursToLog.value = 0
    loadDevelopmentStatus()
  } catch (error) {
    alert('記錄失敗')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    interested: '有興趣階段',
    training: '培訓階段',
    assistant: '助教階段',
    certified: '認證講師',
    senior: '資深講師'
  }
  return labels[stage] || stage
}

const getApplicationStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '審核中',
    approved: '已通過',
    rejected: '未通過',
    in_progress: '進行中'
  }
  return labels[status] || status
}

onMounted(() => {
  loadDevelopmentStatus()
})
</script>
