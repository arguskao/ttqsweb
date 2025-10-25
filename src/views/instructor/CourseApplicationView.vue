<template>
  <div class="container is-max-desktop">
    <div class="box">
      <h1 class="title is-4 has-text-centered">
        <span class="icon-text">
          <span class="icon">
            <span>👨‍🏫</span>
          </span>
          <span>申請開課</span>
        </span>
      </h1>

      <form @submit.prevent="submitApplication" class="mt-5">
        <!-- 課程基本資訊 -->
        <div class="field">
          <label class="label">課程名稱 *</label>
          <div class="control">
            <input
              v-model="form.courseName"
              class="input"
              type="text"
              placeholder="請輸入課程名稱"
              required
            />
          </div>
          <p class="help">請提供清楚明確的課程名稱</p>
        </div>

        <div class="field">
          <label class="label">課程簡介 *</label>
          <div class="control">
            <textarea
              v-model="form.description"
              class="textarea"
              placeholder="請詳細描述課程內容、學習目標等"
              rows="4"
              required
            ></textarea>
          </div>
          <p class="help">請詳細說明課程內容和學習目標</p>
        </div>

        <!-- 課程分類和目標族群 -->
        <div class="columns">
          <div class="column">
            <div class="field">
              <label class="label">課程分類 *</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="form.category" required>
                    <option value="">請選擇課程分類</option>
                    <option value="pharmacy_basics">藥局基礎</option>
                    <option value="medication_knowledge">藥物知識</option>
                    <option value="customer_service">客戶服務</option>
                    <option value="business_management">經營管理</option>
                    <option value="legal_compliance">法規遵循</option>
                    <option value="technology">科技應用</option>
                    <option value="marketing">行銷推廣</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="column">
            <div class="field">
              <label class="label">目標族群 *</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="form.targetAudience" required>
                    <option value="">請選擇目標族群</option>
                    <option value="pharmacy_assistant">準藥助</option>
                    <option value="senior_assistant">高級藥助</option>
                    <option value="pharmacy_owner">藥局老闆</option>
                    <option value="entrepreneur">想開店</option>
                    <option value="all">所有族群</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 課程時數和費用 -->
        <div class="columns">
          <div class="column">
            <div class="field">
              <label class="label">課程時數 *</label>
              <div class="control">
                <input
                  v-model.number="form.duration"
                  class="input"
                  type="number"
                  placeholder="小時"
                  min="1"
                  max="100"
                  required
                />
              </div>
              <p class="help">請輸入課程總時數（小時）</p>
            </div>
          </div>

          <div class="column">
            <div class="field">
              <label class="label">課程費用 *</label>
              <div class="control">
                <div class="field has-addons">
                  <div class="control">
                    <input
                      v-model.number="form.price"
                      class="input"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="100"
                      required
                    />
                  </div>
                  <div class="control">
                    <span class="button is-static">元</span>
                  </div>
                </div>
              </div>
              <p class="help">請輸入課程費用（新台幣）</p>
            </div>
          </div>
        </div>

        <!-- 授課方式 -->
        <div class="field">
          <label class="label">授課方式 *</label>
          <div class="control">
            <div class="field is-grouped is-grouped-multiline">
              <div class="control">
                <label class="checkbox">
                  <input v-model="form.deliveryMethods" type="checkbox" value="online" />
                  線上授課
                </label>
              </div>
              <div class="control">
                <label class="checkbox">
                  <input v-model="form.deliveryMethods" type="checkbox" value="offline" />
                  實體授課
                </label>
              </div>
              <div class="control">
                <label class="checkbox">
                  <input v-model="form.deliveryMethods" type="checkbox" value="hybrid" />
                  混合授課
                </label>
              </div>
            </div>
          </div>
          <p class="help">可選擇多種授課方式</p>
        </div>

        <!-- 課程大綱 -->
        <div class="field">
          <label class="label">課程大綱 *</label>
          <div class="control">
            <textarea
              v-model="form.syllabus"
              class="textarea"
              placeholder="請詳細列出課程章節和內容安排"
              rows="6"
              required
            ></textarea>
          </div>
          <p class="help">請詳細列出課程章節和內容安排</p>
        </div>

        <!-- 講師資歷 -->
        <div class="field">
          <label class="label">相關教學經驗 *</label>
          <div class="control">
            <textarea
              v-model="form.teachingExperience"
              class="textarea"
              placeholder="請描述您的相關教學經驗和專業背景"
              rows="3"
              required
            ></textarea>
          </div>
          <p class="help">請描述您的相關教學經驗和專業背景</p>
        </div>

        <!-- 課程材料 -->
        <div class="field">
          <label class="label">課程材料</label>
          <div class="control">
            <textarea
              v-model="form.materials"
              class="textarea"
              placeholder="請列出課程所需材料（講義、教材、工具等）"
              rows="3"
            ></textarea>
          </div>
          <p class="help">請列出課程所需材料（講義、教材、工具等）</p>
        </div>

        <!-- 特殊需求 -->
        <div class="field">
          <label class="label">特殊需求或備註</label>
          <div class="control">
            <textarea
              v-model="form.specialRequirements"
              class="textarea"
              placeholder="如有特殊需求或備註請在此說明"
              rows="2"
            ></textarea>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="field is-grouped is-grouped-centered">
          <div class="control">
            <button
              type="submit"
              class="button is-primary is-large"
              :class="{ 'is-loading': isSubmitting }"
              :disabled="isSubmitting"
            >
              <span class="icon">
                <i class="fas fa-paper-plane"></i>
              </span>
              <span>提交申請</span>
            </button>
          </div>
          <div class="control">
            <button type="button" class="button is-light is-large" @click="resetForm">
              <span class="icon">
                <i class="fas fa-undo"></i>
              </span>
              <span>重置表單</span>
            </button>
          </div>
        </div>
      </form>

      <!-- 成功訊息 -->
      <div v-if="showSuccessMessage" class="notification is-success mt-4">
        <button class="delete" @click="showSuccessMessage = false"></button>
        <strong>申請提交成功！</strong>
        <p>您的開課申請已提交，我們會盡快審核並與您聯繫。</p>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="notification is-danger mt-4">
        <button class="delete" @click="errorMessage = ''"></button>
        <strong>提交失敗！</strong>
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()

// 表單數據
const form = reactive({
  courseName: '',
  description: '',
  category: '',
  targetAudience: '',
  duration: null as number | null,
  price: null as number | null,
  deliveryMethods: [] as string[],
  syllabus: '',
  teachingExperience: '',
  materials: '',
  specialRequirements: ''
})

// 狀態
const isSubmitting = ref(false)
const showSuccessMessage = ref(false)
const errorMessage = ref('')

// 提交申請
async function submitApplication() {
  if (isSubmitting.value) return

  // 驗證表單
  if (!validateForm()) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const response = await api.post('/course-applications', {
      course_name: form.courseName,
      description: form.description,
      category: form.category,
      target_audience: form.targetAudience,
      duration: form.duration,
      price: form.price,
      delivery_methods: form.deliveryMethods.join(','),
      syllabus: form.syllabus,
      teaching_experience: form.teachingExperience,
      materials: form.materials,
      special_requirements: form.specialRequirements
    })

    if (response.data?.success) {
      showSuccessMessage.value = true
      resetForm()

      // 3秒後跳轉到講師儀表板
      setTimeout(() => {
        router.push('/instructor/dashboard')
      }, 3000)
    } else {
      errorMessage.value = response.data?.message || '提交失敗，請稍後再試'
    }
  } catch (error: any) {
    console.error('提交開課申請失敗:', error)
    errorMessage.value = error.response?.data?.message || '提交失敗，請稍後再試'
  } finally {
    isSubmitting.value = false
  }
}

// 驗證表單
function validateForm(): boolean {
  if (!form.courseName.trim()) {
    errorMessage.value = '請輸入課程名稱'
    return false
  }

  if (!form.description.trim()) {
    errorMessage.value = '請輸入課程簡介'
    return false
  }

  if (!form.category) {
    errorMessage.value = '請選擇課程分類'
    return false
  }

  if (!form.targetAudience) {
    errorMessage.value = '請選擇目標族群'
    return false
  }

  if (!form.duration || form.duration <= 0) {
    errorMessage.value = '請輸入有效的課程時數'
    return false
  }

  if (form.price === null || form.price < 0) {
    errorMessage.value = '請輸入有效的課程費用'
    return false
  }

  if (form.deliveryMethods.length === 0) {
    errorMessage.value = '請至少選擇一種授課方式'
    return false
  }

  if (!form.syllabus.trim()) {
    errorMessage.value = '請輸入課程大綱'
    return false
  }

  if (!form.teachingExperience.trim()) {
    errorMessage.value = '請描述您的教學經驗'
    return false
  }

  return true
}

// 重置表單
function resetForm() {
  Object.assign(form, {
    courseName: '',
    description: '',
    category: '',
    targetAudience: '',
    duration: null,
    price: null,
    deliveryMethods: [],
    syllabus: '',
    teachingExperience: '',
    materials: '',
    specialRequirements: ''
  })
  errorMessage.value = ''
  showSuccessMessage.value = false
}
</script>

<style scoped>
.container {
  padding: 2rem 1rem;
}

.box {
  max-width: 800px;
  margin: 0 auto;
}

.field {
  margin-bottom: 1.5rem;
}

.checkbox {
  margin-right: 1rem;
}

.notification {
  margin-top: 1rem;
}

.button.is-large {
  padding: 1rem 2rem;
}

@media (max-width: 768px) {
  .columns {
    flex-direction: column;
  }

  .field.is-grouped-multiline .control {
    margin-bottom: 0.5rem;
  }
}
</style>
