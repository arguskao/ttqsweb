<template>
  <form
    class="responsive-form"
    :class="formClasses"
    @submit.prevent="handleSubmit"
  >
    <div class="form-header" v-if="$slots.header">
      <slot name="header" />
    </div>

    <div class="form-body">
      <slot />
    </div>

    <div class="form-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'inline' | 'horizontal'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'medium',
  loading: false,
  disabled: false
})

const emit = defineEmits<{
  submit: [event: Event]
}>()

const formClasses = computed(() => ({
  [`form-${props.variant}`]: true,
  [`form-${props.size}`]: true,
  'form-loading': props.loading,
  'form-disabled': props.disabled
}))

const handleSubmit = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('submit', event)
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/responsive.scss';

.responsive-form {
  @include responsive-form;

  // 變體樣式
  &.form-inline {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 1rem;

    @include mobile {
      flex-direction: column;
      align-items: stretch;
    }

    .field {
      flex: 1;
      min-width: 200px;

      @include mobile {
        min-width: auto;
      }
    }
  }

  &.form-horizontal {
    .field {
      display: flex;
      align-items: center;
      gap: 1rem;

      @include mobile {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .field-label {
        flex: 0 0 150px;
        text-align: right;

        @include mobile {
          flex: none;
          text-align: left;
        }
      }

      .field-body {
        flex: 1;
      }
    }
  }

  // 尺寸樣式
  &.form-small {
    .input,
    .textarea,
    .select select,
    .button {
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      min-height: 36px;
    }
  }

  &.form-medium {
    .input,
    .textarea,
    .select select,
    .button {
      font-size: 1rem;
      padding: 0.75rem 1rem;
      min-height: 44px;
    }
  }

  &.form-large {
    .input,
    .textarea,
    .select select,
    .button {
      font-size: 1.125rem;
      padding: 1rem 1.25rem;
      min-height: 52px;
    }
  }

  // 狀態樣式
  &.form-loading {
    pointer-events: none;
    opacity: 0.7;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
  }

  &.form-disabled {
    pointer-events: none;
    opacity: 0.6;
  }

  .form-header {
    margin-bottom: 2rem;

    @include mobile {
      margin-bottom: 1.5rem;
    }
  }

  .form-body {
    margin-bottom: 2rem;

    @include mobile {
      margin-bottom: 1.5rem;
    }
  }

  .form-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;

    @include mobile {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
}

// 表單字段樣式
.field {
  margin-bottom: 1.5rem;

  @include mobile {
    margin-bottom: 1rem;
  }

  .field-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #363636;

    &.is-small {
      font-size: 0.75rem;
    }

    &.is-medium {
      font-size: 1rem;
    }

    &.is-large {
      font-size: 1.25rem;
    }
  }

  .field-body {
    .input,
    .textarea,
    .select select {
      width: 100%;
      border: 1px solid #dbdbdb;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        border-color: #3273dc;
        box-shadow: 0 0 0 0.125em rgba(50, 115, 220, 0.25);
        outline: none;
      }

      &:invalid {
        border-color: #ff3860;
      }

      @include mobile {
        font-size: 16px; // 防止 iOS 縮放
      }
    }

    .textarea {
      resize: vertical;
      min-height: 120px;
    }

    .select {
      position: relative;

      select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
      }
    }
  }

  .help {
    font-size: 0.75rem;
    margin-top: 0.25rem;

    &.is-danger {
      color: #ff3860;
    }

    &.is-success {
      color: #48c774;
    }
  }
}

// 按鈕樣式
.button {
  @include touch-friendly-button;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &.is-primary {
    background: #3273dc;
    color: white;

    &:hover {
      background: #2366d1;
    }
  }

  &.is-secondary {
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
    }
  }

  &.is-success {
    background: #48c774;
    color: white;

    &:hover {
      background: #3ec46d;
    }
  }

  &.is-danger {
    background: #ff3860;
    color: white;

    &:hover {
      background: #ff1443;
    }
  }

  &.is-light {
    background: #f5f5f5;
    color: #363636;
    border: 1px solid #dbdbdb;

    &:hover {
      background: #e8e8e8;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 觸摸設備優化
@include touch-device {
  .button {
    min-height: 48px;
    min-width: 48px;
  }

  .input,
  .textarea,
  .select select {
    min-height: 48px;
  }
}

// 深色模式支持
@include dark-mode {
  .field-label {
    color: #fff;
  }

  .input,
  .textarea,
  .select select {
    background: #2a2a2a;
    border-color: #444;
    color: #fff;

    &:focus {
      border-color: #3273dc;
    }
  }

  .button.is-light {
    background: #444;
    color: #fff;
    border-color: #666;

    &:hover {
      background: #555;
    }
  }
}

// 高對比度模式
@include high-contrast {
  .input,
  .textarea,
  .select select {
    border-width: 2px;

    &:focus {
      border-width: 3px;
    }
  }

  .button {
    border: 2px solid currentColor;
  }
}

// 減少動畫偏好
@include reduced-motion {
  .input,
  .textarea,
  .select select,
  .button {
    transition: none;
  }
}
</style>
