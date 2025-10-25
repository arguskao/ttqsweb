<template>
  <div class="login-view">
    <section class="section">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="card">
              <div class="card-content">
                <div class="has-text-centered mb-5">
                  <h1 class="title is-3">登入</h1>
                  <p class="subtitle">歡迎回到藥助Next學院</p>
                </div>

                <!-- Error message -->
                <div v-if="errorMessage" class="notification is-danger">
                  <button class="delete" @click="errorMessage = ''"></button>
                  {{ errorMessage }}
                </div>

                <form @submit.prevent="handleLogin">
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
                      />
                      <span class="icon is-small is-left">
                        <span>✉️</span>
                      </span>
                    </div>
                    <p v-if="errors.email" class="help is-danger">{{ errors.email }}</p>
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
                      />
                      <span class="icon is-small is-left">
                        <span>🔒</span>
                      </span>
                    </div>
                    <p v-if="errors.password" class="help is-danger">{{ errors.password }}</p>
                  </div>

                  <div class="field">
                    <div class="control">
                      <button
                        class="button is-primary is-fullwidth"
                        type="submit"
                        :class="{ 'is-loading': isLoading }"
                        :disabled="isLoading"
                      >
                        登入
                      </button>
                    </div>
                  </div>
                </form>

                <div class="has-text-centered mt-4">
                  <p>
                    還沒有帳號？
                    <router-link to="/register" class="has-text-primary">立即註冊</router-link>
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
  validateRequired,
  validationMessages
} from '@/services/auth-service'
import type { LoginCredentials } from '@/types'

const router = useRouter()

// Form data
const form = reactive<LoginCredentials>({
  email: '',
  password: ''
})

// Form state
const isLoading = ref(false)
const errorMessage = ref('')
const errors = reactive({
  email: '',
  password: ''
})

// Validate form
const validateForm = (): boolean => {
  // Reset errors
  errors.email = ''
  errors.password = ''

  let isValid = true

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
  }

  return isValid
}

// Handle login
const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authService.login(form)

    // Redirect to home page or dashboard
    router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登入失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}
</script>
