<template>
  <div class="container py-6">
    <!-- 頁面標題 -->
    <div class="hero is-light is-small">
      <div class="hero-body">
        <div class="container">
          <h1 class="title is-2">
            <span class="icon is-large">
              <span>👨‍🏫</span>
            </span>
            講師申請
          </h1>
          <p class="subtitle">加入我們的講師團隊，分享您的專業知識與經驗</p>
        </div>
      </div>
    </div>

    <div class="columns is-centered mt-6">
      <div class="column is-8">
        <!-- 申請狀態檢查 -->
        <div
          v-if="existingApplication"
          class="notification"
          :class="getStatusClass(existingApplication.status)"
        >
          <h2 class="title is-4">申請狀態</h2>
          <div class="content">
            <p><strong>狀態：</strong>{{ getStatusText(existingApplication.status) }}</p>
            <p><strong>提交時間：</strong>{{ existingApplication.submitted_at ? formatDate(existingApplication.submitted_at) : '未知' }}</p>
            <p v-if="existingApplication.reviewed_at">
              <strong>審核時間：</strong>{{ formatDate(existingApplication.reviewed_at) }}
            </p>
            <p v-if="existingApplication.review_notes">
              <strong>審核備註：</strong>{{ existingApplication.review_notes }}
            </p>
          </div>

          <!-- 重新申請按鈕 -->
          <button
            v-if="existingApplication.status === 'rejected'"
            @click="showResubmitForm = true"
            class="button is-primary"
          >
            重新提交申請
          </button>
        </div>

        <!-- 申請表單 -->
        <div v-if="!existingApplication || showResubmitForm" class="box">
          <h2 class="title is-4">{{ showResubmitForm ? '重新提交' : '提交' }}講師申請</h2>

          <form @submit.prevent="submitApplication">
            <!-- 專業領域與面對族群 -->
            <div class="columns">
              <div class="column">
                <div class="field">
                  <label class="label">專業領域 <span class="has-text-danger">*</span></label>
                  <div class="control">
                    <div class="field is-grouped is-grouped-multiline">
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="藥學基礎" v-model="form.specializations" />
                          藥學基礎
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="臨床藥學" v-model="form.specializations" />
                          臨床藥學
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="營養學" v-model="form.specializations" />
                          營養學
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="直面銷售" v-model="form.specializations" />
                          直面銷售
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="藥局庶務" v-model="form.specializations" />
                          藥局庶務
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="醫療器材" v-model="form.specializations" />
                          醫療器材
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="網路行銷" v-model="form.specializations" />
                          網路行銷
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input
                            type="checkbox"
                            value="自媒體經營"
                            v-model="form.specializations"
                          />
                          自媒體經營
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="網站製作" v-model="form.specializations" />
                          網站製作
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="財稅知識" v-model="form.specializations" />
                          財稅知識
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="勞資糾紛" v-model="form.specializations" />
                          勞資糾紛
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="其他" v-model="form.specializations" />
                          其他
                        </label>
                      </div>
                    </div>
                  </div>
                  <p class="help">請選擇您的專業領域（可多選）</p>
                </div>
              </div>

              <div class="column">
                <div class="field">
                  <label class="label">面對族群 <span class="has-text-danger">*</span></label>
                  <div class="control">
                    <div class="field is-grouped is-grouped-multiline">
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="準藥助" v-model="form.target_audiences" />
                          準藥助
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="高級藥助" v-model="form.target_audiences" />
                          高級藥助
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="藥局老闆" v-model="form.target_audiences" />
                          藥局老闆
                        </label>
                      </div>
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" value="想開店" v-model="form.target_audiences" />
                          想開店
                        </label>
                      </div>
                    </div>
                  </div>
                  <p class="help">請選擇您的目標學員群體（可多選）</p>
                </div>
              </div>
            </div>

            <!-- 工作經驗年數 -->
            <div class="field">
              <label class="label">工作經驗年數 <span class="has-text-danger">*</span></label>
              <div class="control">
                <input
                  v-model.number="form.yearsOfExperience"
                  class="input"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="請輸入工作經驗年數"
                  required
                />
              </div>
              <p class="help">請輸入您在相關領域的工作經驗年數</p>
            </div>

            <!-- 專業資格 -->
            <div class="field">
              <label class="label">專業資格與證照 <span class="has-text-danger">*</span></label>
              <div class="control">
                <textarea
                  v-model="form.qualifications"
                  class="textarea"
                  rows="4"
                  placeholder="請詳細說明您的學歷、專業證照、相關證書等資格（例如：藥師執照、相關學位、專業培訓證書等）"
                  required
                ></textarea>
              </div>
              <p class="help">請詳細列出您的教育背景、專業證照和相關資格</p>
            </div>

            <!-- 個人簡介 -->
            <div class="field">
              <label class="label">個人簡介 <span class="has-text-danger">*</span></label>
              <div class="control">
                <textarea
                  v-model="form.bio"
                  class="textarea"
                  rows="6"
                  placeholder="請介紹您的專業背景、工作經驗、教學理念等（建議300-500字）"
                  required
                ></textarea>
              </div>
              <p class="help">請分享您的專業背景、教學經驗和教學理念</p>
            </div>

            <!-- 教學理念 -->
            <div class="field">
              <label class="label">教學理念與方法</label>
              <div class="control">
                <textarea
                  v-model="form.teaching_philosophy"
                  class="textarea"
                  rows="4"
                  placeholder="請分享您的教學理念、教學方法，以及如何幫助學生學習（選填）"
                ></textarea>
              </div>
              <p class="help">選填：分享您的教學理念和方法</p>
            </div>

            <!-- 聯絡資訊確認 -->
            <div class="field">
              <label class="label">聯絡資訊</label>
              <div class="control">
                <input :value="currentUser?.email" class="input" type="email" readonly disabled />
              </div>
              <p class="help">如需更改聯絡資訊，請先到個人資料頁面修改</p>
            </div>

            <!-- 同意條款 -->
            <div class="field">
              <div class="control">
                <label class="checkbox">
                  <input v-model="agreedToTerms" type="checkbox" required />
                  我同意遵守平台的
                  <a href="#" @click.prevent="showTerms = true">講師服務條款</a>
                  和
                  <a href="#" @click.prevent="showPrivacy = true">隱私政策</a>
                  <span class="has-text-danger">*</span>
                </label>
              </div>
            </div>

            <!-- 提交按鈕 -->
            <div class="field is-grouped">
              <div class="control">
                <button
                  type="submit"
                  class="button is-primary is-medium"
                  :class="{ 'is-loading': isSubmitting }"
                  :disabled="!canSubmit"
                >
                  <span class="icon">
                    <span>✈️</span>
                  </span>
                  <span>{{ showResubmitForm ? '重新提交申請' : '提交申請' }}</span>
                </button>
              </div>
              <div class="control" v-if="showResubmitForm">
                <button type="button" class="button is-light" @click="showResubmitForm = false">
                  取消
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- 申請須知 -->
        <div class="box mt-5">
          <h3 class="title is-5">申請須知</h3>
          <div class="content">
            <ul>
              <li>📋 請確實填寫所有必填欄位，提供真實有效的資訊</li>
              <li>📄 請準備好相關證照和資格證明文件</li>
              <li>⏰ 申請審核時間約需 3-5 個工作天</li>
              <li>📧 審核結果將以電子郵件通知</li>
              <li>✅ 申請通過後，將可開始建立和管理課程</li>
              <li>💡 如有疑問，請聯絡客服團隊</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 條款彈窗 -->
    <div class="modal" :class="{ 'is-active': showTerms }">
      <div class="modal-background" @click="showTerms = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">講師服務條款</p>
          <button class="delete" @click="showTerms = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="content">
            <h4>講師責任與義務</h4>
            <ul>
              <li>提供高品質的教學內容</li>
              <li>按時完成課程錄製和更新</li>
              <li>回應學生問題和反饋</li>
              <li>遵守平台規範和政策</li>
            </ul>
            <h4>平台權利與支持</h4>
            <ul>
              <li>提供技術支持和培訓</li>
              <li>協助課程推廣和行銷</li>
              <li>提供學員管理工具</li>
              <li>定期支付講師費用</li>
            </ul>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button" @click="showTerms = false">關閉</button>
        </footer>
      </div>
    </div>

    <!-- 隱私政策彈窗 -->
    <div class="modal" :class="{ 'is-active': showPrivacy }">
      <div class="modal-background" @click="showPrivacy = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">隱私政策</p>
          <button class="delete" @click="showPrivacy = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="content">
            <h4>資料收集</h4>
            <p>我們收集必要的個人資訊以處理講師申請，包括聯絡方式、專業資格等。</p>
            <h4>資料使用</h4>
            <p>您的資料僅用於申請審核、帳戶管理和平台服務提供。</p>
            <h4>資料保護</h4>
            <p>我們採用業界標準的安全措施保護您的個人資料。</p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button" @click="showPrivacy = false">關閉</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import type { CreateApplicationRequest, InstructorApplication } from '@/types/instructor'
import { apiService } from '@/services/api'
import { authService } from '@/services/auth-service'

const router = useRouter()

// 組件狀態
const isSubmitting = ref(false)
const showResubmitForm = ref(false)
const agreedToTerms = ref(false)
const showTerms = ref(false)
const showPrivacy = ref(false)
const existingApplication = ref<InstructorApplication | null>(null)

// 表單數據
const form = ref<
  CreateApplicationRequest & {
    teaching_philosophy?: string
    specializations?: string[]
    target_audiences?: string[]
  }
>({
  bio: '',
  qualifications: '',
  specialization: '',
  yearsOfExperience: 0,
  teaching_philosophy: '',
  specializations: [],
  target_audiences: []
})

// 當前用戶
const currentUser = computed(() => authService.getCurrentUser())

// 表單驗證
const canSubmit = computed(() => {
  return (
    form.value.bio &&
    form.value.qualifications &&
    form.value.specializations &&
    form.value.specializations.length > 0 &&
    form.value.target_audiences &&
    form.value.target_audiences.length > 0 &&
    form.value.yearsOfExperience >= 0 &&
    agreedToTerms.value
  )
})

// 申請狀態樣式
const getStatusClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'is-warning'
    case 'approved':
      return 'is-success'
    case 'rejected':
      return 'is-danger'
    default:
      return 'is-info'
  }
}

// 申請狀態文字
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待審核'
    case 'approved':
      return '已通過'
    case 'rejected':
      return '已拒絕'
    default:
      return '未知'
  }
}

// 日期格式化
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 檢查現有申請
const checkExistingApplication = async () => {
  try {
    const user = currentUser.value
    if (!user) return

    const result = await apiService.get(`/users/${user.id}/instructor-application`)
    if (result.success && result.data) {
      existingApplication.value = result.data as InstructorApplication
    }
  } catch (error) {
    console.error('檢查申請狀態失敗:', error)
  }
}

// 提交申請
const submitApplication = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    const endpoint = showResubmitForm.value
      ? `/instructor-applications/${existingApplication.value!.id}/resubmit`
      : '/instructor-applications'

    const submitData = {
      bio: form.value.bio,
      qualifications: form.value.qualifications,
      specialization: form.value.specializations?.join(', ') || '',
      yearsOfExperience: form.value.yearsOfExperience,
      target_audiences: form.value.target_audiences?.join(', ') || ''
    }

    console.log('提交申請數據:', submitData)
    console.log('提交到端點:', endpoint)

    const result = await apiService.post(endpoint, submitData)

    if (result.success) {
      // 顯示成功訊息
      alert('申請提交成功！我們將在 3-5 個工作天內審核您的申請，審核結果將以電子郵件通知。')

      // 重新檢查申請狀態
      await checkExistingApplication()
      showResubmitForm.value = false

      // 清空表單
      form.value = {
        bio: '',
        qualifications: '',
        specialization: '',
        yearsOfExperience: 0,
        teaching_philosophy: '',
        specializations: [],
        target_audiences: []
      }
      agreedToTerms.value = false
    } else {
      alert(`申請提交失敗：${result.error?.message || '未知錯誤'}`)
    }
  } catch (error) {
    console.error('提交申請失敗:', error)
    alert('申請提交失敗，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

// 頁面初始化
onMounted(async () => {
  // 檢查用戶是否已登入
  if (!currentUser.value) {
    router.push('/login')
    return
  }

  // 檢查現有申請
  await checkExistingApplication()
})
</script>

<style scoped>
.hero {
  margin-bottom: 2rem;
}

.notification .title {
  margin-bottom: 1rem;
}

.textarea {
  resize: vertical;
  min-height: 100px;
}

.field .help {
  margin-top: 0.25rem;
}

.checkbox a {
  color: #3273dc;
  text-decoration: underline;
}

.checkbox a:hover {
  color: #2366d1;
}

.modal-card {
  max-width: 600px;
  margin: 0 auto;
}

.content ul li {
  margin-bottom: 0.5rem;
}

/* 多選框樣式 */
.field.is-grouped.is-grouped-multiline .control {
  margin-bottom: 0.5rem;
}

.field.is-grouped.is-grouped-multiline .control:not(:last-child) {
  margin-right: 1rem;
}

.checkbox {
  font-size: 0.9rem;
}

.checkbox input[type='checkbox'] {
  margin-right: 0.5rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .columns .column {
    padding: 0.5rem;
  }

  .field.is-grouped.is-grouped-multiline .control {
    margin-right: 0.75rem;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .column.is-8 {
    padding: 0;
  }
}
</style>
