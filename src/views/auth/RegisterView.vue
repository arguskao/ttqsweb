<template>
  <div class="register-view">
    <section class="section">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="card">
              <div class="card-content">
                <div class="has-text-centered mb-5">
                  <h1 class="title is-3">註冊</h1>
                  <p class="subtitle">加入藥助Next學院</p>
                </div>

                <!-- Error message -->
                <div v-if="errorMessage" class="notification is-danger">
                  <button class="delete" @click="errorMessage = ''"></button>
                  {{ errorMessage }}
                </div>

                <!-- Success message -->
                <div v-if="successMessage" class="notification is-success">
                  <button class="delete" @click="successMessage = ''"></button>
                  {{ successMessage }}
                </div>

                <form @submit.prevent="handleRegister">
                  <div class="field">
                    <label class="label">身份類型</label>
                    <div class="control">
                      <div class="select is-fullwidth" :class="{ 'is-danger': errors.userType }">
                        <select v-model="form.userType" :disabled="isLoading">
                          <option value="">請選擇身份類型</option>
                          <option value="job_seeker">求職者</option>
                          <option value="employer">雇主</option>
                          <option value="instructor">講師</option>
                        </select>
                      </div>
                    </div>
                    <p v-if="errors.userType" class="help is-danger">{{ errors.userType }}</p>
                  </div>

                  <div class="columns">
                    <div class="column">
                      <div class="field">
                        <label class="label">姓</label>
                        <div class="control">
                          <input
                            class="input"
                            :class="{ 'is-danger': errors.lastName }"
                            type="text"
                            placeholder="請輸入姓氏"
                            v-model="form.lastName"
                            :disabled="isLoading"
                            autocomplete="family-name"
                          />
                        </div>
                        <p v-if="errors.lastName" class="help is-danger">{{ errors.lastName }}</p>
                      </div>
                    </div>
                    <div class="column">
                      <div class="field">
                        <label class="label">名</label>
                        <div class="control">
                          <input
                            class="input"
                            :class="{ 'is-danger': errors.firstName }"
                            type="text"
                            placeholder="請輸入名字"
                            v-model="form.firstName"
                            :disabled="isLoading"
                            autocomplete="given-name"
                          />
                        </div>
                        <p v-if="errors.firstName" class="help is-danger">{{ errors.firstName }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">電子郵件</label>
                    <div class="control has-icons-left">
                      <input
                        class="input"
                        :class="{ 'is-danger': errors.email }"
                        type="email"
                        placeholder="請輸入電子郵件"
                        v-model="form.email"
                        :disabled="isLoading"
                        autocomplete="email"
                      />
                      <span class="icon is-small is-left">
                        <span>✉️</span>
                      </span>
                    </div>
                    <p v-if="errors.email" class="help is-danger">{{ errors.email }}</p>
                  </div>

                  <div class="field">
                    <label class="label">電話號碼 (選填)</label>
                    <div class="control has-icons-left">
                      <input
                        class="input"
                        type="tel"
                        placeholder="請輸入電話號碼"
                        v-model="form.phone"
                        :disabled="isLoading"
                      />
                      <span class="icon is-small is-left">
                        <span>📞</span>
                      </span>
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">密碼</label>
                    <div class="control has-icons-left">
                      <input
                        class="input"
                        :class="{ 'is-danger': errors.password }"
                        type="password"
                        placeholder="請輸入密碼"
                        v-model="form.password"
                        :disabled="isLoading"
                        autocomplete="new-password"
                      />
                      <span class="icon is-small is-left">
                        <span>🔒</span>
                      </span>
                    </div>
                    <p v-if="errors.password" class="help is-danger">{{ errors.password }}</p>
                    <p class="help">密碼必須至少8個字符，包含字母和數字</p>
                  </div>

                  <div class="field">
                    <label class="label">確認密碼</label>
                    <div class="control has-icons-left">
                      <input
                        class="input"
                        :class="{ 'is-danger': errors.confirmPassword }"
                        type="password"
                        placeholder="請再次輸入密碼"
                        v-model="form.confirmPassword"
                        :disabled="isLoading"
                        autocomplete="new-password"
                      />
                      <span class="icon is-small is-left">
                        <span>🔒</span>
                      </span>
                    </div>
                    <p v-if="errors.confirmPassword" class="help is-danger">
                      {{ errors.confirmPassword }}
                    </p>
                  </div>

                  <div class="field">
                    <div class="control">
                      <button
                        class="button is-primary is-fullwidth"
                        type="submit"
                        :class="{ 'is-loading': isLoading }"
                        :disabled="isLoading"
                      >
                        註冊
                      </button>
                    </div>
                  </div>
                </form>

                <div class="has-text-centered mt-4">
                  <p>
                    已有帳號？
                    <router-link to="/login" class="has-text-primary">立即登入</router-link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

import {
  authService,
  validateEmail,
  validatePassword,
  validateRequired,
  validationMessages
} from '@/services/auth-service-enhanced'
import type { RegisterData } from '@/types'

const router = useRouter()

// Form data
const form = reactive<RegisterData>({
  email: '',
  password: '',
  userType: 'job_seeker',
  firstName: '',
  lastName: '',
  phone: '',
  confirmPassword: ''
})

const confirmPassword = ref('')

// Form state
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const errors = reactive({
  userType: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Validate form
const validateForm = (): boolean => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  // Validate user type
  if (!validateRequired(form.userType)) {
    errors.userType = validationMessages.userType
    isValid = false
  }

  // Validate first name
  if (!validateRequired(form.firstName)) {
    errors.firstName = validationMessages.required
    isValid = false
  }

  // Validate last name
  if (!validateRequired(form.lastName)) {
    errors.lastName = validationMessages.required
    isValid = false
  }

  // Validate email
  if (!validateRequired(form.email)) {
    errors.email = validationMessages.required
    isValid = false
  } else if (!validateEmail(form.email)) {
    errors.email = validationMessages.email
    isValid = false
  }

  // Validate password
  if (!validateRequired(form.password)) {
    errors.password = validationMessages.required
    isValid = false
  } else if (!validatePassword(form.password)) {
    errors.password = validationMessages.password
    isValid = false
  }

  // Validate password confirmation
  if (!validateRequired(form.confirmPassword)) {
    errors.confirmPassword = validationMessages.required
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = validationMessages.passwordMatch
    isValid = false
  }

  return isValid
}

// Handle registration
const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authService.register(form)

    successMessage.value = '註冊成功！正在跳轉...'

    // Redirect to home page after a short delay
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '註冊失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}
</script>
