<template>
  <div class="modal" :class="{ 'is-active': isActive }">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">評價講師</p>
        <button class="delete" @click="close"></button>
      </header>
      <section class="modal-card-body">
        <div v-if="instructor">
          <div class="has-text-centered mb-4">
            <p class="title is-5">{{ instructor.first_name }} {{ instructor.last_name }}</p>
            <p class="subtitle is-6">{{ courseName }}</p>
          </div>

          <!-- Rating -->
          <div class="field">
            <label class="label">評分 <span class="has-text-danger">*</span></label>
            <div class="control has-text-centered">
              <div class="rating-stars">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  class="star-button"
                  :class="{ 'is-active': star <= rating }"
                  @click="rating = star"
                  @mouseenter="hoverRating = star"
                  @mouseleave="hoverRating = 0"
                >
                  <span class="icon is-large">
                    <i
                      class="fas fa-star"
                      :class="{
                        'has-text-warning': star <= (hoverRating || rating),
                        'has-text-grey-lighter': star > (hoverRating || rating)
                      }"
                    ></i>
                  </span>
                </button>
              </div>
              <p class="help">{{ ratingText }}</p>
            </div>
          </div>

          <!-- Comment -->
          <div class="field">
            <label class="label">評價內容</label>
            <div class="control">
              <textarea
                class="textarea"
                v-model="comment"
                placeholder="分享您對這位講師的評價（選填）"
                rows="4"
              ></textarea>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="notification is-danger">
            {{ errorMessage }}
          </div>

          <!-- Success message -->
          <div v-if="successMessage" class="notification is-success">
            {{ successMessage }}
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-primary"
          @click="submitRating"
          :disabled="!rating || isSubmitting"
        >
          {{ isSubmitting ? '提交中...' : '提交評價' }}
        </button>
        <button class="button" @click="close">取消</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import { api } from '@/services/api'

// Props
const props = defineProps<{
  isActive: boolean
  instructor: any
  courseId: number
  courseName: string
}>()

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Component state
const rating = ref(0)
const hoverRating = ref(0)
const comment = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed rating text
const ratingText = computed(() => {
  const currentRating = hoverRating.value || rating.value
  const texts = ['', '非常不滿意', '不滿意', '普通', '滿意', '非常滿意']
  return texts[currentRating] || '請選擇評分'
})

// Submit rating
const submitRating = async () => {
  if (!rating.value) {
    errorMessage.value = '請選擇評分'
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    await api.post(`/instructors/${props.instructor.id}/rate`, {
      rating: rating.value,
      comment: comment.value,
      course_id: props.courseId
    })

    successMessage.value = '評價已提交，感謝您的回饋！'

    // Wait a bit to show success message
    setTimeout(() => {
      emit('success')
      close()
    }, 1500)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error?.message || '提交評價失敗'
  } finally {
    isSubmitting.value = false
  }
}

// Close modal
const close = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

// Reset form when modal opens
watch(() => props.isActive, (newValue) => {
  if (newValue) {
    rating.value = 0
    hoverRating.value = 0
    comment.value = ''
    errorMessage.value = ''
    successMessage.value = ''
  }
})
</script>

<style scoped>
.rating-stars {
  display: inline-flex;
  gap: 0.5rem;
}

.star-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s;
}

.star-button:hover {
  transform: scale(1.2);
}

.star-button:focus {
  outline: none;
}
</style>
