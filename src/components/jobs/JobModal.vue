<template>
  <div class="modal" :class="{ 'is-active': isVisible }">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          {{ isEditing ? '編輯職缺' : '發布新職缺' }}
        </p>
        <button class="delete" aria-label="close" @click="$emit('close')"></button>
      </header>

      <section class="modal-card-body">
        <form @submit.prevent="handleSubmit">
          <div class="columns">
            <div class="column is-6">
              <div class="field">
                <label class="label">職缺標題 *</label>
                <div class="control">
                  <input
                    v-model="formData.title"
                    class="input"
                    type="text"
                    placeholder="例如：藥局助理"
                    required
                  />
                </div>
                <p class="help is-danger" v-if="errors.title">{{ errors.title }}</p>
              </div>
            </div>
            <div class="column is-6">
              <div class="field">
                <label class="label">工作地點 *</label>
                <div class="control">
                  <input
                    v-model="formData.location"
                    class="input"
                    type="text"
                    placeholder="例如：台北市信義區"
                    required
                  />
                </div>
                <p class="help is-danger" v-if="errors.location">{{ errors.location }}</p>
              </div>
            </div>
          </div>

          <div class="columns">
            <div class="column is-4">
              <div class="field">
                <label class="label">薪資範圍</label>
                <div class="control">
                  <input
                    v-model="formData.salary"
                    class="input"
                    type="number"
                    placeholder="例如：30000"
                    min="0"
                  />
                </div>
                <p class="help">留空表示面議</p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">工作類型 *</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="formData.employmentType" required>
                      <option value="">請選擇</option>
                      <option value="full_time">全職</option>
                      <option value="part_time">兼職</option>
                      <option value="contract">約聘</option>
                      <option value="internship">實習</option>
                    </select>
                  </div>
                </div>
                <p class="help is-danger" v-if="errors.employmentType">{{ errors.employmentType }}</p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">過期日期</label>
                <div class="control">
                  <input
                    v-model="formData.expiresAt"
                    class="input"
                    type="date"
                    :min="minDate"
                  />
                </div>
                <p class="help">留空表示無期限</p>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">職缺描述 *</label>
            <div class="control">
              <textarea
                v-model="formData.description"
                class="textarea"
                placeholder="請詳細描述工作內容、要求條件、福利待遇等..."
                rows="6"
                required
              ></textarea>
            </div>
            <p class="help is-danger" v-if="errors.description">{{ errors.description }}</p>
          </div>

          <div class="field">
            <label class="label">工作要求</label>
            <div class="control">
              <textarea
                v-model="formData.requirements"
                class="textarea"
                placeholder="請列出具體的工作要求，如學歷、經驗、技能等..."
                rows="4"
              ></textarea>
            </div>
          </div>

          <div class="field">
            <label class="label">福利待遇</label>
            <div class="control">
              <textarea
                v-model="formData.benefits"
                class="textarea"
                placeholder="請列出公司提供的福利待遇..."
                rows="3"
              ></textarea>
            </div>
          </div>

          <div class="columns">
            <div class="column is-6">
              <div class="field">
                <label class="label">聯絡人</label>
                <div class="control">
                  <input
                    v-model="formData.contactPerson"
                    class="input"
                    type="text"
                    placeholder="聯絡人姓名"
                  />
                </div>
              </div>
            </div>
            <div class="column is-6">
              <div class="field">
                <label class="label">聯絡電話</label>
                <div class="control">
                  <input
                    v-model="formData.contactPhone"
                    class="input"
                    type="tel"
                    placeholder="聯絡電話"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">聯絡信箱</label>
            <div class="control">
              <input
                v-model="formData.contactEmail"
                class="input"
                type="email"
                placeholder="聯絡信箱"
              />
            </div>
          </div>
        </form>
      </section>

      <footer class="modal-card-foot">
        <button
          class="button is-primary"
          :class="{ 'is-loading': isSubmitting }"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? '處理中...' : (isEditing ? '更新職缺' : '發布職缺') }}
        </button>
        <button class="button" @click="$emit('close')">取消</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface JobFormData {
  title: string
  description: string
  location: string
  salary: number | null
  employmentType: string
  expiresAt: string | null
  requirements: string
  benefits: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
}

interface Props {
  isVisible: boolean
  isEditing: boolean
  jobData?: JobFormData | null
  isSubmitting?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [data: JobFormData]
}>()

const formData = ref<JobFormData>({
  title: '',
  description: '',
  location: '',
  salary: null,
  employmentType: '',
  expiresAt: null,
  requirements: '',
  benefits: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: ''
})

const errors = ref<Partial<JobFormData>>({})

const minDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.title.trim()) {
    errors.value.title = '請輸入職缺標題'
  }

  if (!formData.value.description.trim()) {
    errors.value.description = '請輸入職缺描述'
  }

  if (!formData.value.location.trim()) {
    errors.value.location = '請輸入工作地點'
  }

  if (!formData.value.employmentType) {
    errors.value.employmentType = '請選擇工作類型'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  emit('submit', { ...formData.value })
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    location: '',
    salary: null,
    employmentType: '',
    expiresAt: null,
    requirements: '',
    benefits: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  }
  errors.value = {}
}

// 監聽模態框顯示狀態，重置表單
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    if (props.isEditing && props.jobData) {
      formData.value = { ...props.jobData }
    } else {
      resetForm()
    }
  }
})

// 監聽編輯數據變化
watch(() => props.jobData, (jobData) => {
  if (jobData && props.isEditing) {
    formData.value = { ...jobData }
  }
})
</script>

<style scoped>
.modal-card {
  width: 90%;
  max-width: 800px;
}

.modal-card-body {
  max-height: 70vh;
  overflow-y: auto;
}

.field {
  margin-bottom: 1rem;
}

.help {
  margin-top: 0.25rem;
}

.help.is-danger {
  color: #ff3860;
}

.textarea {
  resize: vertical;
}

.button.is-loading {
  pointer-events: none;
}
</style>
